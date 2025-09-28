"""Models for sales performance analysis"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SalesKPI(BaseModel):
    """Sales KPI metrics"""
    totalRevenue: float = Field(default=0, description="Total revenue")
    totalUnits: int = Field(default=0, description="Total units sold")
    avgOrderValue: float = Field(default=0, description="Average order value")
    uniqueCustomers: int = Field(default=0, description="Unique customers")
    revenueGrowth: float = Field(default=0, description="Revenue growth percentage")
    conversionRate: float = Field(default=0, description="Sales conversion rate")


class ProductPerformance(BaseModel):
    """Product performance metrics"""
    productName: str = Field(description="Product name")
    category: Optional[str] = Field(default="Unknown", description="Product category")
    revenue: float = Field(default=0, description="Product revenue")
    unitsSold: int = Field(default=0, description="Units sold")
    avgPrice: float = Field(default=0, description="Average price")
    marketShare: float = Field(default=0, description="Market share percentage")


class RegionPerformance(BaseModel):
    """Regional sales performance"""
    regionName: str = Field(description="Region name")
    customerCount: int = Field(default=0, description="Customer count")
    revenue: float = Field(default=0, description="Region revenue")
    units: int = Field(default=0, description="Units sold")
    avgTransactionValue: float = Field(default=0, description="Average transaction value")
    growthRate: float = Field(default=0, description="Growth rate")


class SalesTrend(BaseModel):
    """Sales trend data point"""
    date: str = Field(description="Date")
    revenue: float = Field(default=0, description="Daily revenue")
    units: int = Field(default=0, description="Daily units")
    customers: int = Field(default=0, description="Daily customers")
    transactions: int = Field(default=0, description="Transaction count")


class CategoryPerformance(BaseModel):
    """Category performance metrics"""
    category: str = Field(default="Unknown", description="Category name")
    productCount: int = Field(default=0, description="Product count")
    revenue: float = Field(default=0, description="Category revenue")
    units: int = Field(default=0, description="Units sold")
    avgPrice: float = Field(default=0, description="Average price")


class TopCustomer(BaseModel):
    """Top customer metrics"""
    customerName: str = Field(description="Customer name")
    segment: str = Field(default="Unknown", description="Customer segment")
    purchaseDays: int = Field(default=0, description="Purchase days")
    totalRevenue: float = Field(default=0, description="Total revenue")
    totalUnits: int = Field(default=0, description="Total units")
    avgOrderValue: float = Field(default=0, description="Average order value")


class SalesPerformanceResponse(BaseModel):
    """Complete sales performance response"""
    kpis: SalesKPI
    productPerformance: List[ProductPerformance] = Field(default_factory=list)
    regionPerformance: List[RegionPerformance] = Field(default_factory=list)
    salesTrends: List[SalesTrend] = Field(default_factory=list)
    categoryPerformance: List[CategoryPerformance] = Field(default_factory=list)
    topCustomers: List[TopCustomer] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class SalesFilters(BaseModel):
    """Sales dashboard filters"""
    dateRange: Optional[Dict[str, str]] = None
    region: Optional[List[str]] = None
    category: Optional[List[str]] = None
    product: Optional[List[str]] = None
    customer: Optional[List[str]] = None
    segment: Optional[List[str]] = None