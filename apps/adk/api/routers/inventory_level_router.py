"""API router for inventory level endpoints"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
import logging
from domains.inventory_level.processing_service import InventoryLevelProcessingService
from domains.inventory_level.models import InventoryFilters

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/inventory-level", tags=["inventory"])

# Initialize service
service = InventoryLevelProcessingService()


@router.get("/summary")
async def get_summary(
    startDate: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    endDate: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    warehouse: Optional[List[str]] = Query(None, description="Warehouse filter (can specify multiple)"),
    category: Optional[List[str]] = Query(None, description="Category filter (can specify multiple)"),
    status: Optional[List[str]] = Query(None, description="Status filter (low, normal, excess, can specify multiple)")
):
    """Get inventory level summary (GET method for frontend)"""
    try:
        logger.info(f"Received filters - startDate: {startDate}, endDate: {endDate}, warehouse: {warehouse}, category: {category}, status: {status}")

        filters = {}

        # Build date range
        if startDate and endDate:
            filters['dateRange'] = {
                'startDate': startDate,
                'endDate': endDate
            }

        # Add other filters (already as lists from Query)
        if warehouse:
            filters['warehouse'] = warehouse
        if category:
            filters['category'] = category
        if status:
            filters['status'] = status

        logger.info(f"Built filters dict: {filters}")
        data = await service.get_dashboard_data(filters)
        logger.info(f"Returned data - KPIs: {data.get('kpis', {})}, Stock levels count: {len(data.get('stockLevels', []))}")

        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error getting summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dashboard")
async def get_dashboard_data(request_body: Dict[str, Any]):
    """Get complete inventory level dashboard data"""
    try:
        logger.info(f"Received POST /dashboard with body: {request_body}")

        # Pass filters directly to FilterEngine - it expects dateFrom/dateTo, NOT dateRange
        filters = {}

        # Keep dateFrom/dateTo as-is for FilterEngine
        if 'dateFrom' in request_body:
            filters['dateFrom'] = request_body['dateFrom']
        if 'dateTo' in request_body:
            filters['dateTo'] = request_body['dateTo']

        # Handle legacy dateRange format
        if 'dateRange' in request_body and request_body['dateRange']:
            filters['dateFrom'] = request_body['dateRange'].get('startDate')
            filters['dateTo'] = request_body['dateRange'].get('endDate')

        # Copy other filter arrays
        if request_body.get('warehouse'):
            filters['warehouse'] = request_body['warehouse']
        if request_body.get('category'):
            filters['category'] = request_body['category']
        if request_body.get('status'):
            filters['status'] = request_body['status']

        logger.info(f"🔍 Converted filters for FilterEngine: {filters}")

        data = await service.get_dashboard_data(filters)
        logger.info(f"✅ Returned data - KPIs: {data.get('kpis', {})}, Stock levels: {len(data.get('stockLevels', []))}")

        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"❌ Error getting dashboard data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/kpis")
async def get_inventory_kpis(filters: InventoryFilters = None):
    """Get inventory KPIs"""
    try:
        filter_dict = filters.model_dump() if filters else {}
        filter_dict = {k: v for k, v in filter_dict.items() if v is not None}

        kpis = await service.get_inventory_kpis(filter_dict)
        return {
            "success": True,
            "data": kpis
        }
    except Exception as e:
        logger.error(f"Error getting KPIs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stock-levels")
async def get_stock_levels(filters: InventoryFilters = None):
    """Get current stock levels"""
    try:
        filter_dict = filters.model_dump() if filters else {}
        filter_dict = {k: v for k, v in filter_dict.items() if v is not None}

        levels = await service.get_stock_levels(filter_dict)
        return {
            "success": True,
            "data": levels
        }
    except Exception as e:
        logger.error(f"Error getting stock levels: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/movements")
async def get_inventory_movements(filters: InventoryFilters = None):
    """Get inventory movement trends"""
    try:
        filter_dict = filters.model_dump() if filters else {}
        filter_dict = {k: v for k, v in filter_dict.items() if v is not None}

        movements = await service.get_inventory_movements(filter_dict)
        return {
            "success": True,
            "data": movements
        }
    except Exception as e:
        logger.error(f"Error getting movements: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/health")
async def analyze_inventory_health(filters: InventoryFilters = None):
    """Analyze overall inventory health"""
    try:
        filter_dict = filters.model_dump() if filters else {}
        filter_dict = {k: v for k, v in filter_dict.items() if v is not None}

        health = await service.analyze_inventory_health(filter_dict)
        return {
            "success": True,
            "data": health
        }
    except Exception as e:
        logger.error(f"Error analyzing health: {e}")
        raise HTTPException(status_code=500, detail=str(e))
