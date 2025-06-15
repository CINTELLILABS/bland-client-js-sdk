# Bland Client JS SDK

The BlandJS SDK Client is a lightweight and straightforward JavaScript software development kit designed to streamline API calls within web applications.

# Installation

##### Step 1: Install the Client JS SDK

```bash
npm install bland-client-js-sdk
```

# Usage

##### Step 2: Set up the SDK Class

```javascript
import { BlandWebClient } from "bland-client-js-sdk";

const sdk = new BlandWebClient(
    "agent_id", // your agent id here
    "session_token" // your session token here
)
```
### Start the conversation

```javascript
const uniqueCallId = crypto.randomUUID();
sdk.initConversation({
    sampleRate: 44100,
    callId:uniqueCallId,
});
```

### Stop the conversation

```javascript
sdk.stopConversation();
```
# Generating an Agent Id and Session Tokens;

### 1. Create an Agent Id:
```javascript
const generateAgent = async () => {
    // Make a request to Bland servers to create a new Agent.
    const response = await fetch(`https://api.bland.ai/v1/agents`, {
        method: "POST",
        body: JSON.stringify({
            prompt: "Hello World!"
        }),
        headers: {
            "Content-type": "application/json",
            "Authorization": "YOUR_API_KEY"
        }
    });

    const data = await response.json();
    return data.agent.agent_id;
};
```

##### Example Response:
```json
{
  "agent": {
    "agent_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    ...
  }
}
```

### 2. Generate Session Token from Agent Id:

```javascript
const generateSessionToken = async () => {
    // Make a request to Bland servers to create a new Session Token for an Agent Id.
    const response = await fetch(`https://api.bland.ai/v1/agents/:agent_id/authorize`, {
        method: "POST",
        headers: {
            "Authorization": "YOUR_API_KEY"
        }
    });

    const data = await response.json();
    return data.token;
};
```
##### Example Response:
```json
{
  "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

---

### Need Help?

Join our [discord](https://discord.com/invite/8xGGg2KfH7) for  support! Our docs are also available [here](https://docs.bland.ai).
