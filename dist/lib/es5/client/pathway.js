"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var PathwayUI = function (_a) {
    var apiKey = _a.apiKey, orgId = _a.orgId, pathwayId = _a.pathwayId, style = _a.style;
    var iframeRef = React.useRef(null);
    React.useEffect(function () {
        var iframe = iframeRef.current;
        if (!iframe)
            return;
        var handleLoad = function () {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'setApiKey', apiKey: apiKey }, '*');
                iframe.contentWindow.postMessage({ type: 'setOrgId', orgId: orgId }, '*');
            }
        };
        iframe.addEventListener('load', handleLoad);
        return function () {
            iframe.removeEventListener('load', handleLoad);
        };
    }, [apiKey]);
    var iframeSrc = "https://app.bland.ai/embed-pathway?id=".concat(pathwayId);
    var defaultStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        overflow: 'hidden',
    };
    return React.createElement('iframe', {
        ref: iframeRef,
        src: iframeSrc,
        style: __assign(__assign({}, defaultStyle), style),
        allow: "clipboard-write",
        title: "Bland Conversational Pathway"
    });
};
exports.default = PathwayUI;
