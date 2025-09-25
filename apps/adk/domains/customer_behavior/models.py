"""Pydantic models for customer behavior API"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CustomerBehaviorFilters(BaseModel):
    """Filter model for customer behavior analysis"""
    time_period: Optional[str] = Field("quarterly", description="Time period (monthly, quarterly, annual, or YYYY-MM-DD:YYYY-MM-DD)")
    segment_id: Optional[int] = Field(None, description="Customer segment ID")
    behavior_types: Optional[List[str]] = Field(
        default_factory=lambda: ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"],
        description="Types of behavior to analyze"
    )
    min_transactions: Optional[int] = Field(2, description="Minimum transactions required")
    include_visualization: Optional[bool] = Field(False, description="Include visualizations")
    customer_ids: Optional[List[str]] = Field(default_factory=list, description="Specific customer IDs to analyze")
    loyalty_status: Optional[List[str]] = Field(default_factory=list, description="Filter by loyalty status")


class FrequencyDistribution(BaseModel):
    """Purchase frequency distribution model"""
    category: str
    count: int
    percentage: float


class SpendPattern(BaseModel):
    """Customer spending pattern model"""
    avg_order_value: float
    median_order_value: float
    avg_items_per_order: float
    min_order_value: float
    max_order_value: float
    std_order_value: float


class PurchasePattern(BaseModel):
    """Purchase pattern analysis model"""
    frequency_distribution: List[FrequencyDistribution]
    avg_days_between_purchases: float
    spend_patterns: SpendPattern
    total_customers_analyzed: int
    time_period: str


class ProductPreference(BaseModel):
    """Product preference analysis model"""
    category_distribution: Dict[str, float]
    avg_spend_by_category: Dict[str, float]
    top_categories: List[Dict[str, Any]]
    insights: List[str]


class ChannelUsage(BaseModel):
    """Channel usage analysis model"""
    channel_distribution: Dict[str, float]
    avg_spend_by_channel: Dict[str, float]
    channel_trends: Optional[List[Dict[str, Any]]]
    insights: List[str]


class EngagementMetric(BaseModel):
    """Customer engagement metrics model"""
    recency_distribution: Dict[str, float]
    engagement_distribution: Dict[str, float]
    avg_engagement_score: float
    churn_risk_percentage: float
    loyalty_distribution: Optional[Dict[str, float]]


class CustomerSegment(BaseModel):
    """Customer segment analysis model"""
    segment_id: str
    segment_name: str
    customer_count: int
    avg_clv: float
    avg_frequency: float
    avg_recency: float
    avg_monetary: float


class CustomerBehaviorDetail(BaseModel):
    """Individual customer behavior detail"""
    customer_id: str
    customer_name: Optional[str]
    customer_type: Optional[str]
    loyalty_status: Optional[str]
    transaction_count: int
    total_spend: float
    avg_order_value: float
    purchase_frequency: float
    recency_days: int
    preferred_category: Optional[str]
    preferred_channel: Optional[str]
    estimated_clv: Optional[float]
    engagement_score: Optional[float]
    frequency_category: str


class BehaviorTrend(BaseModel):
    """Behavior trend over time model"""
    date: str
    metric_value: float
    metric_name: str
    segment: Optional[str]


class BehaviorSummaryResponse(BaseModel):
    """Complete behavior analysis response model"""
    purchase_patterns: PurchasePattern
    product_preferences: Optional[ProductPreference]
    channel_usage: Optional[ChannelUsage]
    engagement_metrics: Optional[EngagementMetric]
    customer_segments: Optional[List[CustomerSegment]]
    behavior_trends: Optional[List[BehaviorTrend]]
    top_customers: Optional[List[CustomerBehaviorDetail]]
    analysis_metadata: Dict[str, Any]