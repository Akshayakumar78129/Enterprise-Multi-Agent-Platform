"""API endpoints for regional sales analyzer"""

from fastapi import APIRouter, HTTPException, Request
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import importlib
import sys

# Force reload of modules to get latest code
if 'domains.regional_sales_analyzer.data_service' in sys.modules:
    importlib.reload(sys.modules['domains.regional_sales_analyzer.data_service'])
if 'domains.regional_sales_analyzer.processing_service' in sys.modules:
    importlib.reload(sys.modules['domains.regional_sales_analyzer.processing_service'])
if 'domains.regional_sales_analyzer.schema' in sys.modules:
    importlib.reload(sys.modules['domains.regional_sales_analyzer.schema'])

from domains.sales.regional_sales_analyzer.processing_service import RegionalSalesAnalyzerProcessingService
from domains.sales.regional_sales_analyzer.models import RegionalFilters

router = APIRouter(prefix="/api/regional-sales-analyzer", tags=["regional-sales-analyzer"])
processing_service = RegionalSalesAnalyzerProcessingService()


class RegionalSalesFilters(BaseModel):
    """Filters for regional sales analysis"""
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    countries: Optional[List[str]] = []
    states: Optional[List[str]] = []
    aggregation: Optional[str] = 'month'  # day, week, month, quarter


@router.post("/summary")
async def get_dashboard_summary(filters: RegionalSalesFilters, request: Request):
    """Main dashboard endpoint - returns all regional sales analyzer metrics (POST with filters)"""
    try:
        # Create fresh service instance to avoid stale module cache
        service = RegionalSalesAnalyzerProcessingService()

        # Convert Pydantic model to dict for processing service
        filter_dict = {}

        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.countries and len(filters.countries) > 0:
            filter_dict['countries'] = filters.countries
        if filters.states and len(filters.states) > 0:
            filter_dict['states'] = filters.states
        if filters.aggregation:
            filter_dict['aggregation'] = filters.aggregation

        result = await service.get_dashboard_data(filter_dict)
        return result
    except Exception as e:
        print(f"[RegionalSalesAnalyzerRouter] Error in dashboard_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/filter-options")
async def get_filter_options() -> Dict[str, Any]:
    """Get available filter options (countries, states) from database"""
    try:
        from domains.sales.regional_sales_analyzer.data_service import RegionalSalesAnalyzerDataService
        data_service = RegionalSalesAnalyzerDataService()
        options = await data_service.get_available_regions()
        return {"success": True, "data": options}
    except Exception as e:
        print(f"[RegionalSalesAnalyzerRouter] Error getting filter options: {e}")
        raise HTTPException(status_code=500, detail=str(e))
