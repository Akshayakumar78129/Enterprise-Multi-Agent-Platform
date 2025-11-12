"""Pydantic models for churn prediction API"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChurnFilters(BaseModel):
    """Filter model matching Express/frontend format"""
    dateFrom: Optional[str] = Field(None, description="Start date filter")
    dateTo: Optional[str] = Field(None, description="End date filter")
    riskLevel: Optional[str] = Field(None, description="Risk level filter")
    segment: Optional[str] = Field(None, description="Customer segment filter")
    timeRange: Optional[str] = Field(None, description="Time range (30d, 90d)")
    search: Optional[str] = Field(None, description="Search term")
    riskLevels: Optional[List[str]] = Field(default_factory=list, description="Multiple risk levels")
    segments: Optional[List[str]] = Field(default_factory=list, description="Multiple segments")
    productCategories: Optional[List[str]] = Field(default_factory=list, description="Product categories filter")


class CustomerStat(BaseModel):
    """Customer statistics model"""
    customer_id: str
    customer_name: Optional[str]
    last_purchase_date: Optional[str]
    frequency: int
    avg_order_value: float
    rfm_score: Optional[float]
    loyalty_status: Optional[str]
    lifetime_sales: Optional[float]


class SegmentRisk(BaseModel):
    """Segment risk distribution model"""
    segment: str
    low: int
    medium: int
    high: int
    very_high: int


class MonthlyRisk(BaseModel):
    """Monthly risk trend model"""
    month: str
    total_customers: int
    low_risk: int
    medium_risk: int
    high_risk: int
    very_high_risk: int


class ProbabilityBin(BaseModel):
    """Probability distribution bin model"""
    range: str
    count: int


class FeatureImportance(BaseModel):
    """Feature importance model"""
    name: str
    importance: float
    impact: float
    icon: str
    color: str


class ChurnSummaryResponse(BaseModel):
    """Dashboard summary response model"""
    customerStats: List[Dict[str, Any]]
    segmentRisk: List[SegmentRisk]
    monthlyRisk: List[MonthlyRisk]
    probabilityDistribution: List[ProbabilityBin]
    featureImportance: List[FeatureImportance]


class Customer(BaseModel):
    """Customer model for list endpoint"""
    id: str
    name: str
    customerId: int
    clv: float
    riskLevel: str
    riskPercentage: int