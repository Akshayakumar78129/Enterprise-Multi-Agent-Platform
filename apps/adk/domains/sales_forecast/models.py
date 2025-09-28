"""Models for sales forecast analysis"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ForecastKPI(BaseModel):
    """Sales forecast KPI metrics"""
    currentRevenue: float = Field(default=0, description="Current period revenue")
    forecastRevenue: float = Field(default=0, description="Forecasted revenue")
    growthRate: float = Field(default=0, description="Predicted growth rate")
    confidence: float = Field(default=0, description="Forecast confidence level")
    accuracy: float = Field(default=0, description="Model accuracy percentage")
    variance: float = Field(default=0, description="Forecast variance")


class ForecastData(BaseModel):
    """Individual forecast data point"""
    date: str = Field(description="Forecast date")
    revenue: float = Field(default=0, description="Predicted revenue")
    quantity: int = Field(default=0, description="Predicted quantity")
    lowerBound: float = Field(default=0, description="Lower confidence bound")
    upperBound: float = Field(default=0, description="Upper confidence bound")
    confidence: float = Field(default=0, description="Confidence level")


class SeasonalPattern(BaseModel):
    """Seasonal pattern data"""
    period: str = Field(description="Period (month, quarter, etc.)")
    avgRevenue: float = Field(default=0, description="Average revenue for period")
    growthRate: float = Field(default=0, description="Period growth rate")
    volatility: float = Field(default=0, description="Period volatility")


class ForecastModel(BaseModel):
    """Forecast model information"""
    modelType: str = Field(description="Type of forecasting model")
    accuracy: float = Field(default=0, description="Model accuracy")
    mape: float = Field(default=0, description="Mean Absolute Percentage Error")
    rmse: float = Field(default=0, description="Root Mean Square Error")
    features: List[str] = Field(default_factory=list, description="Model features")
    importance: Dict[str, float] = Field(default_factory=dict, description="Feature importance")


class ForecastScenario(BaseModel):
    """Forecast scenario analysis"""
    scenario: str = Field(description="Scenario name (optimistic, pessimistic, realistic)")
    revenue: float = Field(default=0, description="Scenario revenue")
    probability: float = Field(default=0, description="Scenario probability")
    assumptions: List[str] = Field(default_factory=list, description="Scenario assumptions")


class SalesForecastResponse(BaseModel):
    """Complete sales forecast response"""
    kpis: ForecastKPI
    forecasts: List[ForecastData] = Field(default_factory=list)
    seasonalPatterns: List[SeasonalPattern] = Field(default_factory=list)
    modelInfo: ForecastModel
    scenarios: List[ForecastScenario] = Field(default_factory=list)
    insights: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class ForecastFilters(BaseModel):
    """Sales forecast dashboard filters"""
    dateRange: Optional[Dict[str, str]] = None
    forecastPeriod: Optional[int] = Field(default=30, description="Days to forecast")
    region: Optional[List[str]] = None
    category: Optional[List[str]] = None
    product: Optional[List[str]] = None
    modelType: Optional[str] = Field(default="auto", description="Forecasting model type")
    confidence: Optional[float] = Field(default=0.95, description="Confidence level")
