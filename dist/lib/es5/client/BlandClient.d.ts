import { EventEmitter } from "eventemitter3";
interface StartConversationConfig {
    callId: string;
    sampleRate: number;
    customStream?: MediaStream;
    enableUpdate?: boolean;
    backgroundNoise?: boolean;
}
export declare class BlandWebClient extends EventEmitter {
    private liveClient;
    private audioContext;
    private isCalling;
    private stream;
    private gainNode;
    private audioNode;
    private customEndpoint;
    private backgroundNoise;
    private captureNode;
    private audioData;
    private audioDataIndex;
    isTalking: boolean;
    private marks;
    private transcripts;
    private lastProcessId;
    private agentId;
    private sessionToken;
    constructor(agentId: string, sessionToken: string, options?: {
        customEndpoint?: string;
        backgroundNoise?: boolean;
    });
    isTalkingToAgent(): boolean;
    initConversation(config: StartConversationConfig): Promise<void>;
    stopConversation(): void;
    private setupAudioPlayback;
    private handleAudioEvents;
    private handleNewUpdate;
    private clearMarkMessages;
    private isAudioWorkletSupported;
    private playAudio;
}
export {};
