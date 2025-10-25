"""Pydantic models for regional sales analyzer"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RegionalFilters(BaseModel):
    """Filters for regional sales analysis"""
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    countries: Optional[List[str]] = []
    states: Optional[List[str]] = []
    aggregation: Optional[str] = 'month'  # day, week, month, quarter


class RegionalKPI(BaseModel):
    """Regional sales KPI metrics"""
    totalSales: float
    netSales: float
    grossProfit: float
    profitMargin: float
    countryCount: int
    stateCount: int
    customerCount: int
    transactionCount: int
    avgTransactionValue: float
    growthRate: Optional[float] = None


class RegionPerformance(BaseModel):
    """Regional performance data"""
    country: str
    state: str
    totalSales: float
    netSales: float
    totalQuantity: float
    grossProfit: float
    profitMargin: float
    customerCount: int
    transactionCount: int
    avgTransactionValue: float
    firstSaleDate: Optional[str] = None
    lastSaleDate: Optional[str] = None


class CountryPerformance(BaseModel):
    """Country-level performance data"""
    country: str
    totalSales: float
    netSales: float
    totalQuantity: float
    grossProfit: float
    profitMargin: float
    customerCount: int
    transactionCount: int
    stateCount: int


class TimeSeries(BaseModel):
    """Time series data"""
    period: str
    country: str
    state: str
    totalSales: float
    netSales: float
    totalQuantity: float
    grossProfit: float
    customerCount: int
    transactionCount: int


class OpportunityRegion(BaseModel):
    """Opportunity analysis for regions"""
    country: str
    state: str
    totalSales: float
    grossProfit: float
    customerCount: int
    transactionCount: int
    avgTransactionValue: float
    opportunityCategory: str  # Star Region, Growth Opportunity, Cash Cow, Focus Area
    salesVsAvg: float
    customersVsAvg: float
    profitMargin: float


class TopRegion(BaseModel):
    """Top performing region"""
    country: str
    state: str
    totalSales: float
    profitMargin: float


class RegionalSalesResponse(BaseModel):
    """Complete regional sales analysis response"""
    kpiMetrics: RegionalKPI
    mainData: dict  # Contains regional performance, country performance, time series, opportunities
    insights: List[dict]
    metadata: dict
