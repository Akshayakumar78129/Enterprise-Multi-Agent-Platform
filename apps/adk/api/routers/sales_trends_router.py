"""API endpoints for sales trends analysis"""

from fastapi import APIRouter, HTTPException, Query, Request
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import importlib
import sys

# Force reload of modules to get latest code
if 'domains.sales_trends.data_service' in sys.modules:
    importlib.reload(sys.modules['domains.sales_trends.data_service'])
if 'domains.sales_trends.processing_service' in sys.modules:
    importlib.reload(sys.modules['domains.sales_trends.processing_service'])
if 'domains.sales_trends.schema' in sys.modules:
    importlib.reload(sys.modules['domains.sales_trends.schema'])

from domains.sales_trends.processing_service import SalesTrendsProcessingService
from domains.sales_trends.models import SalesTrendFilters

router = APIRouter(prefix="/api/sales-trends", tags=["sales-trends"])
processing_service = SalesTrendsProcessingService()


class SalesTrendsFiltersRequest(BaseModel):
    """Filters for sales trends analysis"""
    dateFrom: Optional[str] = "2017-01-01"
    dateTo: Optional[str] = "2021-12-31"
    granularity: Optional[str] = "monthly"
    metric: Optional[str] = "revenue"
    dimension: Optional[str] = None
    topN: Optional[int] = 10
    customerCategory: Optional[List[str]] = []
    customerRegion: Optional[List[str]] = []
    itemName: Optional[List[str]] = []


@router.post("/summary")
async def get_dashboard_summary(filters: SalesTrendsFiltersRequest, request: Request):
    """Main dashboard endpoint - returns all sales trends metrics (POST with filters)"""
    try:
        # Create fresh service instance to avoid stale module cache
        service = SalesTrendsProcessingService()

        # Convert Pydantic model to dict for processing service
        filter_dict = {}

        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.granularity:
            filter_dict['granularity'] = filters.granularity
        if filters.metric:
            filter_dict['metric'] = filters.metric
        if filters.dimension:
            filter_dict['dimension'] = filters.dimension
        if filters.topN:
            filter_dict['topN'] = filters.topN
        if filters.customerCategory and len(filters.customerCategory) > 0:
            filter_dict['customerCategory'] = filters.customerCategory
        if filters.customerRegion and len(filters.customerRegion) > 0:
            filter_dict['customerRegion'] = filters.customerRegion
        if filters.itemName and len(filters.itemName) > 0:
            filter_dict['itemName'] = filters.itemName

        result = await service.get_dashboard_data(filter_dict)
        return result
    except Exception as e:
        print(f"[SalesTrendsRouter] Error in dashboard_summary: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_dashboard(
    dateFrom: Optional[str] = Query("2017-01-01"),
    dateTo: Optional[str] = Query("2021-12-31"),
    granularity: Optional[str] = Query("monthly"),
    metric: Optional[str] = Query("revenue"),
    dimension: Optional[str] = Query(None),
    topN: Optional[int] = Query(10),
    customerCategory: Optional[List[str]] = Query(None),
    customerRegion: Optional[List[str]] = Query(None),
    itemName: Optional[List[str]] = Query(None)
) -> Dict[str, Any]:
    """Get sales trends dashboard data (GET with query params)"""
    try:
        filters = {
            'dateFrom': dateFrom,
            'dateTo': dateTo,
            'granularity': granularity,
            'metric': metric,
            'topN': topN
        }

        if dimension:
            filters['dimension'] = dimension
        if customerCategory:
            filters['customerCategory'] = customerCategory
        if customerRegion:
            filters['customerRegion'] = customerRegion
        if itemName:
            filters['itemName'] = itemName

        result = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": result}

    except Exception as e:
        print(f"[SalesTrendsRouter] Error in get_dashboard: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpis")
async def get_kpis(
    dateFrom: Optional[str] = Query("2017-01-01"),
    dateTo: Optional[str] = Query("2021-12-31")
) -> Dict[str, Any]:
    """Get sales trends KPIs"""
    try:
        filters = {
            'dateFrom': dateFrom,
            'dateTo': dateTo
        }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('kpiMetrics', {})}

    except Exception as e:
        print(f"[SalesTrendsRouter] Error in get_kpis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/time-series")
