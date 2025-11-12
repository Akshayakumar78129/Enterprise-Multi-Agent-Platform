"""
Engagement Classifier API Router
"""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import Dict, List, Optional
import logging
from pydantic import BaseModel

from domains.customer.engagement_classifier.processing_service import EngagementClassifierService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/engagement-classifier", tags=["engagement-classifier"])

# Service will be initialized from app.state
def get_service(request: Request) -> EngagementClassifierService:
    """Get service instance from app state or create new one"""
    if hasattr(request.app.state, 'engagement_classifier_service'):
        return request.app.state.engagement_classifier_service
    return EngagementClassifierService()


class EngagementFilters(BaseModel):
    """Engagement classifier filter model"""
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    engagementLevels: Optional[List[str]] = []
    loyaltyStatus: Optional[List[str]] = []
    customerSearch: Optional[str] = None
    minTransactions: Optional[int] = None
    minLTVAmount: Optional[float] = None
    rfmScoreMin: Optional[int] = None
    rfmScoreMax: Optional[int] = None


@router.post("/summary")
async def get_dashboard_summary(filters: EngagementFilters, request: Request) -> Dict:
    """Get complete engagement classifier dashboard summary with all metrics"""
    try:
        service = get_service(request)
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_dashboard_summary(filter_dict)
        return result
    except Exception as e:
        logger.error(f"Error in dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/distribution")
async def get_engagement_distribution(filters: EngagementFilters, request: Request) -> Dict:
    """Get engagement level distribution for pyramid visualization"""
    try:
        service = get_service(request)
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_engagement_distribution(filter_dict)
        return result
    except Exception as e:
        logger.error(f"Error in engagement distribution: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rfm-analysis")
async def get_rfm_analysis(filters: EngagementFilters, request: Request) -> Dict:
    """Get RFM (Recency, Frequency, Monetary) analysis"""
    try:
        service = get_service(request)
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_rfm_analysis(filter_dict)
        return result
    except Exception as e:
        logger.error(f"Error in RFM analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/opportunities")
async def get_reengagement_opportunities(filters: EngagementFilters, request: Request) -> Dict:
    """Get reengagement opportunities for at-risk customers"""
    try:
        service = get_service(request)
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_reengagement_opportunities(filter_dict)
        return result
    except Exception as e:
        logger.error(f"Error in reengagement opportunities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/timeline")
async def get_engagement_timeline(filters: EngagementFilters, request: Request) -> Dict:
    """Get engagement trends over time periods"""
    try:
        service = get_service(request)
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_engagement_timeline(filter_dict)
        return result
    except Exception as e:
        logger.error(f"Error in engagement timeline: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_customers(
    request: Request,
    q: str = Query(..., description="Search term for customer name or number")
) -> Dict:
    """Search customers by name or number"""
    try:
        service = get_service(request)
        result = await service.search_customers(q)
        return result
    except Exception as e:
        logger.error(f"Error in customer search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customer-analytics/{customer_key}")
async def get_customer_analytics(customer_key: str, request: Request) -> Dict:
    """Get detailed analytics for a specific customer"""
    try:
        service = get_service(request)
        result = await service.get_customer_analytics(customer_key)
        return result
    except Exception as e:
        logger.error(f"Error in customer analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "engagement-classifier"}
