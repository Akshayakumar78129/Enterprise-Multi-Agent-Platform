import os
import json
import re
import asyncio
from datetime import datetime
from typing import Optional, Any, Dict, Union
from uuid import uuid4
from fastapi.responses import StreamingResponse
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from pydantic import BaseModel
from lib.utils import get_visualisation, get_audio_deepgram
from dotenv import load_dotenv
load_dotenv()

# ADK imports
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from orchestration_agent import root_agent
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.genai.types import Content

# Import Processing Services for ML models
from domains.churn_prediction.processing_service import ChurnProcessingService
from domains.performance_deviation.processing_service import PerformanceProcessingService
# Import AnomalyProcessingService for ML model
from domains.anomaly_detection.processing_service import AnomalyProcessingService
# Import CustomerBehaviorProcessingService for behavior analysis
from domains.customer_behavior.processing_service import CustomerBehaviorProcessingService
# Import CustomerSegmentationService for segmentation analysis
from domains.customer_segmentation.processing_service import CustomerSegmentationService
# Import additional customer dashboard services
from domains.customer_ltv.processing_service import CustomerLtvService
from domains.purchase_frequency.processing_service import PurchaseFrequencyService
from domains.transaction_patterns.processing_service import TransactionPatternsService
from domains.engagement_classifier.processing_service import EngagementClassifierService
from domains.next_purchase.processing_service import NextPurchaseService
from domains.retention_planner.processing_service import RetentionPlannerService
from domains.customer_insights.processing_service import CustomerInsightsService

# Import sales domain services
from domains.sales_performance.processing_service import SalesPerformanceProcessingService
from domains.sales_forecast.processing_service import SalesForecastProcessingService
from domains.revenue_analysis.processing_service import RevenueAnalysisProcessingService
from domains.product_performance.processing_service import ProductPerformanceProcessingService

# Import inventory domain services
from domains.inventory_level.processing_service import InventoryLevelProcessingService

# Import finance domain services
from domains.cash_flow.processing_service import CashFlowProcessingService
from domains.ar_aging_analysis.processing_service import ARAgingProcessingService

from customer.agent import root_agent as customer_agent
from finance.agent import root_agent as finance_agent
from inventory.agent import root_agent as inventory_agent
from sales.agent import root_agent as sales_agent

# Import dashboard API routers
from api.routers.churn_router import router as churn_router
from api.routers.performance_router import router as performance_router
from api.routers.anomaly_router import router as anomaly_router
from api.routers.customer_behavior_router import router as customer_behavior_router
from api.routers.segmentation_router import router as segmentation_router
from api.routers.customer_ltv_router import router as customer_ltv_router
from api.routers.purchase_frequency_router import router as purchase_frequency_router
from api.routers.transaction_patterns_router import router as transaction_patterns_router
from api.routers.engagement_classifier_router import router as engagement_classifier_router
from api.routers.next_purchase_router import router as next_purchase_router
from api.routers.retention_planner_router import router as retention_planner_router
from api.routers.customer_insights_router import router as customer_insights_router

# Import sales API router
from api.routers.sales_performance_router import router as sales_performance_router
from api.routers.product_performance_router import router as product_performance_router

# Import inventory API router
from api.routers.inventory_level_router import router as inventory_level_router

# Import cash flow API router
from api.routers.cash_flow_router import router as cash_flow_router
from api.routers.ar_aging_router import router as ar_aging_router

logger = logging.getLogger(__name__)

class AgentRunRequest(BaseModel):
  app_name: str
  user_id: str
  session_id: str
  new_message: Content
  streaming: bool = False
  state_delta: Optional[dict[str, Any]] = None

# Support SimpleQueryRequest from frontend
class SimpleQueryRequest(BaseModel):
    user_query: str
    session_id: str
    user_id: str
    app_name: str
    is_canvas: bool = False
    agent_type: Optional[str] = None

ALLOWED_ORIGINS = [
    "http://localhost",
    "*",
]

app = FastAPI(
    title="Multi-Agent Orchestration Server",
    description="Unified server for AI agents and dashboard APIs",
    version="3.0.0"
)

