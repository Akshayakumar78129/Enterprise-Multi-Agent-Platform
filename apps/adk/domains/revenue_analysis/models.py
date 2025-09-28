"""Models for revenue analysis"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class RevenueKPI(BaseModel):
    """Revenue KPI metrics"""
    totalRevenue: float = Field(default=0, description="Total revenue")
    grossMargin: float = Field(default=0, description="Gross margin percentage")
    revenueGrowth: float = Field(default=0, description="Revenue growth rate")
    profitability: float = Field(default=0, description="Profitability ratio")
    avgOrderValue: float = Field(default=0, description="Average order value")
    revenuePerCustomer: float = Field(default=0, description="Revenue per customer")


class RevenueBreakdown(BaseModel):
    """Revenue breakdown by category"""
    category: str = Field(description="Category name")
    revenue: float = Field(default=0, description="Category revenue")
    percentage: float = Field(default=0, description="Percentage of total")
    growth: float = Field(default=0, description="Growth rate")
    margin: float = Field(default=0, description="Margin percentage")


class RevenueStream(BaseModel):
    """Revenue stream analysis"""
    stream: str = Field(description="Revenue stream name")
    amount: float = Field(default=0, description="Stream amount")
    contribution: float = Field(default=0, description="Contribution percentage")
    trend: str = Field(default="stable", description="Trend direction")


class RevenueAnalysisResponse(BaseModel):
    """Complete revenue analysis response"""
    kpis: RevenueKPI
    breakdown: List[RevenueBreakdown] = Field(default_factory=list)
    streams: List[RevenueStream] = Field(default_factory=list)
    insights: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class RevenueFilters(BaseModel):
    """Revenue analysis filters"""
    dateRange: Optional[Dict[str, str]] = None
    region: Optional[List[str]] = None
    category: Optional[List[str]] = None
    segment: Optional[List[str]] = None
