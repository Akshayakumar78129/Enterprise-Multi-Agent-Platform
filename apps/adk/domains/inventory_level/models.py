"""Models for inventory level analysis"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class InventoryKPI(BaseModel):
    """Inventory KPI metrics"""
    totalInventoryValue: float = Field(default=0, description="Total inventory value")
    stockTurnover: float = Field(default=0, description="Stock turnover rate")
    stockoutRisk: float = Field(default=0, description="Stockout risk percentage")
    averageDaysOnHand: float = Field(default=0, description="Average days on hand")
    inventoryAccuracy: float = Field(default=0, description="Inventory accuracy percentage")
    excessStock: float = Field(default=0, description="Excess stock value")


class StockLevel(BaseModel):
    """Stock level information"""
    itemName: str = Field(description="Item name")
    category: str = Field(description="Item category")
    currentStock: int = Field(default=0, description="Current stock quantity")
    minimumStock: int = Field(default=0, description="Minimum stock level")
    maximumStock: int = Field(default=0, description="Maximum stock level")
    stockValue: float = Field(default=0, description="Stock value")
    status: str = Field(default="normal", description="Stock status")
    daysOnHand: float = Field(default=0, description="Days on hand")


class InventoryMovement(BaseModel):
    """Inventory movement data"""
    period: str = Field(description="Time period")
    inbound: int = Field(default=0, description="Inbound quantity")
    outbound: int = Field(default=0, description="Outbound quantity")
    netMovement: int = Field(default=0, description="Net movement")
    turnoverRate: float = Field(default=0, description="Turnover rate")


class InventoryLevelResponse(BaseModel):
    """Complete inventory level response"""
    kpis: InventoryKPI
    stockLevels: List[StockLevel] = Field(default_factory=list)
    movements: List[InventoryMovement] = Field(default_factory=list)
    alerts: List[str] = Field(default_factory=list)
    insights: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class InventoryFilters(BaseModel):
    """Inventory level filters"""
    dateRange: Optional[Dict[str, str]] = None
    warehouse: Optional[List[str]] = None
    category: Optional[List[str]] = None
    supplier: Optional[List[str]] = None
    status: Optional[List[str]] = None
