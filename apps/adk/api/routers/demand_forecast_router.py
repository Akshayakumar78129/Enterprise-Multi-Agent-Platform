"""FastAPI router for Demand Forecast endpoints"""

from fastapi import APIRouter, HTTPException, Request
from typing import Dict
from domains.demand_forecast.processing_service import DemandForecastProcessingService

# Initialize router
router = APIRouter(prefix="/api/demand-forecast", tags=["demand_forecast"])


@router.post("/summary")
async def get_dashboard_summary(filters: Dict = {}, request: Request = None):
    """Main dashboard endpoint - returns all demand forecast metrics and insights"""
    try:
        # Use service from app state or create new instance
        if request and hasattr(request.app.state, 'demand_forecast_service'):
            service = request.app.state.demand_forecast_service
        else:
            service = DemandForecastProcessingService()

        result = await service.get_dashboard_data(filters)
        return result
    except Exception as e:
        print(f"[DemandForecastRouter] Error in dashboard_summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kpis")
async def get_kpis(filters: Dict = {}, request: Request = None):
    """Get demand forecast KPIs"""
    try:
        if request and hasattr(request.app.state, 'demand_forecast_service'):
            service = request.app.state.demand_forecast_service
        else:
            service = DemandForecastProcessingService()

        result = await service.get_kpis(filters)
        return result
    except Exception as e:
        print(f"[DemandForecastRouter] Error in get_kpis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detailed-data")
async def get_detailed_data(filters: Dict = {}, request: Request = None):
    """Get detailed forecast data"""
    try:
        if request and hasattr(request.app.state, 'demand_forecast_service'):
            service = request.app.state.demand_forecast_service
        else:
            service = DemandForecastProcessingService()

        result = await service.get_detailed_data(filters)
        return result
    except Exception as e:
        print(f"[DemandForecastRouter] Error in get_detailed_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "demand_forecast"}
