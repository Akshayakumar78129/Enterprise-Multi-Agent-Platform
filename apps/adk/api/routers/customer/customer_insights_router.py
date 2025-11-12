"""FastAPI router for customer insights endpoints"""

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import Response
from typing import Dict, List, Optional
from datetime import datetime

from domains.customer.customer_insights.processing_service import CustomerInsightsService
from domains.customer.customer_insights.models import CustomerInsightsFilters, InsightsSummaryResponse

# Initialize router with prefix
router = APIRouter(prefix="/api/customer-insights", tags=["customer-insights"])

@router.post("/summary")
async def get_insights_summary(filters: CustomerInsightsFilters, request: Request):
    """Main dashboard endpoint - returns all customer insights metrics"""
    try:
        # Use cached service from app state
        service = request.app.state.customer_insights_service

        # Convert Pydantic model to dict
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result
    except Exception as e:
        print(f"[CustomerInsightsRouter] Error in insights_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/engagement")
async def get_engagement_overview(filters: CustomerInsightsFilters, request: Request):
    """Get customer engagement overview"""
    try:
        service = request.app.state.customer_insights_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result['mainData']['engagementOverview']
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch engagement data")

@router.post("/profiles")
async def get_customer_profiles(filters: CustomerInsightsFilters, request: Request):
    """Get customer segment profiles"""
    try:
        service = request.app.state.customer_insights_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result['mainData']['customerProfiles']
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch customer profiles")

@router.post("/behavior-insights")
async def get_behavior_insights(filters: CustomerInsightsFilters, request: Request):
    """Get AI-generated behavior insights"""
    try:
        service = request.app.state.customer_insights_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result['mainData']['behaviorInsights']
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch behavior insights")

@router.post("/recommendations")
async def get_recommendations(filters: CustomerInsightsFilters, request: Request):
    """Get AI recommendations for customer engagement"""
    try:
        service = request.app.state.customer_insights_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result['mainData']['recommendations']
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")

@router.post("/export")
async def export_data(
    filters: CustomerInsightsFilters,
    request: Request,
    format: Optional[str] = Query("csv", description="Export format (csv or json)")
):
    """Export customer insights data in CSV or JSON format"""
    try:
        service = request.app.state.customer_insights_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.export_data(filter_dict, format)

        if format == "csv":
            return Response(
                content=result,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=customer-insights-{int(datetime.now().timestamp())}.csv"
                }
            )
        else:
            return Response(
                content=result,
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=customer-insights-{int(datetime.now().timestamp())}.json"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to export data")