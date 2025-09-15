import { useEffect, useMemo, useRef, useState } from "react";
import Webchat from "../client/webchat/webchat";
import type { IWebchatPublic } from "../client/webchat/webchat";
import type { IWebchatState } from "../types/webchat";

type Token = { token: string };
type TokenProvider = () => Promise<Token>;

type UseWebchatParams = {
  agentId: string;
  getToken: TokenProvider;
  sampleRate?: number;
  endpoint?: string | null;
};

type UseWebchatReturn = {
  state: IWebchatState;
  start: () => Promise<void>;
  stop: () => void;
  webchat: IWebchatPublic;
};

function createWebchat(ep?: string | null): IWebchatPublic {
  const w = new Webchat({ endpoint: ep });
  return w;
}

export function useWebchat(params: UseWebchatParams): UseWebchatReturn {
  const { agentId, getToken, sampleRate, endpoint } = params;
  const [state, setState] = useState<IWebchatState>("closed");
  const instanceRef = useRef<IWebchatPublic | null>(null);

  const wc = useMemo<IWebchatPublic>(() => {
    const w = createWebchat(endpoint);
    return w;
  }, [endpoint]);

  useEffect((): (() => void) => {
    instanceRef.current = wc;
    return (): void => {
      if (instanceRef.current) instanceRef.current.stop();
      instanceRef.current = null;
      setState("closed");
    };
  }, [wc]);

  const start = async (): Promise<void> => {
    setState("connecting");
    const t = await getToken();
    await wc.start({ agentId: agentId, sessionId: t.token, sampleRate: sampleRate });
    setState("open");
  };

  const stop = (): void => {
    if (instanceRef.current) {
      instanceRef.current.stop();
      setState("closed");
    }
  };

  return { state: state, start: start, stop: stop, webchat: wc };
}
