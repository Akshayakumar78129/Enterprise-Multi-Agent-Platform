"""Models for stock optimization analysis"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class OptimizationKPI(BaseModel):
    """Stock optimization KPI metrics"""
    optimizedStockValue: float = Field(default=0, description="Total optimized stock value")
    reorderPoints: int = Field(default=0, description="Number of reorder points")
    safetyStockLevel: float = Field(default=0, description="Safety stock coverage percentage")
    orderFrequency: float = Field(default=0, description="Average order frequency")
    costSavings: float = Field(default=0, description="Projected cost savings")
    serviceLevel: float = Field(default=0, description="Target service level percentage")


class StockRecommendation(BaseModel):
    """Stock optimization recommendation"""
    itemName: str = Field(description="Item name")
    currentLevel: int = Field(default=0, description="Current stock level")
    recommendedLevel: int = Field(default=0, description="Recommended stock level")
    reorderPoint: int = Field(default=0, description="Reorder point")
    safetyStock: int = Field(default=0, description="Safety stock quantity")
    orderQuantity: int = Field(default=0, description="Optimal order quantity")
    savings: float = Field(default=0, description="Potential savings")


class OptimizationMetric(BaseModel):
    """Optimization performance metric"""
    metric: str = Field(description="Metric name")
    current: float = Field(default=0, description="Current value")
    optimized: float = Field(default=0, description="Optimized value")
    improvement: float = Field(default=0, description="Improvement percentage")


class ReorderAnalysis(BaseModel):
    """Reorder point analysis"""
    itemName: str = Field(description="Item name")
    leadTime: int = Field(default=0, description="Lead time in days")
    demandVariability: float = Field(default=0, description="Demand variability")
    serviceLevel: float = Field(default=0, description="Service level target")
    reorderPoint: int = Field(default=0, description="Calculated reorder point")


class StockOptimizationResponse(BaseModel):
    """Complete stock optimization response"""
    kpis: OptimizationKPI
    recommendations: List[StockRecommendation] = Field(default_factory=list)
    metrics: List[OptimizationMetric] = Field(default_factory=list)
    reorderAnalysis: List[ReorderAnalysis] = Field(default_factory=list)
    insights: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class StockOptimizationFilters(BaseModel):
    """Stock optimization filters"""
    dateRange: Optional[Dict[str, str]] = None
    warehouse: Optional[List[str]] = None
    category: Optional[List[str]] = None
    supplier: Optional[List[str]] = None
    optimizationLevel: Optional[str] = None