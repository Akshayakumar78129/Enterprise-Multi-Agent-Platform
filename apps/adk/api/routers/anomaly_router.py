"""FastAPI router for anomaly detection endpoints"""

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import Response
from typing import Dict, List, Optional
import json
from datetime import datetime

from domains.anomaly_detection.processing_service import AnomalyProcessingService
from domains.anomaly_detection.models import (
    AnomalyFilters,
    AnomalySummaryResponse,
    CustomerAnomaly,
    SegmentDistribution,
    RegionDistribution,
    SeverityDistribution,
    FeatureImportance,
    TimeSeriesAnomaly
)

# Initialize router with prefix matching Express routes
router = APIRouter(prefix="/api/anomaly", tags=["anomaly"])

# Service will be initialized from app.state


@router.post("/summary")
async def get_dashboard_summary(filters: AnomalyFilters, request: Request):
    """Main dashboard endpoint - returns all anomaly detection metrics

    Direct replacement for Express /api/anomaly/summary
    """
    try:
        # Use cached service from app state
        service = request.app.state.anomaly_service

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
        if filters.contamination:
            filter_dict['contamination'] = filters.contamination

        # Handle arrays - pass full arrays to filter engine
        if filters.severityLevels and len(filters.severityLevels) > 0:
            filter_dict['severityLevels'] = filters.severityLevels
        elif filters.severityLevel:
            filter_dict['severityLevels'] = [filters.severityLevel]

        if filters.segments and len(filters.segments) > 0:
            filter_dict['segments'] = filters.segments
        elif filters.segment:
            filter_dict['segments'] = [filters.segment]

        if filters.regions and len(filters.regions) > 0:
            filter_dict['regions'] = filters.regions
        elif filters.region:
            filter_dict['regions'] = [filters.region]

        result = await service.get_dashboard_summary(filter_dict)
        return result
    except Exception as e:
        print(f"[AnomalyRouter] Error in dashboard_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/customer-anomalies")
async def get_customer_anomalies(filters: AnomalyFilters, request: Request):
    """Get detailed customer anomaly data

    Returns list of customers with anomaly scores and details
    """
    try:
        service = request.app.state.anomaly_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_customer_anomalies(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch customer anomalies")


@router.post("/feature-importance")
async def get_feature_importance(filters: AnomalyFilters, request: Request):
    """Get feature importance for anomaly detection

    Returns features that contribute most to anomaly detection
    """
    try:
        service = request.app.state.anomaly_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_feature_importance(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch feature importance")


@router.post("/segment-distribution")
async def get_segment_distribution(filters: AnomalyFilters, request: Request):
    """Get anomaly distribution across segments

    Returns anomaly rates and severity distribution by segment
    """
    try:
        service = request.app.state.anomaly_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_segment_distribution(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch segment distribution")


@router.post("/region-distribution")
async def get_region_distribution(filters: AnomalyFilters, request: Request):
    """Get anomaly distribution across regions

    Returns anomaly rates by geographic region
    """
    try:
        service = request.app.state.anomaly_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_region_distribution(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch region distribution")


@router.post("/severity-distribution")
async def get_severity_distribution(filters: AnomalyFilters, request: Request):
    """Get distribution of anomaly severity levels

    Returns count and percentage by severity level (1-5)
    """
    try:
        service = request.app.state.anomaly_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_severity_distribution(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch severity distribution")


@router.post("/time-series")
async def get_time_series_anomalies(filters: AnomalyFilters, request: Request):
    """Get anomaly trends over time

    Returns time series data showing anomaly patterns
    """
    try:
        service = request.app.state.anomaly_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_time_series_anomalies(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch time series anomalies")


@router.post("/customers")
async def get_customers(filters: AnomalyFilters, request: Request):
    """Get customer list with anomaly detection results

    Returns detailed customer information with anomaly scores
    """
    try:
        service = request.app.state.anomaly_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_customers(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch customers")


@router.post("/export")
async def export_data(
    filters: AnomalyFilters,
    request: Request,
    format: Optional[str] = Query("csv", description="Export format (csv or json)")
):
    """Export anomaly data in CSV or JSON format

    Direct replacement for Express /api/anomaly/export
    """
    try:
        service = request.app.state.anomaly_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.export_data(filter_dict, format)

        if format == "csv":
            return Response(
                content=result,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=anomaly-data-{int(datetime.now().timestamp())}.csv"
                }
            )
        else:
            return Response(
                content=result,
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=anomaly-data-{int(datetime.now().timestamp())}.json"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to export data")


@router.post("/retrain")
async def retrain_model(request: Request, contamination: Optional[float] = 0.1):
    """Retrain the anomaly detection model

    Allows retraining with different contamination rates
    """
    try:
        service = request.app.state.anomaly_service
        await service._train_ml_model()
        return {"status": "success", "message": "Model retrained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrain model: {str(e)}")