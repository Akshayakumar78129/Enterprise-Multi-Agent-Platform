"""Pydantic models for holding cost analysis API"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class HoldingCostFilters(BaseModel):
    """Filter model for holding cost analysis"""
    dateFrom: Optional[str] = Field(None, description="Start date filter (default: 2017-01-01)")
    dateTo: Optional[str] = Field(None, description="End date filter (default: 2021-12-31)")
    category: Optional[str] = Field(None, description="Single product category filter")
    categories: Optional[List[str]] = Field(default_factory=list, description="Multiple categories filter")
    warehouseId: Optional[str] = Field(None, description="Single warehouse ID filter")
    warehouseIds: Optional[List[str]] = Field(default_factory=list, description="Multiple warehouse IDs")
    minHoldingCost: Optional[float] = Field(None, description="Minimum holding cost threshold")
    maxHoldingCost: Optional[float] = Field(None, description="Maximum holding cost threshold")
    excessiveOnly: Optional[bool] = Field(False, description="Show only items with excessive holding costs (>30%)")
    search: Optional[str] = Field(None, description="Search by item name or number")
    annualHoldingCostRate: Optional[float] = Field(0.25, description="Annual holding cost percentage (default 25%)")
    opportunityCostRate: Optional[float] = Field(0.08, description="Opportunity cost rate (default 8%)")


class CategoryAnalysis(BaseModel):
    """Category-level holding cost analysis"""
    category: str
    items_count: int
    inventory_value: float
    total_holding_cost: float
    avg_holding_cost_pct: float
    high_cost_items: int
    potential_savings: float


class WarehouseAnalysis(BaseModel):
    """Warehouse-level holding cost analysis"""
    warehouse_id: str
    warehouse_name: str
    warehouse_type: str
    items_count: int
    inventory_value: float
    total_holding_cost: float
    storage_cost: float
    high_cost_items: int
    potential_savings: float


class HighCostItem(BaseModel):
    """High holding cost item details"""
    item_key: int
    item_number: str
    item_name: str
    category: str
    warehouse_name: str
    unit_cost: float
    average_stock_level: float
    inventory_value: float
    total_holding_cost: float
    holding_cost_pct: float
    annual_holding_cost: float
    annual_opportunity_cost: float
    annual_storage_cost: float
    annual_risk_cost: float
    potential_savings: float
    obsolescence_risk: float


class CostBreakdown(BaseModel):
    """Cost breakdown by component"""
    component: str
    amount: float
    percentage: float
    color: str


class HoldingCostKPIMetrics(BaseModel):
    """KPI metrics for dashboard"""
    total_inventory_value: float
    total_annual_holding_cost: float
    avg_holding_cost_pct: float
    total_items_analyzed: int
    excessive_cost_items: int
    potential_annual_savings: float
    total_storage_cost: float
    total_opportunity_cost: float
    total_risk_cost: float


class HoldingCostSummaryResponse(BaseModel):
    """Main dashboard summary response"""
    kpiMetrics: HoldingCostKPIMetrics
    categoryAnalysis: List[CategoryAnalysis]
    warehouseAnalysis: List[WarehouseAnalysis]
    highCostItems: List[HighCostItem]
    costBreakdown: List[CostBreakdown]
    insights: List[str]
    insights_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    metadata: Dict[str, Any]


class ActionPlan(BaseModel):
    """Recommended action plan"""
    immediate: List[str]
    short_term: List[str]
    long_term: List[str]


class HoldingCostDetailResponse(BaseModel):
    """Detailed analysis response with action plan"""
    summary: HoldingCostSummaryResponse
    action_plan: ActionPlan
    recommendations: Dict[str, Any]
