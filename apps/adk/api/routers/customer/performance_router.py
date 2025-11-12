"""FastAPI router for performance deviation endpoints"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from typing import Dict, List, Optional
import json

from domains.customer.performance_deviation.processing_service import PerformanceProcessingService
from domains.customer.performance_deviation.models import PerformanceFilters, PerformanceSummaryResponse

# Initialize router with prefix
router = APIRouter(prefix="/api/performance", tags=["performance"])


@router.post("/summary")
async def get_dashboard_summary(filters: PerformanceFilters, request: Request):
    """Main dashboard endpoint - returns all performance deviation metrics

    This single endpoint serves both the frontend dashboard and the agent tool.
    """
    try:
        # Get service from app state (initialized in main.py)
        service = request.app.state.performance_service

        # Convert Pydantic model to dict - simpler approach
        filter_dict = filters.dict(exclude_none=True)

        print(f"[API Router] Received filters: {filter_dict}")

        # Get dashboard summary
        result = await service.get_dashboard_summary(filter_dict)

        return result

    except Exception as e:
        print(f"[PerformanceRouter] Error in dashboard_summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feature-importance")
async def get_feature_importance(filters: PerformanceFilters, request: Request):
    """Get feature importance for performance deviations

    Subset of summary endpoint focused on feature importance.
    """
    try:
        service = request.app.state.performance_service
        filter_dict = filters.dict(exclude_none=True)

        # Get full summary
        result = await service.get_dashboard_summary(filter_dict)

        # Return only feature importance
        return result.get('featureImportance', {})

    except Exception as e:
        print(f"[PerformanceRouter] Error in feature_importance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch feature importance")


@router.post("/variance-decomposition")
async def get_variance_decomposition(filters: PerformanceFilters, request: Request):
    """Get variance decomposition for performance metrics

    Subset of summary endpoint focused on variance analysis.
    """
    try:
        service = request.app.state.performance_service
        filter_dict = filters.dict(exclude_none=True)

        # Get full summary
        result = await service.get_dashboard_summary(filter_dict)

        # Return only variance decomposition
        return result.get('varianceDecomposition', {})

    except Exception as e:
        print(f"[PerformanceRouter] Error in variance_decomposition: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch variance decomposition")


@router.post("/deviation-patterns")
async def get_deviation_patterns(filters: PerformanceFilters, request: Request):
    """Get deviation patterns over time

    Subset of summary endpoint focused on pattern analysis.
    """
    try:
        service = request.app.state.performance_service
        filter_dict = filters.dict(exclude_none=True)

        # Get full summary
        result = await service.get_dashboard_summary(filter_dict)

        # Return only deviation patterns
        return result.get('deviationPatterns', {})

    except Exception as e:
        print(f"[PerformanceRouter] Error in deviation_patterns: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch deviation patterns")


@router.get("/filters")
async def get_available_filters(request: Request):
    """Get available filter options

    Returns lists of available business functions, segments, etc.
    """
    try:
        return {
            "businessFunctions": ["sales", "customer", "finance"],
            "timeRanges": [
                {"value": "30d", "label": "Last 30 Days"},
                {"value": "90d", "label": "Last 90 Days"},
                {"value": "180d", "label": "Last 180 Days"},
                {"value": "1y", "label": "Last Year"},
                {"value": "custom", "label": "Custom Range"}
            ],
            "significanceThresholds": [
                {"value": 0.01, "label": "Very High (0.01)"},
                {"value": 0.05, "label": "High (0.05)"},
                {"value": 0.10, "label": "Medium (0.10)"},
                {"value": 0.20, "label": "Low (0.20)"}
            ]
        }

    except Exception as e:
        print(f"[PerformanceRouter] Error in get_available_filters: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch filter options")