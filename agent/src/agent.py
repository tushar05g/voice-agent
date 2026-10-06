import json
import logging
from typing import AsyncIterable

from dotenv import load_dotenv
from groq import AsyncGroq
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, llm
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import elevenlabs, google

load_dotenv()
logger = logging.getLogger("voice-agent")

# Custom LLM wrapper using official Groq SDK to conform to LiveKit's LLM interface
class GroqLLM(llm.LLM):
    def __init__(self, model: str = "llama3-8b-8192"):
        super().__init__()
        self.model = model
        self.client = AsyncGroq()

    def chat(
        self,
        chat_ctx: llm.ChatContext,
        *,
        fnc_ctx: llm.FunctionContext | None = None,
        temperature: float | None = None,
        n: int | None = 1,
        parallel_tool_calls: bool | None = None,
    ) -> "GroqLLMStream":
        return GroqLLMStream(
            self.client,
            self.model,
            chat_ctx,
            temperature=temperature,
        )

class GroqLLMStream(llm.LLMStream):
    def __init__(self, client, model, chat_ctx, temperature):
        super().__init__(chat_ctx=chat_ctx, fnc_ctx=None)
        self.client = client
        self.model = model
        self.temperature = temperature
        self._stream = None

    async def __anext__(self) -> llm.ChatChunk:
        if self._stream is None:
            messages = [{"role": msg.role, "content": msg.content} for msg in self.chat_ctx.messages if isinstance(msg.content, str)]
            self._stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=self.temperature or 0.7,
            )
            self._iter = self._stream.__aiter__()
        
        try:
            chunk = await self._iter.__anext__()
            delta = chunk.choices[0].delta.content or ""
            return llm.ChatChunk(
                choices=[
                    llm.Choice(
                        delta=llm.ChoiceDelta(content=delta, role="assistant"),
                        index=0,
                    )
                ]
            )
        except StopAsyncIteration:
            raise StopAsyncIteration

async def fetch_tenant_config(tenant_id: str, persona: str) -> dict:
    # MOCK DATABASE: In production, replace this with a real DB call (e.g., PostgreSQL, Supabase, Firebase)
    # query = "SELECT system_prompt, voice_id FROM personas WHERE tenant_id = $1 AND persona = $2"
    mock_db = {
        "hospital_123": {
            "receptionist": {
                "prompt": "You are a receptionist for City Hospital. Help callers book appointments and answer basic questions. Be empathetic and professional.",
                "voice_id": "EXAVITQu4vr4xnSDxMaL" # Use a professional voice
            }
        },
        "school_456": {
            "admin": {
                "prompt": "You are a school administrator for Springfield High. Assist parents with attendance inquiries and event schedules.",
                "voice_id": "pNInz6obpgDQGcFmaJgB" # Use a friendly voice
            }
        }
    }
    
    # Default fallback config if tenant or persona not found
    default_config = {
        "prompt": "You are a friendly, general-purpose AI assistant.",
        "voice_id": "EXAVITQu4vr4xnSDxMaL"
    }
    
    tenant_data = mock_db.get(tenant_id, {})
    return tenant_data.get(persona, default_config)

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()
    logger.info(f"Participant {participant.identity} joined")

    metadata = {}
    try:
        if participant.metadata:
            metadata = json.loads(participant.metadata)
    except Exception:
        pass

    tenant_id = metadata.get("tenant_id", "unknown_tenant")
    persona = metadata.get("persona", "default")
    
    # Fetch configuration dynamically from our "database"
    client_config = await fetch_tenant_config(tenant_id, persona)

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=client_config["prompt"],
    )

    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=google.STT(),
        llm=GroqLLM(model="llama-3.1-8b-instant"),
        tts=elevenlabs.TTS(
            model="eleven_turbo_v2",
            voice=elevenlabs.Voice(
                id=client_config["voice_id"],
                name="Agent Voice",
                category="generated"
            )
        ),
        chat_ctx=initial_ctx,
    )

    agent.start(ctx.room, participant)
    
    await agent.say("Hello, how can I help you today?", allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=lambda proc: proc.userdata.update({"vad": google.VAD()}) # using google for mock vad or fallback
        )
    )
