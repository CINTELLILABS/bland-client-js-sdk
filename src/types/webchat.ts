export type IWebchatState = "closed" | "connecting" | "open" | "closing";

export interface IWebchatConfiguration {
    agentId?: string
    sessionId?: string
    sampleRate?: number
}

export interface IWebchatWSSettings {
    interval: number
    timeout: number
}