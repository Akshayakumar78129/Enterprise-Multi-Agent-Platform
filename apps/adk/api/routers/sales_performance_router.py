"""API endpoints for sales performance analysis"""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import importlib
import sys

# Force reload of modules to get latest code
if 'domains.sales_performance.data_service' in sys.modules:
    importlib.reload(sys.modules['domains.sales_performance.data_service'])
if 'domains.sales_performance.processing_service' in sys.modules:
    importlib.reload(sys.modules['domains.sales_performance.processing_service'])
if 'domains.sales_performance.schema' in sys.modules:
    importlib.reload(sys.modules['domains.sales_performance.schema'])

from domains.sales_performance.processing_service import SalesPerformanceProcessingService
from domains.sales_performance.models import SalesFilters

router = APIRouter(prefix="/api/sales-performance", tags=["sales-performance"])
processing_service = SalesPerformanceProcessingService()


class SalesPerformanceFilters(BaseModel):
    """Filters for sales performance analysis"""
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    regions: Optional[List[str]] = []
    categories: Optional[List[str]] = []
    products: Optional[List[str]] = []
    customers: Optional[List[str]] = []
    segments: Optional[List[str]] = []
    dimension: Optional[str] = None
    metric: Optional[str] = None


@router.post("/summary")
async def get_dashboard_summary(filters: SalesPerformanceFilters, request: Request):
    """Main dashboard endpoint - returns all sales performance metrics (POST with filters)"""
    try:
        # Create fresh service instance to avoid stale module cache
        service = SalesPerformanceProcessingService()

        # Convert Pydantic model to dict for processing service
        filter_dict = {}

        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.regions and len(filters.regions) > 0:
            filter_dict['regions'] = filters.regions
        if filters.categories and len(filters.categories) > 0:
            filter_dict['categories'] = filters.categories
        if filters.products and len(filters.products) > 0:
            filter_dict['products'] = filters.products
        if filters.customers and len(filters.customers) > 0:
            filter_dict['customers'] = filters.customers
        if filters.segments and len(filters.segments) > 0:
            filter_dict['segments'] = filters.segments
        if filters.dimension:
            filter_dict['dimension'] = filters.dimension
        if filters.metric:
            filter_dict['metric'] = filters.metric

        result = await service.get_dashboard_data(filter_dict)
        return result
    except Exception as e:
        print(f"[SalesPerformanceRouter] Error in dashboard_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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


@router.get("/filter-options")
async def get_filter_options() -> Dict[str, Any]:
    """Get available filter options (regions, categories) from database"""
    try:
        from domains.sales_performance.data_service import SalesPerformanceDataService
        data_service = SalesPerformanceDataService()
        options = await data_service.get_filter_options()
        return {"success": True, "data": options}
    except Exception as e:
        print(f"[SalesPerformanceRouter] Error getting filter options: {e}")
        raise HTTPException(status_code=500, detail=str(e))