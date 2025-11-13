"""API router for slow moving stock endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from domains.slow_moving_stock.processing_service import SlowMovingStockProcessingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/slow-moving-stock", tags=["inventory"])

# Initialize service
service = SlowMovingStockProcessingService()


@router.post("/dashboard")
async def get_dashboard_data(request_body: Dict[str, Any]):
    """Get complete slow moving stock dashboard data"""
    try:
        logger.info(f"Received POST /dashboard with body: {request_body}")

        # Pass filters directly to FilterEngine - it expects dateFrom/dateTo
        filters = {}

        # Keep dateFrom/dateTo as-is for FilterEngine
        if 'dateFrom' in request_body:
            filters['dateFrom'] = request_body['dateFrom']
        if 'dateTo' in request_body:
            filters['dateTo'] = request_body['dateTo']

        # Handle legacy dateRange format
        if 'dateRange' in request_body and request_body['dateRange']:
            filters['dateFrom'] = request_body['dateRange'].get('startDate')
            filters['dateTo'] = request_body['dateRange'].get('endDate')

        # Copy other filter arrays
        if request_body.get('category'):
            filters['category'] = request_body['category']

        # Handle turnoverThreshold for slow moving items
        if 'turnoverThreshold' in request_body:
            filters['turnoverThreshold'] = request_body['turnoverThreshold']

        logger.info(f"Converted filters for FilterEngine: {filters}")

        data = await service.get_dashboard_data(filters)
        logger.info(f"Returned data - Slow moving items: {len(data.get('slowMovingItems', []))}")

        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
