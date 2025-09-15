import Websocket from "isomorphic-ws";

export type IWebchatState = Websocket.CLOSED | Websocket.CONNECTING | Websocket.OPEN | Websocket.CLOSING;

export interface IWebchatConfiguration {
    agentId?: string
    sessionId?: string
    sampleRate?: number
}

export interface IWebchatWSSettings {
    interval: number
    timeout: number
}