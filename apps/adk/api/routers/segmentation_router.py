"""Customer Segmentation API Router"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from domains.customer_segmentation.processing_service import CustomerSegmentationService
from domains.common.dashboard_cache import cache_dashboard_endpoint

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/segmentation", tags=["customer-segmentation"])
service = CustomerSegmentationService()

@router.post("/summary")
@cache_dashboard_endpoint(dashboard_type='customer', ttl=300)
async def get_segmentation_summary(filters: Dict = {}) -> Dict:
    """
    Get customer segmentation dashboard summary

    Args:
        filters: Segmentation filters including date range, method, and customer filters

    Returns:
        Segmentation analysis results with segment profiles and metrics
    """
    try:
        logger.info(f"Received segmentation request with filters: {filters}")

        # Get segmentation summary
        result = await service.get_dashboard_summary(filters)

        logger.info(f"Successfully generated segmentation summary with {len(result.get('segments', []))} segments")
        return result

    except Exception as e:
        logger.error(f"Error in segmentation endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "customer-segmentation"}