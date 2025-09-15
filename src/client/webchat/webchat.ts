import {
  IWebchatConfiguration,
  IWebchatState,
  IWebchatWSSettings,
} from "../../types/webchat";
import Base from "../base";
import Websocket from "isomorphic-ws";

class Webchat extends Base {
  state: IWebchatState;
  private connectionUrl: string | null = null;
  private websocket: Websocket | null = null;
  private wsSettings: IWebchatWSSettings;
  private lastActivityAt: number | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private micNode: AudioWorkletNode | null = null;
  private sinkGain: GainNode | null = null;

  constructor(options: any) {
    super(options);
    this.endpoint =
      options?.endpoint ||
      "wss://stream-v2.aws.dc8.bland.ai/ws/connect/blandshared";
    this.connectionUrl = null;
    this.wsSettings = { interval: 15000, timeout: 10000 };
    this.state = "closed";
  }

  private params(
    params: Record<string, string | boolean | number | undefined>
  ) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) q.append(k, String(v));
    }
    return q.toString();
  }

  public async start(config: IWebchatConfiguration) {
    if (this.state !== "closed") throw new Error("Webchat already started");
    this.state = "connecting";

    if (!config.sessionId) {
      this.state = "closed";
      throw new Error(
        "A session token is required to start the webchat. Please use the admin client server-side to generate a session token."
      );
    }

    if (!config.agentId) {
      this.state = "closed";
      throw new Error(
        "An agent ID is required to start the webchat. Please create an agent in the dashboard, and use the agent ID here."
      );
    }

    const wssUrl = `${this.endpoint}?${this.params({
      agent: config.agentId,
      token: config.sessionId,
    })}`;

    this.connectionUrl = wssUrl;
    this.websocket = this.create();
    this.websocket.binaryType = "arraybuffer";

    this.websocket.onopen = async () => {
      try {
        await this.initAudioWorklet(config.sampleRate);
        this.state = "open";
        this.keepAlive();
      } catch (e) {
        this.state = "closed";
        this.stop();
        throw e;
      }
    };

    this.websocket.onmessage = (evt: Websocket.MessageEvent) => {
      this.setActivity();
      if (evt.data instanceof ArrayBuffer) {
        const u8 = new Uint8Array(evt.data as ArrayBuffer);
        this.playPcm(u8);
      }
    };

    this.websocket.onclose = () => {
      this.keepAlive(true);
      this.teardownAudio();
      this.state = "closed";
    };

    this.websocket.onerror = () => {
      this.keepAlive(true);
      this.teardownAudio();
      this.state = "closed";
    };

    return this.websocket;
  }

  private create() {
    if (!this.connectionUrl) {
      this.state = "closed";
      throw new Error(
        "Connection URL is not set. Please call start() before creating the websocket connection."
      );
    }

    this.websocket = new Websocket(this.connectionUrl || "");
    return this.websocket;
  }

  public stop() {
    if (
      this.websocket &&
      (this.websocket.readyState === this.websocket.OPEN ||
        this.websocket.readyState === this.websocket.CONNECTING)
    ) {
      this.state = "closing";
      this.websocket.close();
    }
    this.keepAlive(true);
    this.teardownAudio();
  }

  private keepAlive(stop?: boolean) {
    if (stop) {
      if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
      this.lastActivityAt = null;
    } else {
      this.lastActivityAt = Date.now();
      if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = setInterval(() => {
        if (
          this.lastActivityAt &&
          Date.now() - this.lastActivityAt > this.wsSettings.timeout
        ) {
          this.stop();
          this.state = "closed";
        }
      }, this.wsSettings.interval);
    }
  }

  private setActivity() {
    this.lastActivityAt = Date.now();
  }

  private async initAudioWorklet(sampleRate?: number) {
    this.audioContext = new AudioContext(sampleRate ? { sampleRate } : {});
    const code = `
            class MicCaptureProcessor extends AudioWorkletProcessor {
                process(inputs) {
                    const ch = inputs[0] && inputs[0][0]
                    if (ch) {
                        const copy = new Float32Array(ch.length)
                        copy.set(ch)
                        this.port.postMessage(copy.buffer, [copy.buffer])
                    }
                    return true
                }
            }
            registerProcessor('mic-capture', MicCaptureProcessor)
        `;
    const blob = new Blob([code], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    this.micNode = new AudioWorkletNode(this.audioContext, "mic-capture");
    this.micNode.port.onmessage = (e: MessageEvent) => {
      if (!this.websocket || this.websocket.readyState !== this.websocket.OPEN)
        return;
      const f32 = new Float32Array(e.data as ArrayBuffer);
      const pcm = this.float32ToPCM16(f32);
      this.websocket.send(pcm);
    };

    const constraints: MediaStreamConstraints = {
      audio: {
        sampleRate: sampleRate,
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1,
      },
    };
    this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.sourceNode = this.audioContext.createMediaStreamSource(this.micStream);
    this.sinkGain = this.audioContext.createGain();
    this.sinkGain.gain.value = 0;

    this.sourceNode.connect(this.micNode);
    this.micNode.connect(this.sinkGain);
    this.sinkGain.connect(this.audioContext.destination);
    await this.audioContext.resume();
  }

  private teardownAudio() {
    if (this.micNode) {
      try {
        this.micNode.disconnect();
      } catch {}
      this.micNode.port.onmessage = null as any;
      this.micNode = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.sinkGain) {
      try {
        this.sinkGain.disconnect();
      } catch {}
      this.sinkGain = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private float32ToPCM16(f32: Float32Array) {
    const out = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return new Uint8Array(out.buffer);
  }

  private pcm16ToFloat32(u8: Uint8Array) {
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const len = u8.byteLength / 2;
    const f32 = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const s = dv.getInt16(i * 2, true);
      f32[i] = s / 0x8000;
    }
    return f32;
  }

  private playPcm(u8: Uint8Array) {
    if (!this.audioContext) return;
    const f32 = this.pcm16ToFloat32(u8);
    const buffer = this.audioContext.createBuffer(
      1,
      f32.length,
      this.audioContext.sampleRate
    );
    buffer.copyToChannel(f32, 0, 0);
    const src = this.audioContext.createBufferSource();
    src.buffer = buffer;
    src.connect(this.audioContext.destination);
    src.start();
  }
}

export default Webchat;
