"""Pydantic models for sales trends analysis"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


class SalesTrendKPI(BaseModel):
    """KPI metrics for sales trends dashboard"""
    totalRevenue: float = Field(..., description="Total revenue for the period")
    totalUnits: float = Field(..., description="Total units sold")
    avgOrderValue: float = Field(..., description="Average order value")
    marginPercentage: float = Field(..., description="Profit margin percentage")
    revenueGrowth: Optional[float] = Field(0.0, description="Revenue growth rate vs previous period")
    transactionCount: Optional[int] = Field(0, description="Total number of transactions")


class TimeSeriesDataPoint(BaseModel):
    """Single data point in time series"""
    period: str = Field(..., description="Time period (e.g., 2020-01, 2020-W15)")
    revenue: float = Field(..., description="Revenue for this period")
    units: float = Field(..., description="Units sold in this period")
    orders: Optional[int] = Field(0, description="Number of orders")
    avgOrderValue: Optional[float] = Field(0.0, description="Average order value")
    growthRate: Optional[float] = Field(None, description="Growth rate vs previous period")
    movingAverage: Optional[float] = Field(None, description="Moving average")


class SeasonalityDataPoint(BaseModel):
    """Seasonality analysis data point"""
    year: str = Field(..., description="Year")
    month: str = Field(..., description="Month (01-12)")
    revenue: float = Field(..., description="Revenue for this month")
    period: Optional[str] = Field(None, description="Formatted period label")


class GrowthRateDataPoint(BaseModel):
    """Growth rate analysis data point"""
    period: str = Field(..., description="Time period")
    revenue: float = Field(..., description="Revenue for this period")
    growthRate: float = Field(..., description="Period-over-period growth rate %")
    avgGrowthRate: Optional[float] = Field(None, description="Average growth rate")
    minGrowthRate: Optional[float] = Field(None, description="Minimum growth rate in dataset")
    maxGrowthRate: Optional[float] = Field(None, description="Maximum growth rate in dataset")


class TopPerformerDataPoint(BaseModel):
    """Top performer by dimension"""
    name: str = Field(..., description="Name of the entity (product, region, etc.)")
    revenue: float = Field(..., description="Total revenue")
    units: float = Field(..., description="Total units")
    orders: int = Field(..., description="Number of orders")
    marketShare: float = Field(..., description="Market share percentage")
    growthRate: Optional[float] = Field(0.0, description="Growth rate")


class SalesTrendInsight(BaseModel):
    """AI-generated insight"""
    type: str = Field(..., description="Insight type: positive, warning, info, critical")
    message: str = Field(..., description="Insight message")
    priority: Optional[str] = Field("INFO", description="Priority level")


class SalesTrendMainData(BaseModel):
    """Main data container for all visualizations"""
    timeSeries: List[TimeSeriesDataPoint] = Field(default_factory=list)
    seasonality: List[SeasonalityDataPoint] = Field(default_factory=list)
    growthRates: List[GrowthRateDataPoint] = Field(default_factory=list)
    topPerformers: List[TopPerformerDataPoint] = Field(default_factory=list)


class SalesTrendMetadata(BaseModel):
    """Metadata about the request and response"""
    filtersApplied: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    recordCount: Optional[int] = Field(None)
    dateRange: Optional[Dict[str, str]] = Field(None)


class SalesTrendResponse(BaseModel):
    """Complete sales trend dashboard response"""
    kpiMetrics: SalesTrendKPI
    mainData: SalesTrendMainData
    insights: List[SalesTrendInsight] = Field(default_factory=list)
    metadata: SalesTrendMetadata


class SalesTrendFilters(BaseModel):
    """Filters for sales trend analysis"""
    dateFrom: Optional[str] = Field("2017-01-01", description="Start date (YYYY-MM-DD)")
    dateTo: Optional[str] = Field("2021-12-31", description="End date (YYYY-MM-DD)")
    granularity: Optional[str] = Field("monthly", description="Time granularity: daily, weekly, monthly, quarterly, annual")
    metric: Optional[str] = Field("revenue", description="Primary metric: revenue, units, aov, margin")
    dimension: Optional[str] = Field(None, description="Dimension for top performers: product, category, region, customer")
    topN: Optional[int] = Field(10, description="Number of top performers to return")
    customerCategory: Optional[List[str]] = Field(None, description="Customer category filter")
    customerRegion: Optional[List[str]] = Field(None, description="Customer region filter")
    itemName: Optional[List[str]] = Field(None, description="Item name filter")
