"""Pydantic models for anomaly detection API"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class AnomalyFilters(BaseModel):
    """Filter model matching Express/frontend format"""
    dateFrom: Optional[str] = Field(None, description="Start date filter")
    dateTo: Optional[str] = Field(None, description="End date filter")
    severityLevel: Optional[int] = Field(None, description="Severity level filter (1-5)")
    segment: Optional[str] = Field(None, description="Customer segment filter")
    region: Optional[str] = Field(None, description="Region filter")
    timeRange: Optional[str] = Field(None, description="Time range (7d, 30d, 90d)")
    search: Optional[str] = Field(None, description="Search term")
    severityLevels: Optional[List[int]] = Field(default_factory=list, description="Multiple severity levels")
    segments: Optional[List[str]] = Field(default_factory=list, description="Multiple segments")
    regions: Optional[List[str]] = Field(default_factory=list, description="Multiple regions")
    contamination: Optional[float] = Field(0.1, description="Expected anomaly rate (0-1)")


class CustomerAnomaly(BaseModel):
    """Customer anomaly detection model"""
    customer_id: str
    customer_name: Optional[str]
    segment: Optional[str]
    region: Optional[str]
    is_anomaly: bool
    anomaly_score: float
    severity_level: int
    transaction_count: int
    avg_transaction_value: float
    days_since_last_txn: Optional[int]
    anomalous_features: Optional[List[Dict[str, Any]]]


class SegmentDistribution(BaseModel):
    """Segment anomaly distribution model"""
    segment: str
    total_customers: int
    anomaly_count: int
    anomaly_rate: float
    severity_distribution: Dict[str, int]


class RegionDistribution(BaseModel):
    """Region anomaly distribution model"""
    region: str
    total_customers: int
    anomaly_count: int
    anomaly_rate: float


class SeverityDistribution(BaseModel):
    """Severity level distribution model"""
    severity_level: int
    label: str
    count: int
    percentage: float


class FeatureImportance(BaseModel):
    """Feature importance for anomaly detection model"""
    feature: str
    name: str
    importance: float
    description: Optional[str]


class TimeSeriesAnomaly(BaseModel):
    """Time series anomaly model"""
    date: str
    normal_count: int
    anomaly_count: int
    total_count: int
    anomaly_rate: float
    avg_severity: float


class AnomalySummaryResponse(BaseModel):
    """Dashboard summary response model"""
    customerAnomalies: List[CustomerAnomaly]
    segmentDistribution: List[SegmentDistribution]
    regionDistribution: List[RegionDistribution]
    severityDistribution: List[SeverityDistribution]
    featureImportance: List[FeatureImportance]
    timeSeriesAnomalies: List[TimeSeriesAnomaly]