"""
Customer Segmentation API Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from domains.customer.customer_segmentation.processing_service import CustomerSegmentationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/segmentation", tags=["segmentation"])
service = CustomerSegmentationService()

@router.post("/summary")
async def get_dashboard_summary(filters: Dict = {}) -> Dict:
    """Get Customer Segmentation dashboard summary"""
    try:
        result = await service.get_dashboard_summary(filters)
        return result
    except Exception as e:
        logger.error(f"Error in dashboard endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "segmentation"}
