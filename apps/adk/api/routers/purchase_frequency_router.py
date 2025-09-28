"""
Purchase Frequency API Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from domains.purchase_frequency.processing_service import PurchaseFrequencyService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/purchase-frequency", tags=["purchase-frequency"])
service = PurchaseFrequencyService()

@router.post("/summary")
async def get_dashboard_summary(filters: Dict = {}) -> Dict:
    """Get Purchase Frequency dashboard summary"""
    try:
        result = await service.get_dashboard_summary(filters)
        return result
    except Exception as e:
        logger.error(f"Error in dashboard endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "purchase-frequency"}
