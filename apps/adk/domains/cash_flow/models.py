"""Models for cash flow analysis"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class FCFYieldMetric(BaseModel):
    """FCF Yield metric with target and status"""
    value: float = Field(default=0, description="FCF yield percentage")
    target: float = Field(default=15.0, description="Target FCF yield (PE standard: 15-20%)")
    status: str = Field(default="poor", description="excellent/good/poor")


class CashROICMetric(BaseModel):
    """Cash ROIC metric with WACC spread"""
    value: float = Field(default=0, description="Cash ROIC percentage")
    wacc: float = Field(default=10.0, description="Weighted Average Cost of Capital")
    spread: float = Field(default=0, description="ROIC - WACC spread")


class CashConversionQualityMetric(BaseModel):
    """Cash conversion quality metric"""
    score: float = Field(default=0, description="Quality score 0-100")
    quality: str = Field(default="low", description="low/medium/high")


class LiquidityCoverageMetric(BaseModel):
    """Liquidity coverage ratio metric"""
    ratio: float = Field(default=0, description="Liquidity coverage ratio")
    threshold: float = Field(default=2.0, description="Covenant threshold")
    status: str = Field(default="weak", description="strong/adequate/weak")


class MAFirepowerMetric(BaseModel):
    """M&A acquisition capacity metric"""
    amount: float = Field(default=0, description="Acquisition capacity in dollars")
    capacity: str = Field(default="limited", description="high/medium/limited")


class CashFlowKPI(BaseModel):
    """Cash Flow KPI metrics"""
    # Existing 6 basic metrics
    netCashFlow: float = Field(default=0, description="Net cash flow")
    operatingCashFlow: float = Field(default=0, description="Operating cash flow")
    investingCashFlow: float = Field(default=0, description="Investing cash flow")
    financingCashFlow: float = Field(default=0, description="Financing cash flow")
    cashRatio: float = Field(default=0, description="Cash ratio")
    freeCashFlow: float = Field(default=0, description="Free cash flow")
    # New 5 strategic metrics
    fcfYield: Optional[FCFYieldMetric] = Field(default=None, description="FCF yield metric")
    cashROIC: Optional[CashROICMetric] = Field(default=None, description="Cash ROIC metric")
    cashConversionQuality: Optional[CashConversionQualityMetric] = Field(default=None, description="Cash conversion quality")
    liquidityCoverage: Optional[LiquidityCoverageMetric] = Field(default=None, description="Liquidity coverage ratio")
    maFirepower: Optional[MAFirepowerMetric] = Field(default=None, description="M&A firepower")


class CashFlowTrend(BaseModel):
    """Cash flow trend data point"""
    date: str = Field(description="Date")
    operating: float = Field(default=0, description="Operating cash flow")
    investing: float = Field(default=0, description="Investing cash flow")
    financing: float = Field(default=0, description="Financing cash flow")
    net: float = Field(default=0, description="Net cash flow")


class OperatingCashFlowDetail(BaseModel):
    """Operating cash flow breakdown"""
    category: str = Field(description="Category name")
    inflow: float = Field(default=0, description="Cash inflow")
    outflow: float = Field(default=0, description="Cash outflow")
    net: float = Field(default=0, description="Net cash flow")


class InvestingCashFlowDetail(BaseModel):
    """Investing cash flow breakdown"""
    category: str = Field(description="Investment category")
    amount: float = Field(default=0, description="Investment amount")
    type: str = Field(default="outflow", description="Flow type: inflow or outflow")


class FinancingCashFlowDetail(BaseModel):
    """Financing cash flow breakdown"""
    category: str = Field(description="Financing category")
    amount: float = Field(default=0, description="Financing amount")
    type: str = Field(default="inflow", description="Flow type: inflow or outflow")


class CashFlowProjection(BaseModel):
    """Cash flow projection data point"""
    month: str = Field(description="Month")
    historical: Optional[float] = Field(default=None, description="Historical cash flow")
    projected: Optional[float] = Field(default=None, description="Projected cash flow")
    optimistic: Optional[float] = Field(default=None, description="Optimistic scenario")
    pessimistic: Optional[float] = Field(default=None, description="Pessimistic scenario")


class CashFlowTransaction(BaseModel):
    """Individual cash flow transaction"""
    date: str = Field(description="Transaction date")
    category: str = Field(description="Category")
    description: str = Field(description="Description")
    amount: float = Field(default=0, description="Amount")
    type: str = Field(description="Cash flow type: operating, investing, financing")
    flowDirection: str = Field(description="Flow direction: inflow or outflow")


class CashFlowResponse(BaseModel):
    """Complete cash flow response"""
    kpiMetrics: CashFlowKPI
    mainData: Dict[str, Any] = Field(default_factory=dict)
    insights: List[Dict[str, str]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CashFlowFilters(BaseModel):
    """Cash flow dashboard filters"""
    dateRange: Optional[Dict[str, str]] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    cashFlowType: Optional[str] = None  # operating, investing, financing, all
    departments: Optional[List[str]] = None
    regions: Optional[List[str]] = None
    minAmount: Optional[float] = None


class FCFBridgeComponent(BaseModel):
    """Free Cash Flow bridge component for waterfall chart"""
    component: str = Field(description="Component name (EBITDA, Working Capital, CapEx, etc.)")
    value: float = Field(default=0, description="Component value")
    impact_type: str = Field(default="baseline", description="baseline/increase/reduction")
    sequence_order: int = Field(description="Display order in waterfall")


class LiquidityTimelinePoint(BaseModel):
    """Liquidity timeline data point"""
    date: str = Field(description="Date")
    cash_balance: float = Field(default=0, description="Cash balance")
    liquidity_status: str = Field(default="healthy", description="critical/warning/healthy")
    threshold_min: Optional[float] = Field(default=None, description="Minimum cash threshold")
    threshold_target: Optional[float] = Field(default=None, description="Target cash level")


class CapitalAllocationItem(BaseModel):
    """Capital allocation breakdown item"""
    category: str = Field(description="Allocation category")
    amount: float = Field(default=0, description="Allocated amount")
    percentage: float = Field(default=0, description="Percentage of total")
    allocation_type: str = Field(default="other", description="growth/operations/returns/other")
