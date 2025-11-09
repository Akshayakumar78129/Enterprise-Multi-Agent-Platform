"""FastAPI router for Purchase Frequency endpoints"""

from fastapi import APIRouter, HTTPException, Request
from typing import Dict, Optional
from datetime import datetime

from domains.purchase_frequency.processing_service import PurchaseFrequencyProcessingService
from domains.purchase_frequency.models import (
    PurchaseFrequencyFilters,
    PurchaseFrequencySummaryResponse
)

# Initialize router
router = APIRouter(prefix="/api/purchase-frequency", tags=["purchase-frequency"])


@router.post("/summary")
async def get_dashboard_summary(filters: PurchaseFrequencyFilters, request: Request):
    """Main dashboard endpoint - returns all purchase frequency metrics

    Returns:
        - KPI metrics (total customers, avg frequency, segment counts)
        - Frequency distribution (bins)
        - Customer segmentation (RFM quadrants)
        - Purchase intervals (days between purchases)
        - Lifecycle stages (New, Active, At Risk, Dormant)
        - Customer details table
        - Business insights
    """
    try:
        # Use cached service from app state
        service = request.app.state.purchase_frequency_service

        # Convert Pydantic model to dict
        filter_dict = {}

        # Handle single values
        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.timeRange:
            filter_dict['timeRange'] = filters.timeRange
        if filters.search:
            filter_dict['search'] = filters.search
        if filters.frequencyRange:
            filter_dict['frequencyRange'] = filters.frequencyRange

        # Handle arrays
        if filters.customerSegments and len(filters.customerSegments) > 0:
            filter_dict['customerSegments'] = filters.customerSegments

        if filters.productCategories and len(filters.productCategories) > 0:
            filter_dict['productCategories'] = filters.productCategories

        result = await service.get_dashboard_summary(filter_dict)
        return result

    except Exception as e:
        print(f"[PurchaseFrequencyRouter] Error in dashboard_summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/frequency-distribution")
async def get_frequency_distribution(filters: PurchaseFrequencyFilters, request: Request):
    """Get detailed frequency distribution data

    Returns purchase frequency distribution binned by count ranges
    """
    try:
        service = request.app.state.purchase_frequency_service
        filter_dict = filters.dict(exclude_none=True)

        from domains.purchase_frequency.data_service import PurchaseFrequencyDataService
        data_service = PurchaseFrequencyDataService()

        result = await data_service.get_frequency_distribution(filter_dict)
        return {'distribution': result}

    except Exception as e:
        print(f"[PurchaseFrequencyRouter] Error in frequency_distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/customer-segments")
async def get_customer_segments(filters: PurchaseFrequencyFilters, request: Request):
    """Get RFM-based customer segmentation

    Returns customers segmented by Recency, Frequency, and Monetary value
    """
    try:
        service = request.app.state.purchase_frequency_service
        filter_dict = filters.dict(exclude_none=True)

        from domains.purchase_frequency.data_service import PurchaseFrequencyDataService
        data_service = PurchaseFrequencyDataService()

        result = await data_service.get_customer_segmentation(filter_dict)
        return {'segments': result}

    except Exception as e:
        print(f"[PurchaseFrequencyRouter] Error in customer_segments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/purchase-intervals")
async def get_purchase_intervals(filters: PurchaseFrequencyFilters, request: Request):
    """Get purchase interval distribution

    Returns distribution of average days between purchases
    """
    try:
        service = request.app.state.purchase_frequency_service
        filter_dict = filters.dict(exclude_none=True)

        from domains.purchase_frequency.data_service import PurchaseFrequencyDataService
        data_service = PurchaseFrequencyDataService()

        result = await data_service.get_purchase_intervals(filter_dict)
        return {'intervals': result}

    except Exception as e:
        print(f"[PurchaseFrequencyRouter] Error in purchase_intervals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lifecycle-stages")
async def get_lifecycle_stages(filters: PurchaseFrequencyFilters, request: Request):
    """Get customer lifecycle stage distribution

    Returns customers categorized as New, Active, At Risk, or Dormant
    """
    try:
        service = request.app.state.purchase_frequency_service
        filter_dict = filters.dict(exclude_none=True)

        from domains.purchase_frequency.data_service import PurchaseFrequencyDataService
        data_service = PurchaseFrequencyDataService()

        result = await data_service.get_lifecycle_stages(filter_dict)
        return {'stages': result}

    except Exception as e:
        print(f"[PurchaseFrequencyRouter] Error in lifecycle_stages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/customer-details")
async def get_customer_details(filters: PurchaseFrequencyFilters, request: Request):
    """Get detailed customer frequency data

    Returns full customer list with frequency metrics for table display
    """
    try:
        service = request.app.state.purchase_frequency_service
        filter_dict = filters.dict(exclude_none=True)

        from domains.purchase_frequency.data_service import PurchaseFrequencyDataService
        data_service = PurchaseFrequencyDataService()

        result = await data_service.get_customer_frequency_data(filter_dict)
        return {'customers': result}

    except Exception as e:
        print(f"[PurchaseFrequencyRouter] Error in customer_details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint"""
    try:
        service = request.app.state.purchase_frequency_service
        return {
            "status": "healthy",
            "service": "purchase-frequency",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "purchase-frequency",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
