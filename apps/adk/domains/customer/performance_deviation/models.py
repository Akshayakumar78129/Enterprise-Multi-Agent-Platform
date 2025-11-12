"""Pydantic models for Performance Deviation Analysis"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class PerformanceFilters(BaseModel):
    """Filters for performance deviation queries"""
    dateFrom: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    dateTo: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    timeRange: Optional[str] = Field(None, description="Time range preset (30d, 90d, etc)")
    businessFunctions: Optional[List[str]] = Field(default_factory=list, description="Business functions to include")
    customerIds: Optional[List[str]] = Field(default_factory=list, description="Customer IDs to filter")
    productGroups: Optional[List[str]] = Field(default_factory=list, description="Product groups to filter")
    customerSegments: Optional[List[str]] = Field(default_factory=list, description="Customer segments to filter")
    significanceThreshold: Optional[float] = Field(0.05, description="Statistical significance threshold")
    search: Optional[str] = Field(None, description="Search term")


class KPIMetric(BaseModel):
    """Individual KPI metric"""
    name: str
    value: float
    trend: float
    change_percentage: float
    is_significant: bool = False


class FeatureImportance(BaseModel):
    """Feature importance for a factor"""
    feature: str
    importance: float
    avg_importance: Optional[float] = None


class VarianceComponent(BaseModel):
    """Variance decomposition component"""
    name: str
    share: float


class PerformancePoint(BaseModel):
    """Performance data point"""
    date: str
    actual: float
    predicted: float
    deviation: float
    function: Optional[str] = None


class DeviationPattern(BaseModel):
    """Deviation pattern"""
    date: str
    year: int
    deviation_magnitude: float
    pattern_type: str
    is_significant: bool


class PerformanceSummaryResponse(BaseModel):
    """Main response for performance deviation dashboard"""
    # Core ML outputs
    featureImportance: Dict[str, Any] = Field(default_factory=dict)
    varianceDecomposition: Dict[str, List[VarianceComponent]] = Field(default_factory=dict)
    performanceExplorer: Dict[str, List[PerformancePoint]] = Field(default_factory=dict)

    # Additional frontend data
    kpis: Dict[str, KPIMetric] = Field(default_factory=dict)
    businessFunctionComparison: Dict[str, Any] = Field(default_factory=dict)
    deviationPatterns: Dict[str, Any] = Field(default_factory=dict)
    factorCorrelations: Dict[str, Any] = Field(default_factory=dict)

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)


class KPIData(BaseModel):
    """KPI data structure"""
    date: datetime
    function: str
    metrics: Dict[str, float]