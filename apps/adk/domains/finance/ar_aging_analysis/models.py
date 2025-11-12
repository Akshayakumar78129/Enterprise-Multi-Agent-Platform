"""Pydantic models for AR Aging Analysis"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date
from enum import Enum


class CustomerSegment(str, Enum):
    """Customer segment types for BCG matrix"""
    STRATEGIC_PARTNERS = "Strategic Partners"
    GROWTH_OPPORTUNITIES = "Growth Opportunities"
    EFFICIENCY_TARGETS = "Efficiency Targets"
    VALUE_DESTROYERS = "Value Destroyers"


class KPIStatus(str, Enum):
    """KPI status indicators"""
    GOOD = "good"
    WARNING = "warning"
    CRITICAL = "critical"


class TrendDirection(str, Enum):
    """Trend direction indicators"""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class AgingBucket(BaseModel):
    """Aging bucket with NPV adjustments"""
    range: str = Field(..., description="Aging range (e.g., '0-30 days')")
    amount: float = Field(..., description="Total AR amount in bucket")
    npv_adjusted_amount: float = Field(..., description="NPV-adjusted amount")
    count: int = Field(..., description="Number of invoices")
    percent_of_total: float = Field(..., description="Percentage of total AR")
    value_erosion: float = Field(..., description="Value lost due to aging")
    color: str = Field(..., description="Display color hex code")


class CustomerRisk(BaseModel):
    """Customer risk profile with AR and CLV metrics"""
    customer_id: str
    customer_name: str
    outstanding_amount: float
    days_past_due: float
    risk_score: float
    clv: float = Field(..., description="Customer lifetime value")
    payment_risk_score: float
    profitability: float
    collection_probability: float
    segment: CustomerSegment
    region: Optional[str] = None
    customer_type: Optional[str] = None
    credit_limit: Optional[float] = None
    rfm_score: Optional[float] = None


class KPIMetric(BaseModel):
    """KPI metric with trend and status"""
    value: float
    change: float = Field(..., description="Change vs previous period")
    trend: TrendDirection
    benchmark: Optional[float] = None
    status: KPIStatus
    formatted_value: Optional[str] = None


class CollectionForecast(BaseModel):
    """Collection forecast data point"""
    date: str
    predicted_amount: float
    upper_bound: float
    lower_bound: float
    confidence: float


class ARAgingFilters(BaseModel):
    """Filters for AR aging analysis"""
    dateFrom: Optional[str] = "2017-01-01"
    dateTo: Optional[str] = "2021-12-31"
    customerSegments: List[str] = Field(default_factory=list)
    riskLevels: List[str] = Field(default_factory=list)
    minAmount: Optional[float] = None
    maxAmount: Optional[float] = None
    wacc: float = Field(default=10.0, description="Weighted average cost of capital (%)")
    regions: List[str] = Field(default_factory=list)


class NPVSummary(BaseModel):
    """NPV impact summary"""
    total_value_erosion: float
    daily_erosion_rate: float
    wacc_used: float
    total_ar_book_value: float
    total_ar_npv_adjusted: float


class ARAgingSummaryResponse(BaseModel):
    """Main response for AR aging summary endpoint"""
    kpiMetrics: Dict[str, KPIMetric] = Field(..., description="5 KPI tiles data")
    mainData: Dict[str, Any] = Field(..., description="Main visualization data")
    insights: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(..., description="Metadata about the response")


class ProductPerformanceSchema(BaseModel):
    """Schema configuration for product performance domain"""

    TABLES: Dict[str, str] = {
        'transaction': 'dbo_F_Sales_Transaction',
        'item': '"dbo_D_Item"',
        'customer': 'dbo_D_Customer'
    }

    ALIASES: Dict[str, str] = {
        'transaction': 't',
        'item': 'i',
        'customer': 'c'
    }

    def get_filter_column(self, filter_name: str) -> str:
        """Map filter names to column references"""
        filter_mapping = {
            'dateFrom': 't."Txn Date"',
            'dateTo': 't."Txn Date"',
            'categories': 'i."Item Category Desc"',
            'regions': 'c."Customer State/Prov"',
            'topN': None  # Special handling needed
        }
        return filter_mapping.get(filter_name, '')
