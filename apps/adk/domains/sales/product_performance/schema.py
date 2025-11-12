"""Pydantic schema models for product performance"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProductPerformanceFilters(BaseModel):
    """Filters for product performance analysis"""
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    categories: Optional[List[str]] = []
    subcategories: Optional[List[str]] = []
    products: Optional[List[str]] = []
    priceBands: Optional[List[str]] = []
    minMargin: Optional[float] = None
    maxMargin: Optional[float] = None
    minRevenue: Optional[float] = None
    maxRevenue: Optional[float] = None
    topN: Optional[int] = 10


class ProductPerformanceResponse(BaseModel):
    """Response model for product performance analysis"""
    kpiMetrics: Dict[str, Any]
    mainData: Dict[str, Any]
    mlResults: Optional[Dict[str, Any]] = None
    insights: List[str]
    metadata: Dict[str, Any]


class ProductMetrics(BaseModel):
    """Individual product metrics"""
    product_id: str
    product_name: str
    category: str
    subcategory: Optional[str] = None
    revenue: float
    units_sold: int
    avg_price: float
    margin_percent: float
    growth_rate: Optional[float] = None
    market_share: Optional[float] = None
