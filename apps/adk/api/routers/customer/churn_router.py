"""FastAPI router for churn prediction endpoints"""

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import Response
from typing import Dict, List, Optional
import json

from domains.customer.churn_prediction.processing_service import ChurnProcessingService
from domains.customer.churn_prediction.models import ChurnFilters, ChurnSummaryResponse, Customer

# Initialize router with prefix matching Express routes
router = APIRouter(prefix="/api/churn", tags=["churn"])

# Service will be initialized from app.state


@router.post("/summary")
async def get_dashboard_summary(filters: ChurnFilters, request: Request):
    """Main dashboard endpoint - returns all churn metrics

    Direct replacement for Express /api/churn/summary
    """
    try:
        # Use cached service from app state
        service = request.app.state.churn_service
        # Convert Pydantic model to dict, handling arrays
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

        # Handle arrays - pass full arrays to filter engine
        if filters.riskLevels and len(filters.riskLevels) > 0:
            filter_dict['riskLevels'] = filters.riskLevels
        elif filters.riskLevel:
            filter_dict['riskLevels'] = [filters.riskLevel]

        if filters.segments and len(filters.segments) > 0:
            filter_dict['segments'] = filters.segments
        elif filters.segment:
            filter_dict['segments'] = [filters.segment]

        # Handle product categories
        if filters.productCategories and len(filters.productCategories) > 0:
            filter_dict['productCategories'] = filters.productCategories

        result = await service.get_dashboard_summary(filter_dict)
        return result
    except Exception as e:
        print(f"[ChurnRouter] Error in dashboard_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feature-importance")
async def get_feature_importance(filters: ChurnFilters, request: Request):
    """Get feature importance for churn prediction

    Direct replacement for Express /api/churn/feature-importance
    """
    try:
        service = request.app.state.churn_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_feature_importance(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch feature importance")


@router.post("/segment-comparison")
async def get_segment_comparison(filters: ChurnFilters, request: Request):
    """Get segment risk comparison

    Direct replacement for Express /api/churn/segment-comparison
    """
    try:
        service = request.app.state.churn_service
        filter_dict = filters.dict(exclude_none=True)
        segment_risk = await service.get_segment_risk(filter_dict)

        # Format for segment comparison (matching Express)
        risk_levels = ["Very High", "High", "Medium", "Low"]
        result = []

        for segment_data in segment_risk:
            for level in risk_levels:
                key = level.lower().replace(" ", "_")
                result.append({
                    "segment": segment_data["segment"],
                    "riskLevel": level,
                    "count": segment_data.get(key, 0),
                    "percentage": 0  # Can be calculated if needed
                })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch segment comparison")


@router.post("/risk-trends")
async def get_risk_trends(filters: ChurnFilters, request: Request):
    """Get risk trends over time

    Direct replacement for Express /api/churn/risk-trends
    """
    try:
        service = request.app.state.churn_service
        filter_dict = filters.dict(exclude_none=True)
        monthly_risk = await service.get_monthly_risk(filter_dict)

        # Format for risk trends (matching Express)
        result = []
        for month_data in monthly_risk:
            result.append({
                "date": month_data["month"],
                "low": month_data["low_risk"],
                "medium": month_data["medium_risk"],
                "high": month_data["high_risk"],
                "veryHigh": month_data["very_high_risk"]
            })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch risk trends")


@router.post("/customers")
async def get_customers(filters: ChurnFilters, request: Request):
    """Get customer list with risk scores

    Direct replacement for Express /api/churn/customers
    """
    try:
        service = request.app.state.churn_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_customers(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch customers")


@router.post("/export")
async def export_data(
    filters: ChurnFilters,
    request: Request,
    format: Optional[str] = Query("csv", description="Export format (csv or json)")
):
    """Export customer data in CSV or JSON format

    Direct replacement for Express /api/churn/export
    """
    try:
        service = request.app.state.churn_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.export_data(filter_dict, format)

        if format == "csv":
            return Response(
                content=result,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=churn-data-{int(datetime.now().timestamp())}.csv"
                }
            )
        else:
            return Response(
                content=result,
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=churn-data-{int(datetime.now().timestamp())}.json"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to export data")


# Import datetime for export endpoint
from datetime import datetime


