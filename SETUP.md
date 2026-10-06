# Setup & Deployment Guide

This repository contains a production-ready, multi-persona AI voice agent platform capable of handling both inbound and outbound calls. The system leverages LiveKit (deployed via Modal serverless functions), Groq (Gemini 1.5 Flash via Groq SDK), Google Native STT, and ElevenLabs TTS.

## Architecture Diagram

```mermaid
flowchart LR
    PSTN((PSTN / Caller)) <--> LiveKit[LiveKit Cloud]
    LiveKit <--> Modal[Agent Worker\non Modal]
    
    subgraph Agent Runtime
        Modal --> GoogleSTT[Google STT (gRPC)]
        GoogleSTT --> Groq[Groq API\n(Gemini 1.5 Flash/Llama)]
        Groq --> ElevenLabs[ElevenLabs TTS]
    end
    
    WebUI[Next.js Frontend] -->|Trigger /make-outbound-call| Modal
```

## Prerequisites

To run this platform, you need accounts and API keys from the following services:

1. **LiveKit Cloud**: Create a project at [LiveKit Cloud](https://cloud.livekit.io/) to get your URL, API Key, and Secret.
2. **Groq**: Get an API key from [GroqCloud](https://console.groq.com/).
3. **Google Cloud Platform (GCP)**: Enable the Speech-to-Text API and download your Service Account JSON credentials.
4. **ElevenLabs**: Create an account and get your API key from [ElevenLabs](https://elevenlabs.io/).
5. **Modal**: Create an account and install the CLI (`pip install modal`), then run `modal setup`.

## Environment Variables

### `/agent` Environment Variables

Create a `.env` file in the `/agent` directory with the following variables:

| Variable | Description |
| :--- | :--- |
| `LIVEKIT_URL` | Your LiveKit server URL (e.g., `wss://your-project.livekit.cloud`). |
| `LIVEKIT_API_KEY` | Your LiveKit API Key. |
| `LIVEKIT_API_SECRET` | Your LiveKit API Secret. |
| `LIVEKIT_SIP_TRUNK_ID` | The ID of your SIP Trunk configured in LiveKit (used for outbound calls). |
| `GROQ_API_KEY` | Your Groq API Key. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to your GCP JSON credentials file or the JSON string. |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API Key. |

### `/frontend` Environment Variables

Create a `.env.local` file in the `/frontend` directory:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_LIVEKIT_URL` | Your LiveKit WebSocket URL. |
| `NEXT_PUBLIC_BACKEND_URL` | The URL of your Modal Webhook / Fast API instance. |

## Deployment & Configuration Guide

### 1. Deploying the Backend (Modal)

Navigate to the `/agent` directory and deploy using Modal:

```bash
cd agent
modal deploy modal_app.py
```

Modal will output a webhook URL for your FastAPI endpoint. Copy this URL and set it as `NEXT_PUBLIC_BACKEND_URL` in your frontend `.env.local`.

### 2. LiveKit SIP Ingress

To handle inbound calls:
1. Navigate to LiveKit Cloud Dashboard -> SIP.
2. Create a new Ingress Trunk.
3. Configure your dispatch rules to route incoming calls to a specific Room (or dynamically based on the DID).
4. The LiveKit agent on Modal connects dynamically, or you can configure a LiveKit webhook to auto-scale the agent via your Modal backend.

## Local Testing

### Backend
To test the Modal function locally (while still using Modal's compute for fast iteration):

```bash
cd agent
modal serve modal_app.py
```

### Frontend
Run the frontend locally. If you need it accessible externally (e.g. for some callbacks), use `ngrok`.

```bash
cd frontend
npm install
npm run dev
```

The UI will run on `http://localhost:3000`. Select your persona, enter your phone number, and test outbound calling.
