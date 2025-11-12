"""Pydantic models for customer insights domain"""

from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class CustomerInsightsFilters(BaseModel):
    """Filters for customer insights queries"""
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    segment: Optional[str] = None
    customerId: Optional[int] = None

class KPIMetric(BaseModel):
    """Single KPI metric"""
    totalCustomers: int = 0
    averageEngagement: float = 0
    topPerformers: int = 0
    insightAccuracy: str = "0%"

class EngagementOverview(BaseModel):
    """Customer engagement overview"""
    high: int = 0
    medium: int = 0
    low: int = 0
    veryLow: int = 0

class CustomerProfile(BaseModel):
    """Customer segment profile"""
    segment: str
    count: int
    value: str

class BehaviorInsight(BaseModel):
    """Behavior insight model"""
    trends: List[str] = []
    patterns: List[str] = []

class InsightsSummaryResponse(BaseModel):
    """Main response for insights dashboard"""
    kpiMetrics: KPIMetric
    mainData: Dict[str, Any]