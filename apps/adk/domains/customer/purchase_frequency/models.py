"""Pydantic models for Purchase Frequency dashboard"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class PurchaseFrequencyFilters(BaseModel):
    """Filter model matching frontend format"""
    dateFrom: Optional[str] = Field(None, description="Start date filter")
    dateTo: Optional[str] = Field(None, description="End date filter")
    customerSegments: Optional[List[str]] = Field(default_factory=list, description="Customer segments filter")
    productCategories: Optional[List[str]] = Field(default_factory=list, description="Product categories filter")
    frequencyRange: Optional[str] = Field(None, description="Frequency range filter (high/medium/low)")
    timeRange: Optional[str] = Field(None, description="Time range (30d, 90d, 1y)")
    search: Optional[str] = Field(None, description="Search term")


class CustomerFrequency(BaseModel):
    """Customer purchase frequency model"""
    customer_id: str
    customer_name: str
    purchase_count: int
    avg_days_between_purchases: float
    last_purchase_date: Optional[str]
    first_purchase_date: Optional[str]
    total_spent: float
    avg_order_value: float
    frequency_segment: str  # High, Medium, Low
    recency_days: int
    loyalty_status: Optional[str]


class FrequencyBin(BaseModel):
    """Frequency distribution bin model"""
    bin_range: str  # "1-2", "3-5", "6-10", etc.
    customer_count: int
    percentage: float
    total_revenue: float


class CustomerSegmentData(BaseModel):
    """RFM-style customer segmentation data"""
    segment: str  # High Value/High Frequency, etc.
    customer_count: int
    avg_purchase_frequency: float
    avg_customer_value: float
    total_revenue: float


class PurchaseInterval(BaseModel):
    """Purchase interval distribution model"""
    interval_days: int
    customer_count: int
    percentage: float


class LifecycleStage(BaseModel):
    """Customer lifecycle stage model"""
    stage: str  # New, Active, At Risk, Dormant
    customer_count: int
    avg_frequency: float
    total_revenue: float


class KPIMetrics(BaseModel):
    """KPI metrics model"""
    total_customers: int
    avg_purchase_frequency: float
    high_frequency_customers: int
    medium_frequency_customers: int
    low_frequency_customers: int
    avg_days_between_purchases: float
    total_revenue: float


class PurchaseFrequencySummaryResponse(BaseModel):
    """Dashboard summary response model"""
    kpiMetrics: KPIMetrics
    frequencyDistribution: List[FrequencyBin]
    customerSegmentation: List[CustomerSegmentData]
    purchaseIntervals: List[PurchaseInterval]
    lifecycleStages: List[LifecycleStage]
    customerDetails: List[CustomerFrequency]
    insights: Optional[List[str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
