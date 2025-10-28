"""FastAPI router for AR Aging Analysis endpoints"""

from fastapi import APIRouter, HTTPException, Request
from typing import Dict
from domains.ar_aging_analysis.processing_service import ARAgingProcessingService
from domains.ar_aging_analysis.models import ARAgingFilters, ARAgingSummaryResponse

# Initialize router
router = APIRouter(prefix="/api/ar-aging", tags=["ar_aging"])


@router.post("/summary", response_model=ARAgingSummaryResponse)
async def get_dashboard_summary(filters: ARAgingFilters, request: Request):
    """Main dashboard endpoint - returns all AR aging metrics, buckets, and insights"""
    try:
        # Use cached service from app state
        service = request.app.state.ar_aging_service

        # Convert Pydantic model to dict
        filter_dict = {}

        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.customerSegments and len(filters.customerSegments) > 0:
            filter_dict['customerSegments'] = filters.customerSegments
        if filters.riskLevels and len(filters.riskLevels) > 0:
            filter_dict['riskLevels'] = filters.riskLevels
        if filters.minAmount is not None:
            filter_dict['minAmount'] = filters.minAmount
        if filters.maxAmount is not None:
            filter_dict['maxAmount'] = filters.maxAmount
        if filters.wacc is not None:
            filter_dict['wacc'] = filters.wacc
        if filters.regions and len(filters.regions) > 0:
            filter_dict['regions'] = filters.regions

        # Pass filter_dict instead of Pydantic model
        result = await service.get_ar_aging_summary(filter_dict)
        return result
    except Exception as e:
        print(f"[ARAgingRouter] Error in dashboard_summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/customer-details/{customer_id}")
async def get_customer_details(customer_id: str, filters: ARAgingFilters, request: Request):
    """Get detailed AR information for a specific customer"""
    try:
        service = request.app.state.ar_aging_service

        # Convert Pydantic model to dict and add customer filter
        filter_dict = filters.dict()
        filter_dict['customer_id'] = customer_id

        # Get full summary
        result = await service.get_ar_aging_summary(ARAgingFilters(**filter_dict))

        # Extract customer-specific data
        customer_insights = result.get('mainData', {}).get('customerInsights', [])
        customer = next(
            (c for c in customer_insights if c['customerId'] == customer_id),
            None
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail=f'Customer {customer_id} not found'
            )

        return customer

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ARAgingRouter] Error in get_customer_details: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forecast")
async def get_collection_forecast(filters: ARAgingFilters, request: Request):
    """Get collection forecast with confidence intervals"""
    try:
        service = request.app.state.ar_aging_service

        # Convert to dict
        filter_dict = filters.dict()
        result = await service.get_ar_aging_summary(filter_dict)
        forecast_data = result.get('mainData', {}).get('collectionForecast', [])

        return {
            'forecast': forecast_data,
            'metadata': {
                'wacc': filters.wacc,
                'forecast_weeks': 8
            }
        }

    except Exception as e:
        print(f"[ARAgingRouter] Error in get_collection_forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "ar_aging_analysis"}
