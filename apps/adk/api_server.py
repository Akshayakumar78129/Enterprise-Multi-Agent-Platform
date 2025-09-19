"""Standalone FastAPI server for dashboard APIs and AI agents"""

import asyncio
import json
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

# Import dashboard API routers
from api.routers.churn_router import router as churn_router
from domains.churn_prediction.processing_service import ChurnProcessingService

# Import churn prediction tool for AI responses
from orchestration_agent.tools.churn_prediction import predict_churn_risk

# Create FastAPI app
app = FastAPI(
    title="Dashboard & AI API Server",
    description="Unified API for dashboard endpoints and AI agents",
    version="2.0.0"
)

# Global service instances
churn_service = ChurnProcessingService()

# Simple in-memory session storage
sessions: Dict[str, Dict[str, Any]] = {}

# Request models
class AgentRunRequest(BaseModel):
    app_name: str
    user_id: str
    session_id: str
    new_message: Dict[str, Any]
    streaming: bool = True

class SimpleQueryRequest(BaseModel):
    user_query: str
    session_id: str
    user_id: str
    app_name: str
    is_canvas: bool = False

@app.on_event("startup")
async def startup_event():
    """Train ML model on startup to avoid retraining on every request"""
    print("[API Server] Training ML model on startup...")
    await churn_service._train_ml_model()
    print("[API Server] ML model training complete")
    # Store the service instance for use in routers
    app.state.churn_service = churn_service

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # Allow frontend and all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include dashboard routers
app.include_router(churn_router)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Dashboard API Server",
        "endpoints": [
            "/api/churn/summary",
            "/api/churn/feature-importance",
            "/api/churn/segment-comparison",
            "/api/churn/risk-trends",
            "/api/churn/customers",
            "/api/churn/export"
        ]
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Session management endpoints
@app.get("/apps/{app_name}/users/{user_id}/sessions/{session_id}")
async def get_session(app_name: str, user_id: str, session_id: str):
    """Get or check session existence"""
    session_key = f"{app_name}:{user_id}:{session_id}"
    if session_key in sessions:
        return sessions[session_key]
    return None

@app.post("/apps/{app_name}/users/{user_id}/sessions/{session_id}")
async def create_session(app_name: str, user_id: str, session_id: str):
    """Create a new session"""
    session_key = f"{app_name}:{user_id}:{session_id}"
    session = {
        "app_name": app_name,
        "user_id": user_id,
        "session_id": session_id,
        "created_at": datetime.now().isoformat(),
        "state": {}
    }
    sessions[session_key] = session
    return session

# AI Query endpoint with SSE streaming
@app.post("/run_sse")
async def run_agent_sse(req: AgentRunRequest):
    """Process AI queries and stream responses"""

    async def event_generator():
        try:
            # Extract query text from the message
            query_text = ""
            if "parts" in req.new_message:
                for part in req.new_message["parts"]:
                    if "text" in part:
                        query_text = part["text"]
                        break

            # Process the query based on app type
            if "churn" in query_text.lower() or "risk" in query_text.lower() or req.app_name == "orchestration_agent":
                # Use churn prediction tool
                result = predict_churn_risk(
                    time_period="last_90_days",
                    include_visualization=False
                )

                # Format as streaming response
                response = {
                    "text": result,
                    "audio": None,
                    "visualisation": None
                }

                yield f"data: {json.dumps(response)}\n\n"
            else:
                # Generic response for other queries
                response = {
                    "text": f"I received your query: '{query_text}'. I can help you with churn prediction analysis, risk assessment, and customer insights. Try asking about 'churn risk analysis' or 'customer segments at risk'.",
                    "audio": None,
                    "visualisation": None
                }

                yield f"data: {json.dumps(response)}\n\n"

        except Exception as e:
            error_response = {
                "text": f"Error processing your request: {str(e)}",
                "error": True
            }
            yield f"data: {json.dumps(error_response)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)