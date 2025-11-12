"""
Customer Lifetime Value API Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import logging

from .processing_service import CustomerLtvService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/customer-ltv", tags=["customer-ltv"])
service = CustomerLtvService()

@router.post("/summary")
async def get_dashboard_summary(filters: Dict = {}) -> Dict:
    """Get Customer Lifetime Value dashboard summary"""
    try:
        result = await service.get_dashboard_summary(filters)
        return result
    except Exception as e:
        logger.error(f"Error in dashboard endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "customer-ltv"}
