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

##### Start the conversation

```javascript
sdk.initConversation({
    sampleRate: 44100
});
```

##### Stop the conversation

```javascript
sdk.stopConversation();
```