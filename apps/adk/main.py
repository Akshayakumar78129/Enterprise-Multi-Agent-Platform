import os
import json
import re
import io
import importlib
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from pydantic import BaseModel
from typing import Optional, Any
from pydantic import BaseModel, Field
from lib.utils import get_audio, get_visualisation, get_audio_from_file

# ADK imports
from google.adk.sessions import InMemorySessionService, Session
from google.adk.runners import Runner
from orchestration_agent import root_agent
from google.adk.cli.fast_api import AgentRunRequest, StreamingMode, RunConfig, Event

logger = logging.getLogger(__name__)

class RunResponse(BaseModel):
    audio: Optional[str] = None
    text: Optional[str] = None
    visualisation: Optional[str] = None
    
# AGENT_DIR = "./"
# APP_DIR = os.path.dirname(os.path.abspath(__file__))
# SESSION_DB_URL = "sqlite:///./sessions.db"

ALLOWED_ORIGINS = [
    "http://localhost",
    "*",
]

# SERVE_WEB_INTERFACE = False
# app = get_fast_api_app(
#     agents_dir=AGENT_DIR,
#     session_service_uri=SESSION_DB_URL,
#     allow_origins=ALLOWED_ORIGINS,
#     web=SERVE_WEB_INTERFACE,
# )

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory_session_service = InMemorySessionService()


agents_list = ["orchestration_agent", "inventory_agent", "inventory_output_agent", "sales_agent", "sales_output_agent", "customer_agent", "customer_output_agent", "financial_agent", "financial_output_agent"]



@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.get("/apps/{app_name}/users/{user_id}/sessions/{session_id}")
async def get_session(app_name: str, user_id: str, session_id: str):
    try:
        memory_session = await memory_session_service.get_session(app_name=app_name, user_id=user_id, session_id=session_id)
        return memory_session
    except Exception as e:
        return {"error": str(e)}

@app.post("/apps/{app_name}/users/{user_id}/sessions/{session_id}")
async def create_session(app_name: str, user_id: str, session_id: str, state: Optional[dict[str, Any]] = None):
    try:
        memory_session = await memory_session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id, state=state)
        return memory_session
    except Exception as e:
        return {"error": str(e)}

@app.post("/run_sse")
async def run_agent(req: AgentRunRequest) -> StreamingResponse:
    try:
        print(req)
        session = await get_session(app_name=req.app_name, user_id=req.user_id, session_id=req.session_id)
        print(session)
        if not session:
            print("Session not found")
            return StreamingResponse(
                (b"", 404),
                media_type="text/event-stream",
                status_code=404,
            )

        async def event_generator():
            try:
                stream_mode = StreamingMode.SSE if req.streaming else StreamingMode.NONE
                runner = Runner(agent=root_agent, app_name=req.app_name, session_service=memory_session_service)
                visualisation = None
                visualisation_text = None
                skip_response = False
                async for event in runner.run_async(
                    user_id=req.user_id,
                    session_id=req.session_id,
                    new_message=req.new_message,
                    run_config=RunConfig(streaming_mode=stream_mode),
                ):
                    if event.content and event.content.parts and event.author:
                        logger.info("Generated event in agent run streaming: %s", event)
                        audio_base64 = None
                        if event.author in agents_list:

                            if event.content.parts[0].text and not skip_response:
                                agent_response = event.content.parts[0].text
                                visualisation_text = agent_response if not visualisation_text else visualisation_text
                                audio_base64 = await get_audio(agent_response)
                                # audio_base64 = get_audio_from_file()
                                # audio_base64 = {"mime_type": "audio/wav", "data": "test"}

                            if event.content.parts[0].function_call:
                                if event.content.parts[0].function_call.name != "transfer_to_agent":
                                    visualisation_text = event.content.parts[0].function_call.arguments["text"]
                                    skip_response = True
                                # visualisation = get_visualisation(req.new_message.parts[0].text, visualisation_text)
                        if not visualisation_text:
                            continue

                        response = {
                            "audio": audio_base64,
                            "text": visualisation_text,
                            "visualisation": visualisation
                        }

                        response_data = json.dumps(response)
                        yield f"data: {response_data}\n\n"
                        visualisation = None
                        visualisation_text = None
                        skip_response = False
            except Exception as e:
                logger.exception("Error in event_generator: %s", e)

                # imported = importlib.import_module("lib.utils")
                # response = imported.data

                # newResponse = imported.new_response
                # You might want to yield an error event here
                yield f'error: {str(e)}\n\n'
                # yield f'data: {json.dumps(response)}\n\n'

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
        )
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Use the PORT environment variable provided by Cloud Run, defaulting to 8000
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
