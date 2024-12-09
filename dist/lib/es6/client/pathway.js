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
import * as React from 'react';
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
export default PathwayUI;
