"""API router for inventory level endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from domains.inventory_level.processing_service import InventoryLevelProcessingService
from domains.inventory_level.models import InventoryFilters

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/inventory-level", tags=["inventory"])

# Initialize service
service = InventoryLevelProcessingService()


@router.post("/dashboard")
async def get_dashboard_data(filters: InventoryFilters = None):
    """Get complete inventory level dashboard data"""
    try:
        filter_dict = filters.model_dump() if filters else {}
        # Remove None values
        filter_dict = {k: v for k, v in filter_dict.items() if v is not None}

        data = await service.get_dashboard_data(filter_dict)
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
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