"""Models for warehouse analytics"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class WarehouseKPI(BaseModel):
    """Warehouse KPI metrics"""
    warehouseUtilization: float = Field(default=0, description="Warehouse space utilization percentage")
    pickingEfficiency: float = Field(default=0, description="Picking efficiency rate")
    storageCapacity: float = Field(default=0, description="Available storage capacity")
    throughput: float = Field(default=0, description="Daily throughput volume")
    orderAccuracy: float = Field(default=0, description="Order accuracy rate")
    laborProductivity: float = Field(default=0, description="Labor productivity index")


class WarehouseMetric(BaseModel):
    """Warehouse performance metric"""
    warehouseName: str = Field(default="Main", description="Warehouse name")
    zone: str = Field(default="General", description="Warehouse zone")
    utilization: float = Field(default=0, description="Space utilization percentage")
    itemCount: int = Field(default=0, description="Number of items stored")
    movements: int = Field(default=0, description="Daily movements")
    efficiency: float = Field(default=0, description="Operational efficiency")


class StorageAnalysis(BaseModel):
    """Storage utilization analysis"""
    zone: str = Field(description="Storage zone")
    capacity: int = Field(default=0, description="Total capacity")
    used: int = Field(default=0, description="Used capacity")
    available: int = Field(default=0, description="Available capacity")
    utilizationRate: float = Field(default=0, description="Utilization rate")


class OperationalData(BaseModel):
    """Warehouse operational data"""
    period: str = Field(description="Time period")
    inboundVolume: int = Field(default=0, description="Inbound volume")
    outboundVolume: int = Field(default=0, description="Outbound volume")
    pickingOrders: int = Field(default=0, description="Picking orders")
    packingOrders: int = Field(default=0, description="Packing orders")
    shippedOrders: int = Field(default=0, description="Shipped orders")


class WarehouseAnalyticsResponse(BaseModel):
    """Complete warehouse analytics response"""
    kpis: WarehouseKPI
    metrics: List[WarehouseMetric] = Field(default_factory=list)
    storageAnalysis: List[StorageAnalysis] = Field(default_factory=list)
    operationalData: List[OperationalData] = Field(default_factory=list)
    insights: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class WarehouseFilters(BaseModel):
    """Warehouse analytics filters"""
    dateRange: Optional[Dict[str, str]] = None
    warehouse: Optional[List[str]] = None
    zone: Optional[List[str]] = None
    itemCategory: Optional[List[str]] = None