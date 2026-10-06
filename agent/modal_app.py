import os
import modal
from pydantic import BaseModel
from fastapi import FastAPI
from livekit import api

app = modal.App("voice-agent")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "livekit-agents~=1.8",
        "livekit-server-sdk",
        "livekit-plugins-elevenlabs",
        "livekit-plugins-google",
        "groq",
        "google-generativeai",
        "python-dotenv",
        "fastapi"
    )
)

web_app = FastAPI()

class CallRequest(BaseModel):
    phone_number: str
    persona: str = "default"
    tenant_id: str = "unknown"

@web_app.post("/make-outbound-call")
async def make_outbound_call(req: CallRequest):
    # Initialize LiveKit API client
    # Needs LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in the environment
    lkapi = api.LiveKitAPI()
    
    room_name = f"call-{req.phone_number.strip('+')}"
    import json
    metadata = json.dumps({"persona": req.persona, "tenant_id": req.tenant_id})
    
    # Needs a configured SIP trunk in LiveKit
    sip_trunk_id = os.getenv("LIVEKIT_SIP_TRUNK_ID", "")
    
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
        return {"status": "error", "message": str(e)}
    finally:
        await lkapi.aclose()

@app.function(
    image=image,
    secrets=[modal.Secret.from_dotenv()],
    concurrency_limit=10,
    keep_warm=1,
)
@modal.asgi_app()
def fastapi_app():
    return web_app

# The LiveKit Agent Process
@app.function(
    image=image,
    secrets=[modal.Secret.from_dotenv()],
    concurrency_limit=10,
)
def run_agent():
    # Run the livekit agent process
    from src.agent import entrypoint
    from livekit.agents import WorkerOptions, cli
    from livekit.plugins import google
    
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=lambda proc: proc.userdata.update({"vad": google.VAD()})
        )
    )
