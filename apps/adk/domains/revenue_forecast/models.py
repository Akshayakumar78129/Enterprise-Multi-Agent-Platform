"""Pydantic models for Revenue Forecast"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date
from enum import Enum


class TrendDirection(str, Enum):
    """Trend direction indicators"""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class KPIStatus(str, Enum):
    """KPI status indicators"""
    GOOD = "good"
    WARNING = "warning"
    CRITICAL = "critical"


class RevenueForecastFilters(BaseModel):
    """Filters for revenue forecast analysis"""
    dateFrom: Optional[str] = "2017-01-01"
    dateTo: Optional[str] = "2021-12-31"
    companyCode: Optional[str] = "all"
    segments: List[str] = Field(default_factory=list)
    products: List[str] = Field(default_factory=list)
    regions: List[str] = Field(default_factory=list)
    customerTypes: List[str] = Field(default_factory=list)
    forecastHorizon: int = Field(default=12, description="Months to forecast ahead")
    confidenceLevel: float = Field(default=80.0, description="Confidence level for predictions")
    scenario: str = Field(default="base", description="Scenario type: base, optimistic, pessimistic")


class KPIMetric(BaseModel):
    """KPI metric with trend and status"""
    value: float
    change: float = Field(..., description="Change vs previous period")
    trend: TrendDirection
    benchmark: Optional[float] = None
    status: KPIStatus
    formatted_value: Optional[str] = None


class GrowthComponent(BaseModel):
    """Revenue growth decomposition component"""
    component_name: str
    value: float
    percentage: float
    category: str  # 'organic', 'inorganic', 'negative'


class CohortMetric(BaseModel):
    """Cohort retention metric"""
    cohort_month: str
    month_number: int
    retained_revenue: float
    retention_rate: float
    expansion_rate: float
    churn_rate: float


class MarketMetric(BaseModel):
    """Market size and share metric"""
    tam: float = Field(..., description="Total Addressable Market")
    sam: float = Field(..., description="Serviceable Addressable Market")
    som: float = Field(..., description="Serviceable Obtainable Market")
    current_share: float
    target_share: float
    growth_rate: float


class CustomerEconomics(BaseModel):
    """Customer acquisition and lifetime value metrics"""
    cac: float = Field(..., description="Customer Acquisition Cost")
    ltv: float = Field(..., description="Lifetime Value")
    ltv_cac_ratio: float
    payback_period_months: float
    gross_margin: float
    magic_number: float


class PricingScenario(BaseModel):
    """Pricing elasticity scenario"""
    price_change_pct: float
    volume_impact_pct: float
    revenue_impact: float
    margin_impact: float
    optimal_price: float


class SegmentForecast(BaseModel):
    """Revenue forecast by segment"""
    segment_name: str
    current_revenue: float
    forecasted_revenue: float
    growth_rate: float
    confidence_lower: float
    confidence_upper: float
    market_share: float


class ModelPerformance(BaseModel):
    """Forecast model performance metrics"""
    model_name: str
    mape: float = Field(..., description="Mean Absolute Percentage Error")
    rmse: float = Field(..., description="Root Mean Squared Error")
    mae: float = Field(..., description="Mean Absolute Error")
    accuracy: float
    last_updated: str


class RevenueForecastSummaryResponse(BaseModel):
    """Main response for revenue forecast summary endpoint"""
    kpiMetrics: Dict[str, KPIMetric] = Field(..., description="5 KPI tiles data")
    mainData: Dict[str, Any] = Field(..., description="Main visualization data")
    insights: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(..., description="Metadata about the response")