# Global service instances
churn_service = ChurnProcessingService()
performance_service = PerformanceProcessingService()
anomaly_service = AnomalyProcessingService()
customer_behavior_service = CustomerBehaviorProcessingService()
segmentation_service = CustomerSegmentationService()
customer_ltv_service = CustomerLtvService()
purchase_frequency_service = PurchaseFrequencyService()
transaction_patterns_service = TransactionPatternsService()
engagement_classifier_service = EngagementClassifierService()
next_purchase_service = NextPurchaseService()
retention_planner_service = RetentionPlannerService()
customer_insights_service = CustomerInsightsService()
sales_performance_service = SalesPerformanceProcessingService()
sales_forecast_service = SalesForecastProcessingService()
revenue_analysis_service = RevenueAnalysisProcessingService()
product_performance_service = ProductPerformanceProcessingService()
inventory_level_service = InventoryLevelProcessingService()
cash_flow_service = CashFlowProcessingService()
ar_aging_service = ARAgingProcessingService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory_session_service = InMemorySessionService()

# Include dashboard API routers
app.include_router(churn_router)
app.include_router(performance_router)
app.include_router(anomaly_router)
app.include_router(customer_behavior_router)
app.include_router(segmentation_router)
app.include_router(customer_ltv_router)

# Add route for older frontend compatibility
@app.post("/api/customer-lifetime-value/data")
async def get_ltv_data_legacy(filters: dict = {}):
    """Legacy endpoint for older frontend compatibility"""
    from api.routers.customer_ltv_router import get_ltv_data
    return await get_ltv_data(filters)
app.include_router(purchase_frequency_router)
app.include_router(transaction_patterns_router)
app.include_router(engagement_classifier_router)
app.include_router(next_purchase_router)
app.include_router(retention_planner_router)
app.include_router(customer_insights_router)
app.include_router(sales_performance_router)
app.include_router(product_performance_router)
app.include_router(inventory_level_router)
app.include_router(cash_flow_router)
app.include_router(ar_aging_router)

# Simple in-memory session storage for fallback
simple_sessions: Dict[str, Dict[str, Any]] = {}

agents_list = ["orchestration_agent", "inventory_agent", "sales_agent", "customer_insights_agent", "financial_agent"]



@app.on_event("startup")
async def startup_event():
    """Train ML models on startup and initialize caching"""
    # Initialize caching
    from domains.common.simple_cache import dashboard_cache_manager
    dashboard_cache_manager.enable()
    print("[Main Server] Dashboard caching enabled")

    # Train ML models on startup to avoid retraining on every request
    print("[Main Server] Training ML models on startup...")

    # Train churn prediction model
    await churn_service._train_ml_model()
    print("[Main Server] Churn ML model training complete")

    # Train anomaly detection model
    await anomaly_service._train_ml_model()
    print("[Main Server] Anomaly ML model training complete")

    # Store the service instances for use in routers
    app.state.churn_service = churn_service
    app.state.performance_service = performance_service
    app.state.anomaly_service = anomaly_service
    app.state.customer_behavior_service = customer_behavior_service
    app.state.segmentation_service = segmentation_service
    app.state.customer_ltv_service = customer_ltv_service
    app.state.purchase_frequency_service = purchase_frequency_service
    app.state.transaction_patterns_service = transaction_patterns_service
    app.state.engagement_classifier_service = engagement_classifier_service
    app.state.next_purchase_service = next_purchase_service
    app.state.retention_planner_service = retention_planner_service
    app.state.customer_insights_service = customer_insights_service
    app.state.sales_performance_service = sales_performance_service
    app.state.sales_forecast_service = sales_forecast_service
    app.state.revenue_analysis_service = revenue_analysis_service
    app.state.product_performance_service = product_performance_service
    app.state.ar_aging_service = ar_aging_service

    print("[Main Server] All services initialized")

