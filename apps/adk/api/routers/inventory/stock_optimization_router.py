"""FastAPI router for stock optimization analysis endpoints"""

from fastapi import APIRouter, HTTPException, Request
from typing import Dict, List, Optional
from datetime import datetime

from domains.inventory.stock_optimization.processing_service import StockOptimizationProcessingService
from domains.inventory.stock_optimization.models import StockOptimizationFilters

# Initialize router with prefix
router = APIRouter(prefix="/api/inventory/stock-optimization", tags=["inventory", "stock-optimization"])

# Service will be initialized from app.state


@router.post("/summary")
async def get_dashboard_summary(filters: StockOptimizationFilters, request: Request):
    """Main dashboard endpoint - returns all stock optimization metrics

    Returns:
        Complete dashboard summary with KPIs, recommendations, metrics, and insights
    """
    try:
        # Use cached service from app state
        service = request.app.state.stock_optimization_service

        # Convert Pydantic model to dict
        filter_dict = {}

        # Handle date range
        if filters.dateRange:
            filter_dict['dateFrom'] = filters.dateRange.get('startDate')
            filter_dict['dateTo'] = filters.dateRange.get('endDate')

        # Handle arrays - pass full arrays to filter engine
        if filters.warehouse and len(filters.warehouse) > 0:
            filter_dict['warehouse'] = filters.warehouse

        if filters.category and len(filters.category) > 0:
            filter_dict['category'] = filters.category

        if filters.supplier and len(filters.supplier) > 0:
            filter_dict['supplier'] = filters.supplier

        if filters.optimizationLevel:
            filter_dict['optimizationLevel'] = filters.optimizationLevel

        result = await service.get_dashboard_summary(filter_dict)
        return result

    except Exception as e:
        import traceback
        print(f"[StockOptimizationRouter] Error in dashboard_summary: {e}")
        print(f"[StockOptimizationRouter] Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations")
async def get_recommendations(filters: StockOptimizationFilters, request: Request):
    """Get stock optimization recommendations

    Returns:
        List of items with optimization recommendations
    """
    try:
        service = request.app.state.stock_optimization_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result.get('recommendations', [])

    except Exception as e:
        print(f"[StockOptimizationRouter] Error in recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")


@router.post("/metrics")
async def get_optimization_metrics(filters: StockOptimizationFilters, request: Request):
    """Get optimization performance metrics

    Returns:
        Before/after optimization metrics comparison
    """
    try:
        service = request.app.state.stock_optimization_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result.get('metrics', [])

    except Exception as e:
        print(f"[StockOptimizationRouter] Error in metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch metrics")


@router.post("/reorder-analysis")
async def get_reorder_analysis(filters: StockOptimizationFilters, request: Request):
    """Get reorder point analysis for top items

    Returns:
        Reorder analysis with lead time and demand metrics
    """
    try:
        service = request.app.state.stock_optimization_service
        filter_dict = filters.dict(exclude_none=True)

        result = await service.get_dashboard_summary(filter_dict)
        return result.get('reorderAnalysis', [])

    except Exception as e:
        print(f"[StockOptimizationRouter] Error in reorder_analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch reorder analysis")
