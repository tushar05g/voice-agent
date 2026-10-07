import json
import logging
import os
from typing import AsyncIterable

from dotenv import load_dotenv
from groq import AsyncGroq
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, llm
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import elevenlabs, assemblyai, silero
from supabase import create_client, Client

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

async def fetch_tenant_config(phone_number: str) -> dict:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    default_config = {
        "prompt": "You are a friendly, general-purpose AI assistant.",
        "voice_id": "EXAVITQu4vr4xnSDxMaL",
        "initial_greeting": "Hello, how can I help you today?"
    }

    if not supabase_url or not supabase_key:
        logger.warning("SUPABASE_URL or SUPABASE_KEY not set. Using default fallback configuration.")
        return default_config

    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        # Fetch agent configuration from 'agents' table
        response = supabase.table("agents").select("*").eq("phone_number", phone_number).execute()
        
        if len(response.data) > 0:
            row = response.data[0]
            logger.info(f"Loaded config for phone {phone_number} from Supabase")
            return {
                "prompt": row.get("agent_prompt", default_config["prompt"]),
                "voice_id": row.get("voice_id", default_config["voice_id"]),
                "initial_greeting": "Hello! How can I help you today?"
            }
        else:
            logger.warning(f"No configuration found in DB for phone: {phone_number}. Using default.")
            return default_config
    except Exception as e:
        logger.error(f"Error fetching from Supabase: {e}")
        return default_config


async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()
    logger.info(f"Participant {participant.identity} joined")

    metadata = {}
    try:
        if participant.metadata:
            metadata = json.loads(participant.metadata)
    except Exception as e:
        logger.error(f"Error parsing participant metadata: {e}")

    # For testing from the frontend web app, we might pass phone_number in metadata.
    # For actual SIP inbound calls, LiveKit provides the dialed number.
    phone_number = metadata.get("phone_number", "+15551234567") 
    
    # Fetch configuration dynamically from database
    client_config = await fetch_tenant_config(phone_number)

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=client_config["prompt"],
    )

    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=assemblyai.STT(),
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
    
    await agent.say(client_config["initial_greeting"], allow_interruptions=True)

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=lambda proc: proc.userdata.update({"vad": silero.VAD.load()})
        )
    )
