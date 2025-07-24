import { EventEmitter } from "eventemitter3";
type Region = "US" | "canada" | "asia" | "europe";
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
    private region;
    private backgroundNoise;
    private regionToDatacenter;
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
        region?: Region;
    });
    isTalkingToAgent(): boolean;
    setRegion(region: Region): void;
    getCurrentRegion(): Region;
    initConversation(config: StartConversationConfig): Promise<void>;
    stopConversation(): void;
    private setupAudioPlayback;
    private handleAudioEvents;
    private handleNewUpdate;
    private clearMarkMessages;
    private isAudioWorkletSupported;
    private playAudio;
    private getRegionalEndpoint;
}
export {};
