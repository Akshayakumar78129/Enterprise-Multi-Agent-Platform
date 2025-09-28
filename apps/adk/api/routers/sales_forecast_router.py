"""API router for sales forecast dashboard"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from domains.sales_forecast.processing_service import SalesForecastProcessingService

router = APIRouter(prefix="/api/sales-forecast", tags=["sales-forecast"])
processing_service = SalesForecastProcessingService()


@router.get("/dashboard")
async def get_dashboard(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    forecastPeriod: Optional[int] = Query(30),
    region: Optional[List[str]] = Query(None),
    category: Optional[List[str]] = Query(None),
    product: Optional[List[str]] = Query(None),
    modelType: Optional[str] = Query("auto"),
    confidence: Optional[float] = Query(0.95)
) -> Dict[str, Any]:
    """Get sales forecast dashboard data"""
    try:
        filters = {}

        # Build date range filter
        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        # Add forecast parameters
        if forecastPeriod:
            filters['forecastPeriod'] = forecastPeriod
        if modelType:
            filters['modelType'] = modelType
        if confidence:
            filters['confidence'] = confidence

        # Add other filters
        if region:
            filters['region'] = region
        if category:
            filters['category'] = category
        if product:
            filters['product'] = product

        result = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast")
async def get_forecast(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    forecastPeriod: Optional[int] = Query(30),
    region: Optional[List[str]] = Query(None),
    category: Optional[List[str]] = Query(None)
) -> Dict[str, Any]:
    """Get sales forecast data only"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        if forecastPeriod:
            filters['forecastPeriod'] = forecastPeriod
        if region:
            filters['region'] = region
        if category:
            filters['category'] = category

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('forecasts', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpis")
async def get_forecast_kpis(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    forecastPeriod: Optional[int] = Query(30)
) -> Dict[str, Any]:
    """Get forecast KPI metrics"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        if forecastPeriod:
            filters['forecastPeriod'] = forecastPeriod

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('kpis', {})}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/seasonal-patterns")
async def get_seasonal_patterns(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get seasonal patterns analysis"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('seasonalPatterns', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios")
async def get_forecast_scenarios(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    forecastPeriod: Optional[int] = Query(30)
) -> Dict[str, Any]:
    """Get forecast scenarios"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        if forecastPeriod:
            filters['forecastPeriod'] = forecastPeriod

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('scenarios', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-info")
async def get_model_info(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get forecast model information"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('modelInfo', {})}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
