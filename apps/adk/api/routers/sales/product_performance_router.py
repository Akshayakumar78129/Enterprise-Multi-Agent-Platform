"""FastAPI router for product performance endpoints"""

from fastapi import APIRouter, HTTPException, Request
from typing import Dict
from domains.sales.product_performance.processing_service import ProductPerformanceProcessingService
from domains.sales.product_performance.schema import ProductPerformanceFilters, ProductPerformanceResponse

# Initialize router
router = APIRouter(prefix="/api/product-performance", tags=["product_performance"])


@router.post("/summary", response_model=ProductPerformanceResponse)
async def get_dashboard_summary(filters: ProductPerformanceFilters, request: Request):
    """Main dashboard endpoint - returns all product performance metrics"""
    try:
        # Use cached service from app state
        service = request.app.state.product_performance_service

        # Convert Pydantic model to dict
        filter_dict = {}

        if filters.dateFrom:
            filter_dict['dateFrom'] = filters.dateFrom
        if filters.dateTo:
            filter_dict['dateTo'] = filters.dateTo
        if filters.categories and len(filters.categories) > 0:
            filter_dict['categories'] = filters.categories
        if filters.subcategories and len(filters.subcategories) > 0:
            filter_dict['subcategories'] = filters.subcategories
        if filters.products and len(filters.products) > 0:
            filter_dict['products'] = filters.products
        if filters.priceBands and len(filters.priceBands) > 0:
            filter_dict['priceBands'] = filters.priceBands
        if filters.minMargin is not None:
            filter_dict['minMargin'] = filters.minMargin
        if filters.maxMargin is not None:
            filter_dict['maxMargin'] = filters.maxMargin
        if filters.minRevenue is not None:
            filter_dict['minRevenue'] = filters.minRevenue
        if filters.maxRevenue is not None:
            filter_dict['maxRevenue'] = filters.maxRevenue
        if filters.topN:
            filter_dict['topN'] = filters.topN

        result = await service.get_dashboard_summary(filter_dict)
        return result
    except Exception as e:
        print(f"[ProductPerformanceRouter] Error in dashboard_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "product_performance"}
