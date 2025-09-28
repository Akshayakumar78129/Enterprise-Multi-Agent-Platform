"""
Engagement Classifier API Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from domains.engagement_classifier.processing_service import EngagementClassifierService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/engagement-classifier", tags=["engagement-classifier"])
service = EngagementClassifierService()

@router.post("/summary")
async def get_dashboard_summary(filters: Dict = {}) -> Dict:
    """Get Engagement Classifier dashboard summary"""
    try:
        result = await service.get_dashboard_summary(filters)
        return result
    except Exception as e:
        logger.error(f"Error in dashboard endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "engagement-classifier"}
