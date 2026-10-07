import os
import re
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import modal
from pydantic import BaseModel, field_validator
from livekit import api

app = modal.App("voice-agent")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "livekit-agents~=1.8",
        "livekit-api",
        "livekit-plugins-elevenlabs",
        "livekit-plugins-assemblyai",
        "livekit-plugins-silero",
        "groq",
        "google-generativeai",
        "python-dotenv",
        "fastapi",
        "supabase"
    )
)

web_app = FastAPI()
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    expected_token = os.getenv("API_BEARER_TOKEN")
    if not expected_token:
        # If no token is configured in env, allow it (or fail secure). Opting to fail secure in production.
        raise HTTPException(status_code=500, detail="Server not configured for authentication")
    if credentials.credentials != expected_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    return credentials.credentials

class CallRequest(BaseModel):
    phone_number: str
    persona: str = "default"
    tenant_id: str = "unknown"

    @field_validator('phone_number')
    def validate_phone(cls, v):
        if not re.match(r"^\+?[1-9]\d{1,14}$", v):
            raise ValueError('Invalid E.164 phone number')
        return v

@web_app.post("/make-outbound-call")
async def make_outbound_call(req: CallRequest, token: str = Depends(verify_token)):
    lk_url = os.getenv("LIVEKIT_URL")
    lk_api_key = os.getenv("LIVEKIT_API_KEY")
    lk_api_secret = os.getenv("LIVEKIT_API_SECRET")
    sip_trunk_id = os.getenv("LIVEKIT_SIP_TRUNK_ID")
    
    if not all([lk_url, lk_api_key, lk_api_secret, sip_trunk_id]):
        raise HTTPException(status_code=500, detail="LiveKit credentials or SIP trunk ID missing in server environment")

    lkapi = api.LiveKitAPI()
    
    room_name = f"call-{req.phone_number.strip('+')}"
    import json
    metadata = json.dumps({"phone_number": req.phone_number})
    
    try:
        await lkapi.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                sip_trunk_id=sip_trunk_id,
                sip_call_to=req.phone_number,
                room_name=room_name,
                participant_identity=f"sip-{req.phone_number}",
                participant_metadata=metadata,
            )
        )
        return {"status": "success", "room": room_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate call: {str(e)}")
    finally:
        await lkapi.aclose()

@app.function(
    image=image,
    secrets=[modal.Secret.from_dotenv()],
    max_containers=10,
    min_containers=1,
)
@modal.asgi_app()
def fastapi_app():
    return web_app

# The LiveKit Agent Process
@app.function(
    image=image,
    secrets=[modal.Secret.from_dotenv()],
    max_containers=10,
)
def run_agent():
    # Run the livekit agent process
    from src.agent import entrypoint
    from livekit.agents import WorkerOptions, cli
    from livekit.plugins import silero
    
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=lambda proc: proc.userdata.update({"vad": silero.VAD.load()})
        )
    )
