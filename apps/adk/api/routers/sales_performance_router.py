"""API endpoints for sales performance analysis"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from domains.sales_performance.processing_service import SalesPerformanceProcessingService
from domains.sales_performance.models import SalesFilters

router = APIRouter(prefix="/api/sales-performance", tags=["sales-performance"])
processing_service = SalesPerformanceProcessingService()


@router.get("/dashboard")
async def get_dashboard(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    region: Optional[List[str]] = Query(None),
    category: Optional[List[str]] = Query(None),
    product: Optional[List[str]] = Query(None),
    customer: Optional[List[str]] = Query(None),
    segment: Optional[List[str]] = Query(None)
) -> Dict[str, Any]:
    """Get sales performance dashboard data"""
    try:
        filters = {}

        # Build date range filter
        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        # Add other filters
        if region:
            filters['region'] = region
        if category:
            filters['category'] = category
        if product:
            filters['product'] = product
        if customer:
            filters['customer'] = customer
        if segment:
            filters['segment'] = segment

        result = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyze")
async def analyze_performance(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    region: Optional[List[str]] = Query(None),
    category: Optional[List[str]] = Query(None),
    product: Optional[List[str]] = Query(None)
) -> Dict[str, Any]:
    """Analyze sales performance with insights"""
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
        if product:
            filters['product'] = product

        result = await processing_service.analyze_sales_performance(filters)
        return {"success": True, "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpis")
async def get_kpis(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get sales KPIs"""
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


@router.get("/products")
async def get_product_performance(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    category: Optional[List[str]] = Query(None)
) -> Dict[str, Any]:
    """Get product performance data"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        if category:
            filters['category'] = category

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('productPerformance', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/regions")
async def get_regional_performance(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None),
    region: Optional[List[str]] = Query(None)
) -> Dict[str, Any]:
    """Get regional performance data"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        if region:
            filters['region'] = region

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('regionPerformance', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def get_sales_trends(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get sales trends"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('salesTrends', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_category_performance(
    dateRange_startDate: Optional[str] = Query(None),
    dateRange_endDate: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Get category performance"""
    try:
        filters = {}

        if dateRange_startDate and dateRange_endDate:
            filters['dateRange'] = {
                'startDate': dateRange_startDate,
                'endDate': dateRange_endDate
            }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('categoryPerformance', [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))