@app.get("/")
def read_root():
    return {
        "message": "Multi-Agent Orchestration Server",
        "version": "3.0.0",
        "endpoints": {
            "ai_agents": [
                "/run_sse - AI query endpoint (SimpleQueryRequest format)",
                "/run_sse_agent - AI query endpoint (AgentRunRequest format)",
                "/apps/{app_name}/users/{user_id}/sessions/{session_id} - Session management"
            ],
            "dashboard_apis": [
                "/api/churn/summary",
                "/api/churn/feature-importance",
                "/api/churn/segment-comparison",
                "/api/churn/risk-trends",
                "/api/churn/customers",
                "/api/churn/export",
                "/api/performance/summary",
                "/api/performance/feature-importance",
                "/api/performance/variance-decomposition",
                "/api/performance/deviation-patterns",
                "/api/anomaly/summary",
                "/api/anomaly/customer-anomalies",
                "/api/anomaly/feature-importance",
                "/api/anomaly/segment-distribution",
                "/api/anomaly/region-distribution",
                "/api/anomaly/severity-distribution",
                "/api/anomaly/time-series",
                "/api/anomaly/customers",
                "/api/anomaly/export",
                "/api/anomaly/retrain",
                "/api/customer-behavior/summary",
                "/api/customer-behavior/purchase-patterns",
                "/api/customer-behavior/product-preferences",
                "/api/customer-behavior/channel-usage",
                "/api/customer-behavior/engagement-metrics",
                "/api/customer-behavior/customer-segments",
                "/api/customer-behavior/top-customers",
                "/api/customer-behavior/behavior-trends",
                "/api/customer-behavior/rfm-analysis",
                "/api/customer-behavior/clv-analysis",
                "/api/customer-behavior/export"
            ]
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "adk_enabled": True}


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
async def run_agent(req: Union[SimpleQueryRequest, AgentRunRequest]) -> StreamingResponse:
    """Handle both SimpleQueryRequest (from frontend) and AgentRunRequest formats"""
    try:
        # Convert SimpleQueryRequest to AgentRunRequest format
        if isinstance(req, SimpleQueryRequest):
            # Create Content object from simple query with proper structure
            # Ensure the user's actual query is passed, not default ADK messages
            new_message = Content(parts=[{"text": req.user_query}], role="user")

            # Create a fresh session for each query to avoid ADK default messages
            # This ensures the user's actual query is processed
            unique_session_id = f"{req.session_id}_{uuid4()}"
            session = await memory_session_service.create_session(
                app_name=req.app_name,
                user_id=req.user_id,
                session_id=unique_session_id
            )

            # Convert to internal format for processing
            app_name = req.app_name
            user_id = req.user_id
            session_id = unique_session_id  # Use unique session to avoid ADK default messages
            streaming = True  # Always stream for frontend
        else:
            # Handle original AgentRunRequest format
            new_message = req.new_message
            app_name = req.app_name
            user_id = req.user_id
            session_id = req.session_id
            streaming = req.streaming

            # Check if session exists, create if not
            try:
                session = await memory_session_service.get_session(
                    app_name=app_name,
                    user_id=user_id,
                    session_id=session_id
                )
            except:
                # Create new session if doesn't exist
                session = await memory_session_service.create_session(
                    app_name=app_name,
                    user_id=user_id,
                    session_id=session_id
                )

        async def event_generator():
            try:
                stream_mode = StreamingMode.SSE if streaming else StreamingMode.NONE
                # Create a new runner for each request to avoid session persistence issues
                runner = Runner(agent=root_agent, app_name=app_name, session_service=memory_session_service)

                # Variables to accumulate the complete response
                accumulated_text = ""
                is_visualisation = False
                last_author = None
                current_partial_text = ""  # Track partial text across events
                visualisation = None  # Track if visualization was generated

                # Force clear any previous conversation history to ensure fresh context
                async for event in runner.run_async(
                    user_id=user_id,
                    session_id=session_id,
                    new_message=new_message,
                    run_config=RunConfig(streaming_mode=stream_mode),
                ):
                    if event.content and event.content.parts:
                        logger.info("Generated event in agent run streaming: %s", event)

                        # Process events from all agents
                        if event.author:
                            last_author = event.author

                            # Check for text content in parts
                            for part in event.content.parts:
                                if hasattr(part, 'text') and part.text:
                                    agent_response = part.text
                                    current_partial_text += agent_response

                                    # Check if we have complete output tags
                                    output_match = re.search(r'<output>(.*?)</output>', current_partial_text, re.DOTALL)
                                    is_vis_match = re.search(r'<is_visualisation>(.*?)</is_visualisation>', current_partial_text)

                                    # If we have both tags, we have a complete response chunk
                                    if output_match and is_vis_match:
                                        response_text = output_match.group(1).strip()
                                        is_vis = is_vis_match.group(1).strip().lower() == 'true'

                                        if response_text:
                                            # Always accumulate text chunks
                                            print(f"📝 Accumulating chunk {len(response_text)} chars")
                                            if not accumulated_text:
                                                accumulated_text = response_text
                                            elif response_text not in accumulated_text:  # Avoid exact duplicates
                                                accumulated_text += "\n\n" + response_text
                                                print(f"📝 Total accumulated: {len(accumulated_text)} chars")
                                            is_visualisation = is_vis

                                            # Send text response WITHOUT audio (we'll send audio at the end)
                                            response_data = {
                                                "text": response_text,
                                                "content": response_text,
                                                "author": event.author if event.author else "orchestration_agent",
                                                "partial": False
                                            }

                                            # Send the text response immediately
                                            yield f"data: {json.dumps(response_data)}\n\n"

                                            # Generate and send visualization if needed
                                            if is_vis and isinstance(req, SimpleQueryRequest) and req.is_canvas:
                                                try:
                                                    print("Generating visualisation")
                                                    # Get query text for visualization generation
                                                    query_text = new_message.parts[0].text if new_message.parts and new_message.parts[0].text else ""

                                                    # Generate visualization using accumulated text for complete data
                                                    visualisation = await get_visualisation(query_text, accumulated_text)

                                                    if visualisation:
                                                        print(f"✅ Visualization generated successfully")
                                                        print(f"Visualization type: {type(visualisation)}")

                                                        # Ensure visualization is a list/array for frontend
                                                        if isinstance(visualisation, str):
                                                            try:
                                                                visualisation = json.loads(visualisation)
                                                                print("📊 Parsed visualization string to object")
                                                            except:
                                                                print("⚠️ Failed to parse visualization string")

                                                        print(f"Visualization data: {json.dumps(visualisation, indent=2) if isinstance(visualisation, (dict, list)) else str(visualisation)}")
                                                        print(f"📊 SENDING VISUALIZATION TO FRONTEND")
                                                        # Send visualization as a separate message
                                                        viz_response = {
                                                            "text": "",
                                                            "content": "",
                                                            "author": event.author if event.author else "orchestration_agent",
                                                            "partial": False,
                                                            "visualisation": visualisation,
                                                            "component": {
                                                                "type": "visualization",
                                                                "toolId": event.author if event.author else "orchestration_agent",
                                                                "data": {
                                                                    "visualization": visualisation,
                                                                    "text": response_text,
                                                                    "timestamp": datetime.now().isoformat()
                                                                }
                                                            }
                                                        }
                                                        yield f"data: {json.dumps(viz_response)}\n\n"

                                                except Exception as vis_err:
                                                    logger.error(f"Visualization generation failed: {vis_err}")

                                        # Clear partial text after processing complete response
                                        current_partial_text = ""

                # After the loop completes, generate audio for complete text and handle fallback
                if accumulated_text:
                    try:
                        # Check if this is from frontend canvas request
                        is_canvas = isinstance(req, SimpleQueryRequest) and req.is_canvas

                        # Generate audio for the complete accumulated text
                        if is_canvas and is_visualisation and accumulated_text:
                            try:
                                print(f"\n🎵 Generating audio for COMPLETE response ({len(accumulated_text)} chars)...")
                                print(f"First 200 chars of accumulated text: {accumulated_text[:200]}")
                                print(f"Last 200 chars of accumulated text: {accumulated_text[-200:]}")

                                # Split text into chunks of 2000 chars and send multiple audio messages
                                chunk_size = 2000
                                text_chunks = [accumulated_text[i:i+chunk_size]
                                             for i in range(0, len(accumulated_text), chunk_size)]

                                print(f"📄 Splitting audio into {len(text_chunks)} chunks")

                                for i, audio_text in enumerate(text_chunks):
                                    print(f"🎵 Generating audio chunk {i+1}/{len(text_chunks)} ({len(audio_text)} chars)")
                                    audio_obj = await get_audio_deepgram(audio_text)

                                    if audio_obj and audio_obj.get("data"):
                                        # Send each audio chunk as a separate message
                                        audio_response = {
                                            "text": "",
                                            "content": "",
                                            "author": last_author if last_author else "orchestration_agent",
                                            "partial": False,
                                            "audio": audio_obj,
                                            "audio_chunk_index": i,
                                            "audio_total_chunks": len(text_chunks)
                                        }
                                        yield f"data: {json.dumps(audio_response)}\n\n"
                                        print(f"✅ Audio chunk {i+1}/{len(text_chunks)} sent, length: {len(audio_obj['data'])} bytes")
                            except Exception as audio_err:
                                logger.error(f"Audio generation failed: {audio_err}")

                        # Generate visualization fallback (if needed)
                        if is_visualisation and is_canvas and not visualisation:
                            print("Generating visualisation (fallback)")
                            try:
                                # Get query text from new_message
                                query_text = new_message.parts[0].text if new_message.parts and new_message.parts[0].text else ""
                                visualisation = await get_visualisation(query_text, accumulated_text)

                                if visualisation:
                                    # Ensure visualization is a list/array for frontend
                                    if isinstance(visualisation, str):
                                        try:
                                            visualisation = json.loads(visualisation)
                                            print("📊 [Fallback] Parsed visualization string to object")
                                        except:
                                            print("⚠️ [Fallback] Failed to parse visualization string")

                                    viz_response = {
                                        "text": "",
                                        "content": "",
                                        "author": last_author if last_author else "orchestration_agent",
                                        "partial": False,
                                        "visualisation": visualisation
                                    }
                                    yield f"data: {json.dumps(viz_response)}\n\n"
                                    print("✅ Visualization sent (fallback)")
                            except Exception as vis_err:
                                logger.error(f"Visualization generation failed: {vis_err}")


                    except Exception as process_err:
                        logger.error(f"Error processing visualization: {process_err}")
                        # Don't send error for visualization processing failures
                        pass

                # Always send the [DONE] signal to indicate stream completion
                yield f"data: [DONE]\n\n"

            except Exception as e:
                logger.exception("Error in event_generator: %s", e)
                # Send error as SSE data event so frontend can parse it
                error_response = json.dumps({"error": str(e), "text": f"Error: {str(e)}"})
                yield f'data: {error_response}\n\n'
                # Still send [DONE] even on error to close the stream
                yield f"data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
        )
    except Exception as e:
        return {"error": str(e)}