async def get_time_series(
    dateFrom: Optional[str] = Query("2017-01-01"),
    dateTo: Optional[str] = Query("2021-12-31"),
    granularity: Optional[str] = Query("monthly")
) -> Dict[str, Any]:
    """Get time series data"""
    try:
        filters = {
            'dateFrom': dateFrom,
            'dateTo': dateTo,
            'granularity': granularity
        }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('timeSeries', [])}

    except Exception as e:
        print(f"[SalesTrendsRouter] Error in get_time_series: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/seasonality")
async def get_seasonality(
    dateFrom: Optional[str] = Query("2017-01-01"),
    dateTo: Optional[str] = Query("2021-12-31")
) -> Dict[str, Any]:
    """Get seasonality data"""
    try:
        filters = {
            'dateFrom': dateFrom,
            'dateTo': dateTo
        }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('seasonality', [])}

    except Exception as e:
        print(f"[SalesTrendsRouter] Error in get_seasonality: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/growth-rates")
async def get_growth_rates(
    dateFrom: Optional[str] = Query("2017-01-01"),
    dateTo: Optional[str] = Query("2021-12-31"),
    granularity: Optional[str] = Query("monthly")
) -> Dict[str, Any]:
    """Get growth rate data"""
    try:
        filters = {
            'dateFrom': dateFrom,
            'dateTo': dateTo,
            'granularity': granularity
        }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('growthRates', [])}

    except Exception as e:
        print(f"[SalesTrendsRouter] Error in get_growth_rates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-performers")
async def get_top_performers(
    dateFrom: Optional[str] = Query("2017-01-01"),
    dateTo: Optional[str] = Query("2021-12-31"),
    dimension: Optional[str] = Query("product"),
    topN: Optional[int] = Query(10)
) -> Dict[str, Any]:
    """Get top performers by dimension"""
    try:
        filters = {
            'dateFrom': dateFrom,
            'dateTo': dateTo,
            'dimension': dimension,
            'topN': topN
        }

        data = await processing_service.get_dashboard_data(filters)
        return {"success": True, "data": data.get('mainData', {}).get('topPerformers', [])}

    except Exception as e:
        print(f"[SalesTrendsRouter] Error in get_top_performers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/filter-options")
async def get_filter_options() -> Dict[str, Any]:
    """Get available filter options from database"""
    try:
        from domains.sales_trends.data_service import SalesTrendsDataService
        import asyncio

        data_service = SalesTrendsDataService()

        # Get distinct values for filters
        customer_categories_sql = '''
            SELECT DISTINCT TRIM(CAST("Customer Type Desc" AS TEXT)) AS val
            FROM "dbo_D_Customer"
            WHERE "Customer Type Desc" IS NOT NULL AND TRIM(CAST("Customer Type Desc" AS TEXT)) <> ''
            ORDER BY val
            LIMIT 200
        '''

        customer_regions_sql = '''
            SELECT DISTINCT TRIM(CAST("Customer State/Prov" AS TEXT)) AS val
            FROM "dbo_D_Customer"
            WHERE "Customer State/Prov" IS NOT NULL AND TRIM(CAST("Customer State/Prov" AS TEXT)) <> ''
            ORDER BY val
            LIMIT 200
        '''

        item_names_sql = '''
            SELECT DISTINCT TRIM(CAST("Item Desc" AS TEXT)) AS val
            FROM "dbo_D_Item"
            WHERE "Item Desc" IS NOT NULL AND TRIM(CAST("Item Desc" AS TEXT)) <> ''
            ORDER BY val
            LIMIT 200
        '''

        # Execute queries
        customer_categories = await data_service.execute_query(customer_categories_sql)
        customer_regions = await data_service.execute_query(customer_regions_sql)
        item_names = await data_service.execute_query(item_names_sql)

        options = {
            'customerCategories': [row['val'] for row in customer_categories],
            'customerRegions': [row['val'] for row in customer_regions],
            'itemNames': [row['val'] for row in item_names],
            'granularities': ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
            'metrics': ['revenue', 'units', 'aov', 'margin'],
            'dimensions': ['product', 'category', 'region', 'customer']
        }

        return {"success": True, "data": options}
    except Exception as e:
        print(f"[SalesTrendsRouter] Error getting filter options: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
