"""FastAPI router for inventory holding cost analysis endpoints"""

from fastapi import APIRouter, HTTPException, Request
from typing import Dict, List, Optional
from datetime import datetime

from domains.inventory.holding_cost.processing_service import HoldingCostProcessingService
from domains.inventory.holding_cost.models import HoldingCostFilters, HoldingCostSummaryResponse

# Initialize router with prefix
router = APIRouter(prefix="/api/inventory/holding-cost", tags=["inventory", "holding-cost"])

# Service will be initialized from app.state


@router.post("/summary")
async def get_dashboard_summary(filters: HoldingCostFilters, request: Request):
    """Main dashboard endpoint - returns all holding cost metrics

    Returns:
        Complete dashboard summary with KPIs, category/warehouse analysis, and insights
    """
    try:
        # Use cached service from app state
        service = request.app.state.holding_cost_service

        # Convert Pydantic model to dict, handling arrays
        filter_dict = {}

        # Handle single values
        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.search:
            filter_dict['search'] = filters.search
        if filters.minHoldingCost is not None:
            filter_dict['minHoldingCost'] = filters.minHoldingCost
        if filters.maxHoldingCost is not None:
            filter_dict['maxHoldingCost'] = filters.maxHoldingCost
        if filters.excessiveOnly is not None:
            filter_dict['excessiveOnly'] = filters.excessiveOnly
        if filters.annualHoldingCostRate is not None:
            filter_dict['annualHoldingCostRate'] = filters.annualHoldingCostRate
        if filters.opportunityCostRate is not None:
            filter_dict['opportunityCostRate'] = filters.opportunityCostRate

        # Handle arrays - pass full arrays to filter engine
        if filters.categories and len(filters.categories) > 0:
            filter_dict['categories'] = filters.categories
        elif filters.category:
            filter_dict['categories'] = [filters.category]

        if filters.warehouseIds and len(filters.warehouseIds) > 0:
            filter_dict['warehouseIds'] = filters.warehouseIds
        elif filters.warehouseId:
            filter_dict['warehouseIds'] = [filters.warehouseId]

        result = await service.get_dashboard_summary(filter_dict)
        return result

    except Exception as e:
        import traceback
        print(f"[HoldingCostRouter] Error in dashboard_summary: {e}")
        print(f"[HoldingCostRouter] Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/category-analysis")
async def get_category_analysis(filters: HoldingCostFilters, request: Request):
    """Get category-level holding cost analysis

    Returns:
        List of category summaries with holding costs
    """
    try:
        service = request.app.state.holding_cost_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result.get('categoryAnalysis', [])

    except Exception as e:
        print(f"[HoldingCostRouter] Error in category_analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch category analysis")


@router.post("/warehouse-analysis")
async def get_warehouse_analysis(filters: HoldingCostFilters, request: Request):
    """Get warehouse-level holding cost analysis

    Returns:
        List of warehouse summaries with holding costs
    """
    try:
        service = request.app.state.holding_cost_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result.get('warehouseAnalysis', [])

    except Exception as e:
        print(f"[HoldingCostRouter] Error in warehouse_analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch warehouse analysis")


@router.post("/high-cost-items")
async def get_high_cost_items(filters: HoldingCostFilters, request: Request):
    """Get items with highest holding costs

    Returns:
        List of high-cost items sorted by total holding cost
    """
    try:
        service = request.app.state.holding_cost_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result.get('highCostItems', [])

    except Exception as e:
        print(f"[HoldingCostRouter] Error in high_cost_items: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch high-cost items")


@router.post("/cost-breakdown")
async def get_cost_breakdown(filters: HoldingCostFilters, request: Request):
    """Get breakdown of holding cost components

    Returns:
        Cost breakdown by component (storage, opportunity, risk)
    """
    try:
        service = request.app.state.holding_cost_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result.get('costBreakdown', [])

    except Exception as e:
        print(f"[HoldingCostRouter] Error in cost_breakdown: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch cost breakdown")
