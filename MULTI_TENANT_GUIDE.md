# Multi-Tenant Architecture & Deployment Guide

This document outlines how to manage, deploy, and scale the AI voice agent platform across multiple distinct clients (tenants) without duplicating code or infrastructure.

## 1. Core Principles

The platform follows a **Multi-Tenant SaaS** architectural pattern:
* **One Codebase**: We maintain a single, central GitHub repository for the entire platform (the `/agent` and `/frontend`).
* **One Core Deployment**: The code is deployed to a single Modal environment (for the backend agent) and a single Vercel/Next.js environment (for the frontend/dashboard).
* **Dynamic Configuration**: The behavior of the AI (its prompt, its voice, its allowed tools) is fetched at runtime from a central database based on the `tenant_id` provided during the call initiation.

## 2. Infrastructure Setup

Here is how the infrastructure pieces fit together for managing multiple tenants:

### A. The Database (The Source of Truth)
You must implement a database (e.g., PostgreSQL, Supabase, Firebase) to store tenant configurations.
* **Table: `Tenants`**
  * `id`: (e.g., `hospital_123`)
  * `name`: (e.g., "City Hospital")
  * `plan`: (e.g., "pro", "enterprise")
* **Table: `Personas`**
  * `tenant_id`: Foreign key to `Tenants`
  * `persona_name`: (e.g., "receptionist")
  * `system_prompt`: The instructions injected into the LLM.
  * `voice_id`: The ElevenLabs voice ID to use.
  * `sip_trunk_id`: If a client brings their own phone number, you configure a separate SIP trunk in LiveKit and store its ID here.

### B. Modal (The Backend Compute)
Modal functions (`@app.function`) are stateless and scale horizontally. 
* When a call comes in, LiveKit spins up an agent on your Modal deployment.
* The agent receives `tenant_id` via `X-LiveKit-Metadata`.
* The agent queries your database for the persona configuration and initializes the `VoicePipelineAgent` with those parameters.
* **Command to Deploy**: `modal deploy modal_app.py`. This updates the logic for *all* tenants simultaneously.

### C. LiveKit (The WebRTC & SIP Layer)
LiveKit handles the audio streams and telephony. 
* **For Web Calls**: The frontend dashboard passes `tenant_id` when generating a LiveKit token.
* **For Inbound Phone Calls (SIP)**: In the LiveKit Cloud dashboard, you can configure SIP Ingress. When a specific phone number (DID) is dialed (e.g., the hospital's public number), you can configure LiveKit's dispatch rules to attach the `{"tenant_id": "hospital_123"}` metadata to the incoming participant before routing them to the agent room.

### D. The Frontend (Dashboard & Admin)
Your React/Next.js frontend (deployed via Vercel) serves two purposes:
1. **Admin Dashboard**: A secure portal where tenants log in (via Auth0, Clerk, or Supabase Auth) to update their prompts, view call logs, and change their billing.
2. **Web Caller**: A simple interface for users to initiate web-based WebRTC calls to the agent.

## 3. Handling Enterprise/HIPAA Exceptions

While the multi-tenant approach handles 95% of use cases, you may encounter an enterprise client (like a hospital) that mandates strict data isolation (HIPAA compliance, BAA requirements, isolated VPCs).

In these rare cases, you pivot to a **Single-Tenant Managed Deployment**:
1. You do **not** fork the Git repository. The code remains the same.
2. You create a separate Modal Workspace (`modal workspace create ...`) and a separate LiveKit Cloud Project.
3. You set up a CI/CD pipeline (e.g., GitHub Actions) that deploys the exact same codebase to the dedicated Modal workspace, passing in environment variables specific only to that hospital (e.g., their isolated database credentials).

## Summary Workflow

1. **Client Onboarding**: A new school signs up. You insert a row into your database for `tenant_id: school_456`, assigning them a prompt and a voice.
2. **Call Initiation**: A parent calls the school's phone number. LiveKit SIP Ingress attaches `{"tenant_id": "school_456"}`.
3. **Agent Wakes Up**: The Modal function starts, reads `school_456`, queries the DB, sees the friendly prompt and voice, and starts talking.
4. **Updates**: You realize there's a latency bug. You fix it in your local repository, run `modal deploy`, and instantly, all hospitals and schools benefit from the fix without any manual intervention per client.
