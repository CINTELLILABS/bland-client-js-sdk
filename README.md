# @blandsdk/client

The Bland SDK is a JavaScript/TypeScript SDK for integrating with the Bland platform. It provides both server-side and client-side components to facilitate communication with Bland's services.

[![npm version](https://img.shields.io/npm/v/@blandsdk/js.svg)](https://www.npmjs.com/package/@blandsdk/client)
[![npm downloads](https://img.shields.io/npm/dm/@blandsdk/js.svg)](https://www.npmjs.com/package/@blandsdk/client)
[![license](https://img.shields.io/npm/l/@blandsdk/js.svg)](https://www.npmjs.com/package/@blandsdk/client)

## Getting Started

The Bland SDK has two components:
- Admin SDK: Server-Side SDK for creating sessions, handling authentication, and interacting with Bland using your privileged API key.
- Client SDK: Webchat SDK for embedding Bland inside your application. Your API key should never be used here.

## Installation
```bash
npm install @blandsdk/client
```

## Overview

The SDK is designed to be used in both server-side and client-side environments. The server-side component (Admin SDK) is responsible for creating sessions, using a privileged API key to make requests to bland and managing authentication, while the client-side component (Webchat SDK) handles the user interface and interaction with Bland.

`Browser Client -> Your Server (which uses the Admin SDK) -> Bland`

Then, when the client has a session token:

`Browser Client -> Bland`

## Usage: Server-Side (Admin SDK)

The Admin SDK is used to create sessions for agents. Below is an example of an Express route that creates a session for a given `agentId` and returns a session token. This token is then used by the Webchat SDK on the client side.

```ts
import express from "express";
import bodyParser from "body-parser";
import Bland from "@blandsdk/client";

const app = express();
app.use(bodyParser.json());

const bland = new Bland({
  admin: {
    apiKey: process.env.BLAND_API_KEY,
    endpoint: "https://api.bland.ai" // enterprise users: contact your account executive for the correct endpoint.
  },
  webchat: {}
});

app.post("/api/agent-authorize", async (req, res) => {
  try {
    const agentId = req.body?.agentId;
    if (!agentId) {
      return res.status(400).json({ error: "missing agentId" });
    }

    const admin = await bland.AdminClient();

    const session = await admin.sessions.create({ agentId });

    res.json({ token: session.token });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "internal error" });
  }
});

const port = 5174;
app.listen(port, () => {
  console.log(`Admin server running on http://localhost:${port}`);
});
```

## Usage: Client-Side (Webchat SDK) - React
Here is a minimal example that requests a session token from your Admin SDK, connects Webchat, listens to events, and shows a transcript. Pair this with the Express route from the Admin section that returns `{ token }` for a given `agentId`.

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useWebchat } from "@blandsdk/client/react";

type Token = { token: string };

async function authorizeAgent(agentId: string): Promise<Token> {
  const r = await fetch("<your server url>", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId })
  });
  if (!r.ok) throw new Error(`authorize error ${r.status}`);
  return r.json();
}

export default function App() {
  const [agentId, setAgentId] = useState("abc123");
  const [status, setStatus] = useState("idle");
  const [streamSid, setStreamSid] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const logRef = useRef<HTMLPreElement | null>(null);

  const getToken = useMemo(() => {
    return async () => authorizeAgent(agentId);
  }, [agentId]);

  const { state, start, stop, webchat } = useWebchat({
    agentId,
    getToken
  });

  useEffect(() => {
    const off = [
      webchat.on("open", () => {
        setStatus("open");
        log("[Websocket][open]");
      }),
      webchat.on("text", (raw: string) => {
        log(`[Websocket][text] ${raw}`);
      }),
      webchat.on("message", (m: any) => {
        log(`[Websocket][message] ${JSON.stringify(m)}`);
        if (!streamSid && m?.streamSid) setStreamSid(m.streamSid);
      }),
      webchat.on("update", (m: any) => {
        log(`[Websocket][update] ${JSON.stringify(m)}`);
        const who = m?.payload?.type === "assistant" ? "assistant" : "human";
        const t = m?.payload?.text;
        if (typeof t === "string" && t.length) {
          setTranscript((cur) => (cur ? `${cur}\n${who}: ${t}` : `${who}: ${t}`));
        }
      }),
      webchat.on("closed", () => {
        setStatus("closed");
        log("[Websocket][closed]");
      }),
      webchat.on("error", (e: unknown) => {
        setStatus("closed");
        log(`[Websocket][error] ${stringify(e)}`);
      })
    ];
    return () => off.forEach((u) => u());
  }, [webchat, streamSid]);

  function stringify(v: unknown) {
    try { return typeof v === "string" ? v : JSON.stringify(v) } catch { return String(v) }
  }

  function log(line: string) {
    const ts = new Date().toISOString();
    if (logRef.current) {
      logRef.current.textContent += `[${ts}] ${line}\n`;
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }

  const onStart = async () => {
    try {
      setStatus("authorizing");
      await start();
    } catch (e) {
      setStatus("closed");
      log(String(e));
    }
  };

  const onStop = () => {
    try { stop() } finally { setStatus("closed") }
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" }}>
      <h1 style={{ fontSize: 22, margin: "0 0 16px" }}>Bland React SDK</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
        <label htmlFor="agent">Agent</label>
        <input id="agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
        <button onClick={onStart} disabled={state !== "closed" && state !== "connecting"}>Start</button>
        <button onClick={onStop} disabled={state === "closed"}>Stop</button>
      </div>
      <div style={{ padding: "8px 10px", background: "#f5f5f5", borderRadius: 6, marginTop: 12 }}>{status}</div>
      <h2 style={{ fontSize: 16, marginTop: 16 }}>Transcript</h2>
      <pre style={{ whiteSpace: "pre-wrap", background: "#fafafa", padding: 12, borderRadius: 6 }}>{transcript}</pre>
      <h2 style={{ fontSize: 16, marginTop: 16 }}>Log</h2>
      <pre ref={logRef} style={{ whiteSpace: "pre-wrap", background: "#0b1020", color: "#e6edf3", padding: 12, borderRadius: 6, maxHeight: 300, overflow: "auto" }} />
    </div>
  );
}

```

## Client Options

```ts
export interface BlandClientOptions {
    admin: {
        apiKey?: string;
        endpoint?: string;
    }
    webchat?: {
        endpoint?: string;
    }
}
```


## Need Help?

Join our [discord](https://discord.com/invite/8xGGg2KfH7) for  support! Our docs are also available [here](https://docs.bland.ai).