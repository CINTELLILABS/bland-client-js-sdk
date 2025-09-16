/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useWebchat } from "bland-client-js-sdk/react";

type Token = { token: string };

async function authorizeAgent(agentId: string): Promise<Token> {
  const r = await fetch("http://localhost:5174/api/agent-authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId })
  });
  if (!r.ok) throw new Error(`authorize error ${r.status}`);
  return r.json();
}

const rates = ["", "8000", "11025", "16000", "22050", "24000", "32000", "44100", "48000", "96000", "192000"];

export default function App() {
  const [agentId, setAgentId] = useState("abc123");
  const [sr, setSr] = useState<string>("");
  const [status, setStatus] = useState("idle");
  const logRef = useRef<HTMLDivElement | null>(null);

  const getToken = useMemo(() => {
    return async () => authorizeAgent(agentId);
  }, [agentId]);

  const { state, start, stop, webchat } = useWebchat({
    agentId,
    getToken,
    sampleRate: sr ? Number(sr) : undefined,
    endpoint: null
  });

  useEffect(() => {
    const off = [
      webchat.on("open", () => {
        setStatus("open");
        log("[Websocket][open]");
      }),
      webchat.on("closed", () => {
        setStatus("closed");
        log("[Websocket][closed]");
      }),
      webchat.on("error", (e: unknown) => {
        setStatus("closed");
        log(`[Websocket][error] ${stringify(e)}`);
      }),
      webchat.on("text", (raw: any) => {
        log(`[Websocket][text] ${raw}`);
      }),
      webchat.on("message", (m: any) => {
        log(`[Websocket][message] ${JSON.stringify(m)}`);
      }),
      webchat.on("update", (m: any) => {
        log(`[Websocket][update] ${JSON.stringify(m)}`);
      }),
      webchat.on("unknown", (d: unknown) => {
        log(`[Websocket][unknown] ${stringify(d)}`);
      })
    ];
    return () => off.forEach((u) => u());
  }, [webchat]);

  function stringify(v: unknown) {
    try {
      return typeof v === "string" ? v : JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  function log(line: string) {
    const ts = new Date().toISOString();
    const el = logRef.current;
    if (!el) return;
    el.textContent += `[${ts}] ${line}\n`;
    el.scrollTop = el.scrollHeight;
  }

  const onStart = async () => {
    try {
      setStatus("authorizing");
      await start();
    } catch (e) {
      setStatus("closed");
      log(String(e));
    }
  };

  const onStop = () => {
    try {
      stop();
    } finally {
      setStatus("closed");
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" }}>
      <h1 style={{ fontSize: 22, margin: "0 0 16px" }}>Bland SDK Harness</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
        <label htmlFor="agent">Agent</label>
        <input id="agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
        <label htmlFor="sr">Sample rate</label>
        <select id="sr" value={sr} onChange={(e) => setSr(e.target.value)}>
          {rates.map((r) => (
            <option key={r || "auto"} value={r}>
              {r || "auto"}
            </option>
          ))}
        </select>
        <button onClick={onStart} disabled={state !== "closed" && state !== "connecting"}>
          Start
        </button>
        <button onClick={onStop} disabled={state === "closed"}>
          Stop
        </button>
      </div>
      <div id="status" style={{ padding: "8px 10px", background: "#f5f5f5", borderRadius: 6, marginTop: 12, wordBreak: "break-word" }}>
        {status}
      </div>
      <div
        id="log"
        ref={logRef}
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "ui-monospace,Menlo,Consolas,monospace",
          background: "#0b1020",
          color: "#e6edf3",
          padding: 12,
          borderRadius: 6,
          marginTop: 12,
          maxHeight: 320,
          overflow: "auto"
        }}
      />
    </div>
  );
}
