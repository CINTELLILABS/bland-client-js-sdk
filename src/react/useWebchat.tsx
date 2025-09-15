import { useEffect, useMemo, useRef, useState } from "react";
import Webchat from "../client/webchat/webchat";

type TokenProvider = () => Promise<{ token: string }>;

export function useWebchat(params: {
  agentId: string;
  getToken: TokenProvider;
  sampleRate?: number;
  endpoint?: string | null;
}) {
  const { agentId, getToken, sampleRate, endpoint } = params;
  const [state, setState] = useState<"closed"|"connecting"|"open"|"closing">("closed");
  const instanceRef = useRef<Webchat | null>(null);

  const wc = useMemo(() => {
    const w = new Webchat({ endpoint });
    return w;
  }, [endpoint]);

  useEffect(() => {
    instanceRef.current = wc;
    return () => {
      if (instanceRef.current) instanceRef.current.stop();
      instanceRef.current = null;
      setState("closed");
    };
  }, [wc]);

  async function start() {
    setState("connecting");
    const { token } = await getToken();
    await wc.start({ agentId, sessionId: token, sampleRate });
    setState("open");
  }

  function stop() {
    if (instanceRef.current) {
      instanceRef.current.stop();
      setState("closed");
    }
  }

  return { state, start, stop, webchat: wc };
}
