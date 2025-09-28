"""Customer Segmentation Data Models"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class SegmentationFilters(BaseModel):
    """Filters for customer segmentation analysis"""
    date_from: Optional[str] = Field(None, description="Start date for analysis")
    date_to: Optional[str] = Field(None, description="End date for analysis")
    segmentation_method: Optional[str] = Field('rfm', description="Segmentation method: rfm, behavioral, value_based")
    num_segments: Optional[int] = Field(5, description="Number of segments to create")
    customer_types: Optional[List[str]] = Field(None, description="Customer types to include")
    regions: Optional[List[str]] = Field(None, description="Regions to filter")

class SegmentProfile(BaseModel):
    """Profile of a customer segment"""
    segment: str
    avgRecency: float
    avgFrequency: float
    avgMonetary: float
    avgOrderValue: float
    topRegion: str

class SegmentMetric(BaseModel):
    """Metrics for a customer segment"""
    segment: str
    totalRevenue: float
    avgCLV: float
    retentionRate: float
    growthRate: float

class CustomerSegment(BaseModel):
    """Customer belonging to a segment"""
    customerId: str
    customerName: str
    segment: str
    totalSpend: float
    transactionCount: int
    avgOrderValue: float
    recencyDays: int

class SegmentationResponse(BaseModel):
    """Response model for customer segmentation"""
    segments: List[Dict[str, Any]]
    segmentDistribution: List[Dict[str, Any]]
    segmentProfiles: List[SegmentProfile]
    segmentMetrics: List[SegmentMetric]
    migrationMatrix: List[Dict[str, Any]]
    kpiMetrics: Dict[str, Any]
    topCustomersBySegment: List[CustomerSegment]
    insights: List[str]
    metadata: Dict[str, Any]