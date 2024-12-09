var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { EventEmitter } from "eventemitter3";
import Websocket from "isomorphic-ws";
import { workletCode } from "./audioWorklet";
var baseEndpoint = "wss://stream.aws.dc5.bland.ai/ws/connect/blandshared";
;
;
;
;
function convertUint8ToFloat32(array) {
    var targetArray = new Float32Array(array.byteLength / 2);
    // A DataView is used to read our 16-bit little-endian samples out of the Uint8Array buffer
    var sourceDataView = new DataView(array.buffer);
    // Loop through, get values, and divide by 32,768
    for (var i = 0; i < targetArray.length; i++) {
        targetArray[i] = sourceDataView.getInt16(i * 2, true) / Math.pow(2, 16 - 1);
    }
    return targetArray;
}
function convertFloat32ToUint8(array) {
    var buffer = new ArrayBuffer(array.length * 2);
    var view = new DataView(buffer);
    for (var i = 0; i < array.length; i++) {
        var value = array[i] * 32768;
        view.setInt16(i * 2, value, true); // true for little-endian
    }
    return new Uint8Array(buffer);
}
var AudioWsClient = /** @class */ (function (_super) {
    __extends(AudioWsClient, _super);
    // when last mark, end the conversation;
    function AudioWsClient(audioWsConfig) {
        var _this = _super.call(this) || this;
        _this.pingTimeout = null;
        _this.pingInterval = null;
        _this.wasDisconnected = false;
        _this.pingIntervalTime = 5000;
        _this.audioIndex = 0;
        _this.marks = [];
        var endpoint = baseEndpoint + "?agent=".concat(audioWsConfig.agentId, "&token=").concat(audioWsConfig.sessionToken, "&background_noise=").concat(audioWsConfig.backgroundNoise);
        _this.ws = new Websocket(endpoint);
        _this.ws.binaryType = "arraybuffer";
        _this.ws.onopen = function () {
            _this.emit("open");
            // this.startPingPong();
        };
        _this.ws.onmessage = function (event) {
            var _a;
            if (typeof event.data === "string" && event.data === "pong") {
                if (_this.wasDisconnected) {
                    _this.emit("reconnect");
                    _this.wasDisconnected = false;
                }
                ;
                _this.adjustPingFrequency(5000);
            }
            else if (event.data instanceof ArrayBuffer) {
                var audioData = new Uint8Array(event.data);
                _this.audioIndex++;
                _this.emit("audio", audioData);
            }
            else if (typeof (event.data) === "string") {
                if (event.data === "clear") {
                    _this.emit("clear");
                }
                else {
                    var messageData = JSON.parse(event.data);
                    var eventName = messageData === null || messageData === void 0 ? void 0 : messageData.event;
                    var markName = (_a = messageData === null || messageData === void 0 ? void 0 : messageData.mark) === null || _a === void 0 ? void 0 : _a.name;
                    if (eventName === "mark") {
                        _this.emit("mark", markName);
                    }
                    else if (eventName === "update") {
                        _this.emit("update", messageData);
                    }
                    ;
                }
                ;
            }
            ;
        };
        _this.ws.onclose = function (event) {
            // this.stopPingPong();
            _this.emit("close", event.code, event.reason);
        };
        _this.ws.onerror = function (event) {
            // this.stopPingPong();
            _this.emit("error", event);
        };
        return _this;
    }
    ;
    AudioWsClient.prototype.sendPing = function () {
        if (this.ws.readyState === 1) {
            this.ws.send("ping");
        }
        ;
    };
    ;
    AudioWsClient.prototype.resetPingTimeout = function () {
        var _this = this;
        if (this.pingTimeout != null) {
            clearTimeout(this.pingTimeout);
        }
        this.pingTimeout = setTimeout(function () {
            if (_this.pingIntervalTime === 5000) {
                _this.adjustPingFrequency(1000);
                _this.pingTimeout = setTimeout(function () {
                    _this.emit("disconnect");
                    _this.wasDisconnected = true;
                }, 3000);
            }
        }, this.pingIntervalTime);
    };
    ;
    AudioWsClient.prototype.adjustPingFrequency = function (newInterval) {
        if (this.pingIntervalTime !== newInterval) {
            if (this.pingInterval != null) {
                clearInterval(this.pingInterval);
            }
            this.pingIntervalTime = newInterval;
        }
    };
    ;
    AudioWsClient.prototype.send = function (audio) {
        if (this.ws.readyState === 1) {
            this.ws.send(audio);
        }
        ;
    };
    ;
    AudioWsClient.prototype.sendUtf = function (message) {
        if (this.ws.readyState === 1) {
            this.ws.send(message);
        }
        ;
    };
    ;
    AudioWsClient.prototype.close = function () {
        this.ws.close();
    };
    ;
    return AudioWsClient;
}(EventEmitter));
;
var BlandWebClient = /** @class */ (function (_super) {
    __extends(BlandWebClient, _super);
    function BlandWebClient(agentId, sessionToken, options) {
        var _this = _super.call(this) || this;
        _this.isCalling = false;
        _this.backgroundNoise = true;
        // Others
        _this.captureNode = null;
        _this.audioData = [];
        _this.audioDataIndex = 0;
        _this.isTalking = false;
        _this.marks = [];
        _this.transcripts = [];
        _this.lastProcessId = "";
        if (options.customEndpoint)
            _this.customEndpoint = options.customEndpoint;
        if (options.backgroundNoise !== undefined)
            _this.backgroundNoise = options.backgroundNoise;
        _this.agentId = agentId;
        _this.sessionToken = sessionToken;
        _this.isTalking = false;
        return _this;
    }
    ;
    BlandWebClient.prototype.isTalkingToAgent = function () {
        return this.isTalking;
    };
    ;
    // bland initialize();
    BlandWebClient.prototype.initConversation = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.setupAudioPlayback(config.sampleRate, config.customStream)];
                    case 1:
                        _a.sent();
                        this.liveClient = new AudioWsClient({
                            callId: "test",
                            customEndpoint: this.customEndpoint,
                            agentId: this.agentId,
                            sessionToken: this.sessionToken,
                            backgroundNoise: this.backgroundNoise
                        });
                        this.handleAudioEvents();
                        this.isCalling = true;
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.emit("Error", error_1.message);
                        return [3 /*break*/, 3];
                    case 3:
                        ;
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    BlandWebClient.prototype.stopConversation = function () {
        var _a, _b, _c, _d, _e;
        this.isCalling = false;
        (_a = this.liveClient) === null || _a === void 0 ? void 0 : _a.close();
        (_b = this.audioContext) === null || _b === void 0 ? void 0 : _b.suspend();
        (_c = this.audioContext) === null || _c === void 0 ? void 0 : _c.close();
        if (this.isAudioWorkletSupported()) {
            (_d = this.audioNode) === null || _d === void 0 ? void 0 : _d.disconnect();
            this.audioNode = null;
        }
        else {
            if (this.captureNode) {
                this.captureNode.disconnect();
                this.captureNode.onaudioprocess = null;
                this.captureNode = null;
                this.audioData = [];
                this.audioDataIndex = 0;
            }
        }
        this.liveClient = null;
        (_e = this.stream) === null || _e === void 0 ? void 0 : _e.getTracks().forEach(function (track) { return track.stop(); });
        this.audioContext = null;
        this.stream = null;
    };
    BlandWebClient.prototype.setupAudioPlayback = function (sampleRate, customStream) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, error_2, blob, blobUrl, source, source;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.audioContext = new AudioContext({ sampleRate: sampleRate });
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        _a = this;
                        _b = customStream;
                        if (_b) return [3 /*break*/, 3];
                        return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                                audio: {
                                    sampleRate: sampleRate,
                                    echoCancellation: true,
                                    noiseSuppression: true,
                                    channelCount: 1
                                }
                            })];
                    case 2:
                        _b = (_c.sent());
                        _c.label = 3;
                    case 3:
                        _a.stream = _b;
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _c.sent();
                        throw new Error("User rejected microphone access");
                    case 5:
                        ;
                        if (!this.isAudioWorkletSupported()) return [3 /*break*/, 7];
                        this.audioContext.resume();
                        blob = new Blob([workletCode], { type: "application/javascript" });
                        blobUrl = URL.createObjectURL(blob);
                        return [4 /*yield*/, this.audioContext.audioWorklet.addModule(blobUrl)];
                    case 6:
                        _c.sent();
                        this.audioNode = new AudioWorkletNode(this.audioContext, "capture-and-playback-processor");
                        this.audioNode.port.onmessage = function (event) {
                            var _a, _b;
                            var data = event.data;
                            if (Array.isArray(data)) {
                                var eventName = data[0];
                                if (eventName === "capture") {
                                    (_a = _this.liveClient) === null || _a === void 0 ? void 0 : _a.send(data[1]);
                                }
                                else if (eventName === "playback") {
                                    _this.emit("audio", data[1]);
                                }
                                else if (eventName === "mark") {
                                    (_b = _this.liveClient) === null || _b === void 0 ? void 0 : _b.sendUtf(JSON.stringify({
                                        event: "mark",
                                        mark: {
                                            name: data[1]
                                        }
                                    }));
                                }
                                else { }
                                ;
                            }
                            else {
                                if (data === "agent_stop_talking") {
                                    _this.emit("agentStopTalking");
                                    _this.emit("userStartTalking");
                                }
                                else if (data === "agent_start_talking") {
                                    _this.emit("agentStartTalking");
                                    _this.emit("userStopTalking");
                                }
                                ;
                            }
                            ;
                        };
                        source = this.audioContext.createMediaStreamSource(this.stream);
                        source.connect(this.audioNode);
                        this.audioNode.connect(this.audioContext.destination);
                        return [3 /*break*/, 8];
                    case 7:
                        source = this.audioContext.createMediaStreamSource(this.stream);
                        this.captureNode = this.audioContext.createScriptProcessor(2048, 1, 1);
                        this.captureNode.onaudioprocess = function (AudioProcessingEvent) {
                            if (_this.isCalling) {
                                var pcmFloat32Data = AudioProcessingEvent.inputBuffer.getChannelData(0);
                                var pcmData = convertFloat32ToUint8(pcmFloat32Data);
                                var bufferLength = pcmFloat32Data.length;
                                var outputData = new Int16Array(bufferLength);
                                for (var i = 0; i < bufferLength; i++) {
                                    var compression = 32767;
                                    var pcmSample = Math.max(-1, Math.min(1, pcmFloat32Data[i]));
                                    outputData[i] = pcmSample * compression;
                                }
                                ;
                                _this.liveClient.send(pcmData);
                                var outputBuffer = AudioProcessingEvent.outputBuffer;
                                var outputChannel = outputBuffer.getChannelData(0);
                                for (var i = 0; i < outputChannel.length; ++i) {
                                    if (_this.audioData.length > 0) {
                                        outputChannel[i] = _this.audioData[0][_this.audioDataIndex++];
                                        if (_this.audioDataIndex === _this.audioData[0].length) {
                                            _this.audioData.shift();
                                            _this.audioDataIndex = 0;
                                        }
                                        ;
                                    }
                                    else {
                                        outputChannel[i] = 0;
                                    }
                                    ;
                                }
                                ;
                                _this.emit("audio", convertFloat32ToUint8(outputChannel));
                                if (!_this.audioData.length && _this.isTalking) {
                                    _this.isTalking = false;
                                    _this.clearMarkMessages();
                                    _this.emit("agentStopTalking");
                                }
                                ;
                            }
                            ;
                        };
                        source.connect(this.captureNode);
                        this.captureNode.connect(this.audioContext.destination);
                        _c.label = 8;
                    case 8:
                        ;
                        return [2 /*return*/];
                }
            });
        });
    };
    ;
    BlandWebClient.prototype.handleAudioEvents = function () {
        var _this = this;
        // Exposed
        this.liveClient.on("open", function () {
            _this.emit("conversationStarted");
        });
        this.liveClient.on("audio", function (audio) {
            _this.playAudio(audio);
        });
        this.liveClient.on("disconnect", function () {
            _this.emit("disconnect");
        });
        this.liveClient.on("reconnect", function () {
            _this.emit("reconnect");
        });
        this.liveClient.on("error", function (error) {
            _this.emit("error", error);
            if (_this.isCalling) {
                _this.stopConversation();
            }
            ;
        });
        this.liveClient.on("close", function (code, reason) {
            if (_this.isCalling) {
                _this.stopConversation();
            }
            ;
            _this.emit("conversationEnded", { code: code, reason: reason });
        });
        this.liveClient.on("mark", function (mark) {
            if (_this.isAudioWorkletSupported()) {
                _this.audioNode.port.postMessage(mark);
            }
            else {
                if (!_this.isTalking) {
                    _this.liveClient.sendUtf(JSON.stringify({
                        event: "mark",
                        mark: {
                            name: mark
                        }
                    }));
                }
                else {
                    _this.marks.push(mark);
                }
                ;
            }
            ;
        });
        this.liveClient.on("update", function (update) {
            if (!(update === null || update === void 0 ? void 0 : update.payload))
                return;
            // this.handleNewUpdate(update?.payload as Transcript);
            _this.emit("transcripts", update === null || update === void 0 ? void 0 : update.payload);
        });
        // Not exposed
        this.liveClient.on("clear", function () {
            if (_this.isAudioWorkletSupported()) {
                _this.audioNode.port.postMessage("clear");
            }
            else {
                _this.audioData = [];
                _this.audioDataIndex = 0;
                if (_this.isTalking) {
                    _this.isTalking = false;
                    _this.clearMarkMessages();
                    _this.emit("agentStopTalking");
                }
            }
        });
    };
    ;
    BlandWebClient.prototype.handleNewUpdate = function (in_transcript) {
        var _a;
        if (!in_transcript.processId ||
            !in_transcript.packetId ||
            !in_transcript.text ||
            ((_a = in_transcript.text) === null || _a === void 0 ? void 0 : _a.length) === 0)
            return;
        var cachedTx = this.transcripts.find(function (transcript) { return (transcript.processId === in_transcript.processId &&
            transcript.type === in_transcript.type); }) || null;
        if (!cachedTx) {
            this.transcripts.push(in_transcript);
            cachedTx = in_transcript;
        }
        else {
            cachedTx.text += " ".concat(in_transcript.text);
            cachedTx.complete = in_transcript.complete;
        }
        ;
    };
    ;
    BlandWebClient.prototype.clearMarkMessages = function () {
        for (var _i = 0, _a = this.marks; _i < _a.length; _i++) {
            var message = _a[_i];
            this.liveClient.sendUtf(JSON.stringify({
                event: "mark",
                mark: {
                    name: message
                }
            }));
        }
        this.marks = [];
    };
    BlandWebClient.prototype.isAudioWorkletSupported = function () {
        return (/Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor));
    };
    ;
    BlandWebClient.prototype.playAudio = function (audio) {
        if (this.isAudioWorkletSupported()) {
            this.audioNode.port.postMessage(audio);
        }
        else {
            var float32Data = convertUint8ToFloat32(audio);
            this.audioData.push(float32Data);
            if (!this.isTalking) {
                this.isTalking = true;
                this.emit("agentStartTalking");
            }
            ;
        }
        ;
    };
    ;
    return BlandWebClient;
}(EventEmitter));
export { BlandWebClient };
;
