"""FastAPI router for customer behavior endpoints"""

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import Response
from typing import Dict, List, Optional
import json
from datetime import datetime

from domains.customer_behavior.processing_service import CustomerBehaviorProcessingService
from domains.customer_behavior.models import (
    CustomerBehaviorFilters,
    BehaviorSummaryResponse,
    CustomerBehaviorDetail,
    PurchasePattern,
    ProductPreference,
    ChannelUsage,
    EngagementMetric,
    CustomerSegment
)

# Initialize router with prefix
router = APIRouter(prefix="/api/customer-behavior", tags=["customer-behavior"])

# Service will be initialized from app.state


@router.get("/test")
async def test_endpoint():
    """Test endpoint to check if the router is working"""
    return {"status": "ok", "message": "Customer behavior router is working"}

@router.post("/summary")
async def get_behavior_summary(request: Request):
    """Main dashboard endpoint - returns all customer behavior metrics

    Comprehensive analysis of customer behavior patterns
    """
    try:
        # Use cached service from app state
        service = request.app.state.customer_behavior_service

        # Get raw JSON body to handle both formats
        body = await request.json()

        # Convert to filter dict, handling both Pydantic and raw formats
        filter_dict = {}

        # Handle date filters (from frontend)
        if 'dateFrom' in body:
            filter_dict['dateFrom'] = body['dateFrom']
        if 'dateTo' in body:
            filter_dict['dateTo'] = body['dateTo']

        # Handle time period (from Pydantic model)
        if 'time_period' in body:
            filter_dict['time_period'] = body['time_period']

        # Handle segment filters
        if 'segment_id' in body:
            filter_dict['segment_id'] = body['segment_id']
        if 'segment_ids' in body:
            filter_dict['segment_ids'] = body['segment_ids']

        # Handle behavior types
        if 'behavior_types' in body:
            filter_dict['behavior_types'] = body['behavior_types']
        else:
            filter_dict['behavior_types'] = ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"]

        # Handle minimum transactions
        if 'min_transactions' in body:
            filter_dict['min_transactions'] = body['min_transactions']
        else:
            filter_dict['min_transactions'] = 2

        # Handle customer IDs filter
        if 'customer_ids' in body and len(body.get('customer_ids', [])) > 0:
            filter_dict['customer_ids'] = body['customer_ids']

        # Handle loyalty status filter
        if 'loyalty_status' in body and len(body.get('loyalty_status', [])) > 0:
            filter_dict['loyalty_status'] = body['loyalty_status']

        result = await service.get_dashboard_summary(filter_dict)
        return result
    except Exception as e:
        print(f"[CustomerBehaviorRouter] Error in behavior_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/purchase-patterns")
async def get_purchase_patterns(filters: CustomerBehaviorFilters, request: Request):
    """Get customer purchase patterns

    Analyzes frequency, recency, and spending patterns
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_purchase_patterns(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch purchase patterns")


@router.post("/product-preferences")
async def get_product_preferences(filters: CustomerBehaviorFilters, request: Request):
    """Get product category preferences

    Analyzes customer preferences across product categories
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_product_preferences(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch product preferences")


@router.post("/channel-usage")
async def get_channel_usage(filters: CustomerBehaviorFilters, request: Request):
    """Get channel usage patterns

    Analyzes customer behavior across different sales channels
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_channel_usage(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch channel usage")


@router.post("/engagement-metrics")
async def get_engagement_metrics(filters: CustomerBehaviorFilters, request: Request):
    """Get customer engagement metrics

    Calculates engagement scores, loyalty distribution, and churn risk
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_engagement_metrics(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch engagement metrics")


@router.post("/customer-segments")
async def get_customer_segments(filters: CustomerBehaviorFilters, request: Request):
    """Get customer segment analysis

    Analyzes behavior patterns across different customer segments
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_customer_segments(filter_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch customer segments")


@router.post("/top-customers")
async def get_top_customers(
    filters: CustomerBehaviorFilters,
    request: Request,
    limit: Optional[int] = Query(20, description="Number of top customers to return")
):
    """Get top customers by value and engagement

    Returns detailed behavior analysis for top customers
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.get_top_customers(filter_dict, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch top customers")


@router.post("/behavior-trends")
async def get_behavior_trends(filters: CustomerBehaviorFilters, request: Request):
    """Get behavior trends over time

    Analyzes how customer behavior patterns change over time
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)

        # Get purchase patterns over time
        patterns = await service.get_purchase_patterns(filter_dict)

        # Format as trends
        trends = []
        if patterns and 'spendPatterns' in patterns:
            trends.append({
                'metricName': 'Average Order Value',
                'currentValue': patterns['spendPatterns']['avgOrderValue'],
                'trend': 'stable'  # Would need historical data for actual trend
            })

        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch behavior trends")


@router.post("/rfm-analysis")
async def get_rfm_analysis(filters: CustomerBehaviorFilters, request: Request):
    """Get RFM (Recency, Frequency, Monetary) analysis

    Performs RFM segmentation on customer base
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)

        # Get engagement metrics which include RFM data
        engagement = await service.get_engagement_metrics(filter_dict)

        # Get customer segments for RFM breakdown
        segments = await service.get_customer_segments(filter_dict)

        return {
            'recencyDistribution': engagement.get('recencyDistribution', {}),
            'frequencyMetrics': engagement.get('engagementDistribution', {}),
            'monetarySegments': segments,
            'rfmSegments': segments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch RFM analysis")


@router.post("/clv-analysis")
async def get_clv_analysis(filters: CustomerBehaviorFilters, request: Request):
    """Get Customer Lifetime Value (CLV) analysis

    Analyzes customer lifetime value patterns and predictions
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)

        # Get top customers with CLV data
        top_customers = await service.get_top_customers(filter_dict, 100)

        # Calculate CLV statistics
        if top_customers:
            clv_values = [c['estimatedClv'] for c in top_customers if 'estimatedClv' in c]
            avg_clv = sum(clv_values) / len(clv_values) if clv_values else 0

            return {
                'averageClv': avg_clv,
                'topCustomersByClv': sorted(top_customers, key=lambda x: x.get('estimatedClv', 0), reverse=True)[:20],
                'clvDistribution': {
                    'low': len([v for v in clv_values if v < 1000]),
                    'medium': len([v for v in clv_values if 1000 <= v < 5000]),
                    'high': len([v for v in clv_values if 5000 <= v < 10000]),
                    'veryHigh': len([v for v in clv_values if v >= 10000])
                }
            }

        return {
            'averageClv': 0,
            'topCustomersByClv': [],
            'clvDistribution': {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch CLV analysis")


@router.post("/export")
async def export_data(
    filters: CustomerBehaviorFilters,
    request: Request,
    format: Optional[str] = Query("csv", description="Export format (csv or json)")
):
    """Export customer behavior data in CSV or JSON format

    Exports detailed customer behavior analysis data
    """
    try:
        service = request.app.state.customer_behavior_service
        filter_dict = filters.dict(exclude_none=True)
        result = await service.export_data(filter_dict, format)

        if format == "csv":
            return Response(
                content=result,
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=customer-behavior-{int(datetime.now().timestamp())}.csv"
                }
            )
        else:
            return Response(
                content=result,
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=customer-behavior-{int(datetime.now().timestamp())}.json"
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to export data")