@app.post("/run_sse_agent")
async def run_agent(req: AgentRunRequest) -> StreamingResponse:
    try:
        print(req)
        session = await get_session(app_name=req.app_name, user_id=req.user_id, session_id=req.session_id)
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
                agent = customer_agent if req.app_name == "customer_agent" else finance_agent if req.app_name == "financial_agent" else inventory_agent if req.app_name == "inventory_agent" else sales_agent if req.app_name == "sales_agent" else root_agent
                runner = Runner(agent=agent, app_name=req.app_name, session_service=memory_session_service)
                async for event in runner.run_async(
                    user_id=req.user_id,
                    session_id=req.session_id,
                    new_message=req.new_message,
                    run_config=RunConfig(streaming_mode=stream_mode),
                ):
                    if event.content and event.content.parts and event.author:
                        logger.info("Generated event in agent run streaming: %s", event)
                        if event.content.parts[0].text:
                            data = {
                                "agent": event.author,
                                "text": event.content.parts[0].text,
                            }
                            yield f"data: {json.dumps(data)}\n\n"
                                
            except Exception as e:
                logger.exception("Error in event_generator: %s", e)
                yield f'error: {str(e)}\n\n'

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
        )
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Use the PORT environment variable provided by Cloud Run, defaulting to 8000
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
