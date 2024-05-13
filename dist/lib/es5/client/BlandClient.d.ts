import { EventEmitter } from "eventemitter3";
interface StartConversationConfig {
    callId: string;
    sampleRate: number;
    customStream?: MediaStream;
    enableUpdate?: boolean;
}
export declare class BlandWebClient extends EventEmitter {
    private liveClient;
    private audioContext;
    private isCalling;
    private stream;
    private gainNode;
    private audioNode;
    private customEndpoint;
    private captureNode;
    private audioData;
    private audioDataIndex;
    isTalking: boolean;
    private marks;
    private transcripts;
    private lastTranscriptUser;
    private agentId;
    private sessionToken;
    constructor(agentId: string, sessionToken: string, customEndpoint?: string);
    isTalkingToAgent(): boolean;
    initConversation(config: StartConversationConfig): Promise<void>;
    stopConversation(): void;
    private setupAudioPlayback;
    private handleAudioEvents;
    private clearMarkMessages;
    private isAudioWorkletSupported;
    private playAudio;
}
export {};
