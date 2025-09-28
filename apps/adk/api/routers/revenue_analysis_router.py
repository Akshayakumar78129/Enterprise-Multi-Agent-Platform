"""API router for revenue analysis dashboard"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from domains.revenue_analysis.processing_service import RevenueAnalysisProcessingService

router = APIRouter(prefix="/api/revenue-analysis", tags=["revenue-analysis"])
processing_service = RevenueAnalysisProcessingService()

@router.get("/dashboard")
async def get_dashboard(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    region: Optional[List[str]] = Query(None),
    category: Optional[List[str]] = Query(None),
    segment: Optional[List[str]] = Query(None)
) -> Dict[str, Any]:
    """Get revenue analysis dashboard data"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        if region:
            filters['region'] = region
        if category:
            filters['category'] = category
        if segment:
            filters['segment'] = segment

        result = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/kpis")
async def get_kpis(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get revenue KPIs"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('kpis', {})}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/breakdown")
async def get_breakdown(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get revenue breakdown"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('breakdown', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
