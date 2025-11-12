"""FastAPI router for Revenue Forecast endpoints"""

from fastapi import APIRouter, HTTPException, Request
from typing import Dict
from domains.finance.revenue_forecast.processing_service import RevenueForecastProcessingService
from domains.finance.revenue_forecast.models import RevenueForecastFilters, RevenueForecastSummaryResponse

# Initialize router
router = APIRouter(prefix="/api/revenue-forecast", tags=["revenue_forecast"])


@router.post("/summary", response_model=RevenueForecastSummaryResponse)
async def get_dashboard_summary(filters: RevenueForecastFilters, request: Request):
    """Main dashboard endpoint - returns all revenue forecast metrics and insights"""
    try:
        # Use cached service from app state
        service = request.app.state.revenue_forecast_service

        # Convert Pydantic model to dict
        filter_dict = {}

        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.companyCode:
            filter_dict['companyCode'] = filters.companyCode
        if filters.segments and len(filters.segments) > 0:
            filter_dict['segments'] = filters.segments
        if filters.products and len(filters.products) > 0:
            filter_dict['products'] = filters.products
        if filters.regions and len(filters.regions) > 0:
            filter_dict['regions'] = filters.regions
        if filters.customerTypes and len(filters.customerTypes) > 0:
            filter_dict['customerTypes'] = filters.customerTypes
        if filters.forecastHorizon:
            filter_dict['forecastHorizon'] = filters.forecastHorizon
        if filters.confidenceLevel:
            filter_dict['confidenceLevel'] = filters.confidenceLevel
        if filters.scenario:
            filter_dict['scenario'] = filters.scenario

        # Pass filter_dict instead of Pydantic model
        result = await service.get_revenue_forecast_summary(filter_dict)
        return result
    except Exception as e:
        print(f"[RevenueForecastRouter] Error in dashboard_summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forecast-data")
async def get_forecast_data(filters: RevenueForecastFilters, request: Request):
    """Get detailed forecast data with confidence intervals"""
    try:
        service = request.app.state.revenue_forecast_service

        # Convert to dict
        filter_dict = filters.dict()
        result = await service.get_revenue_forecast_summary(filter_dict)
        forecast_data = result.get('mainData', {}).get('monthlyTrend', [])

        return {
            'forecast': forecast_data,
            'metadata': {
                'forecastHorizon': filters.forecastHorizon,
                'confidenceLevel': filters.confidenceLevel,
                'scenario': filters.scenario
            }
        }

    except Exception as e:
        print(f"[RevenueForecastRouter] Error in get_forecast_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "revenue_forecast"}
