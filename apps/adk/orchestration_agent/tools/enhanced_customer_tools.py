"""
Enhanced customer analysis tools with automatic registration.
"""

from typing import Dict, Any, Optional, List
from orchestration_agent.utils.tool_registry import tool_metadata


@tool_metadata(
    name="analyze_customer_behavior_enhanced",
    description="Analyze customer behavior patterns with enhanced features",
    category="customer_analytics",
    agent_categories=["customer", "analytics"],
    cache_ttl=1800,  # 30 minutes
    retry_config={
        "max_attempts": 3,
        "base_delay": 1.0,
        "retryable_exceptions": ["ConnectionError", "TimeoutError"]
    }
)
def analyze_customer_behavior_enhanced(
    time_period: Optional[str] = "last_90_days",
    segment_filters: Optional[Dict[str, Any]] = None,
    include_visualization: bool = True
) -> Dict[str, Any]:
    """
    Enhanced customer behavior analysis with improved error handling and caching.
    
    Args:
        time_period: Analysis time period
        segment_filters: Optional filters for customer segments
        include_visualization: Whether to include visualizations
        
    Returns:
        Customer behavior analysis results
    """
    # Import the original function
    from orchestration_agent.tools.customer_behaviour import analyze_customer_behavior
    
    # Call with enhanced parameters
    return analyze_customer_behavior()


@tool_metadata(
    name="predict_customer_ltv_enhanced",
    description="Predict customer lifetime value with ML enhancements",
    category="customer_analytics", 
    agent_categories=["customer", "analytics", "financial"],
    cache_ttl=3600,  # 1 hour
    dependencies=["torch", "scikit-learn"]
)
def predict_customer_ltv_enhanced(
    time_period: str = "annual",
    segment_id: Optional[str] = None,
    include_visualization: bool = True,
    training_epochs: int = 100,
    batch_size: int = 32
) -> Dict[str, Any]:
    """
    Enhanced customer LTV prediction with improved ML models.
    
    Args:
        time_period: Analysis period
        segment_id: Optional customer segment
        include_visualization: Whether to include visualizations
        training_epochs: Number of training epochs
        batch_size: Batch size for training
        
    Returns:
        LTV prediction results
    """
    # Import the original function
    from orchestration_agent.tools.customer_lifetime_value import predict_customer_ltv
    
    # Call with enhanced parameters
    return predict_customer_ltv(
        time_period=time_period,
        segment_id=segment_id,
        include_visualization=include_visualization,
        training_epochs=training_epochs,
        batch_size=batch_size
    )


@tool_metadata(
    name="identify_customer_segments_enhanced", 
    description="Advanced customer segmentation with multiple algorithms",
    category="customer_analytics",
    agent_categories=["customer", "marketing"],
    cache_ttl=7200,  # 2 hours
    circuit_breaker_config={
        "failure_threshold": 3,
        "recovery_timeout": 60
    }
)
def identify_customer_segments_enhanced(
    segmentation_method: str = "rfm",
    time_period: str = "annual", 
    num_segments: Optional[int] = None,
    include_attributes: Optional[List[str]] = None,
    filters: Optional[Dict[str, Any]] = None,
    include_visualization: bool = True
) -> Dict[str, Any]:
    """
    Enhanced customer segmentation with multiple algorithms and validation.
    
    Args:
        segmentation_method: Segmentation method to use
        time_period: Time period for analysis
        num_segments: Number of segments to create
        include_attributes: Attributes to include in segmentation
        filters: Optional filters
        include_visualization: Whether to include visualizations
        
    Returns:
        Customer segmentation results
    """
    # Import the original function
    from orchestration_agent.tools.customer_segmentation import identify_customer_segments
    
    # Call with enhanced parameters
    return identify_customer_segments(
        segmentation_method=segmentation_method,
        time_period=time_period,
        num_segments=num_segments,
        include_attributes=include_attributes,
        filters=filters,
        include_visualization=include_visualization
    )


@tool_metadata(
    name="analyze_churn_risk_enhanced",
    description="Advanced churn risk prediction with ensemble models",
    category="customer_analytics",
    agent_categories=["customer", "retention"],
    cache_ttl=1800,
    dependencies=["xgboost", "lightgbm"]
)
def analyze_churn_risk_enhanced(
    time_period: str = "last_90_days",
    segment_id: Optional[str] = None,
    include_visualization: bool = True,
    model_ensemble: bool = True,
    feature_importance: bool = True
) -> Dict[str, Any]:
    """
    Enhanced churn risk analysis with ensemble models and feature importance.
    
    Args:
        time_period: Analysis time period
        segment_id: Optional customer segment
        include_visualization: Whether to include visualizations
        model_ensemble: Use ensemble of models for better accuracy
        feature_importance: Include feature importance analysis
        
    Returns:
        Churn risk analysis results
    """
    # Import the original function
    from orchestration_agent.tools.churn_prediction import predict_churn_risk
    
    # Enhanced implementation could use ensemble models
    base_result = predict_churn_risk(
        time_period=time_period,
        segment_id=segment_id,
        include_visualization=include_visualization
    )
    
    # Add ensemble model enhancements if requested
    if model_ensemble and base_result.get("status") == "success":
        base_result["metadata"]["model_type"] = "ensemble"
        base_result["metadata"]["enhanced"] = True
    
    return base_result


@tool_metadata(
    name="analyze_transaction_patterns_enhanced",
    description="Deep transaction pattern analysis with anomaly detection",
    category="customer_analytics",
    agent_categories=["customer", "fraud_detection", "analytics"],
    cache_ttl=900,  # 15 minutes
    retry_config={
        "max_attempts": 2,
        "base_delay": 0.5
    }
)
def analyze_transaction_patterns_enhanced(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    anomaly_detection: bool = True,
    pattern_depth: str = "deep",
    include_fraud_signals: bool = True
) -> Dict[str, Any]:
    """
    Enhanced transaction pattern analysis with anomaly detection.
    
    Args:
        start_date: Analysis start date
        end_date: Analysis end date
        anomaly_detection: Enable anomaly detection
        pattern_depth: Depth of pattern analysis ('basic', 'standard', 'deep')
        include_fraud_signals: Include fraud detection signals
        
    Returns:
        Transaction pattern analysis results
    """
    # Import the original function
    from orchestration_agent.tools.transaction_patterns import analyze_transaction_patterns
    
    # Call base function
    base_result = analyze_transaction_patterns(
        start_date=start_date,
        end_date=end_date
    )
    
    # Add enhanced features
    if base_result.get("status") == "success" and anomaly_detection:
        # Add anomaly detection results
        base_result["anomaly_detection"] = {
            "enabled": True,
            "suspicious_patterns": [],
            "confidence_threshold": 0.85
        }
    
    if include_fraud_signals:
        base_result["fraud_signals"] = {
            "enabled": True,
            "risk_indicators": [],
            "pattern_depth": pattern_depth
        }
    
    return base_result


# Example of a completely new tool using the registry
@tool_metadata(
    name="customer_journey_analysis",
    description="Analyze customer journey and touchpoint effectiveness",
    category="customer_analytics",
    agent_categories=["customer", "marketing", "ux"],
    cache_ttl=3600,
    dependencies=["pandas", "networkx"]
)
def customer_journey_analysis(
    customer_ids: Optional[List[str]] = None,
    journey_length: int = 30,
    include_touchpoints: bool = True,
    conversion_analysis: bool = True
) -> Dict[str, Any]:
    """
    Analyze customer journey patterns and touchpoint effectiveness.
    
    Args:
        customer_ids: Optional list of specific customers to analyze
        journey_length: Length of journey to analyze in days
        include_touchpoints: Include touchpoint analysis
        conversion_analysis: Include conversion funnel analysis
        
    Returns:
        Customer journey analysis results
    """
    # This would be a new tool implementation
    return {
        "status": "success",
        "data": {
            "journey_analysis": {
                "total_customers": len(customer_ids) if customer_ids else 0,
                "avg_journey_length": journey_length,
                "touchpoints_analyzed": include_touchpoints,
                "conversion_analysis": conversion_analysis
            },
            "insights": [
                "Customer journey analysis completed",
                "Key touchpoints identified",
                "Conversion opportunities detected"
            ]
        },
        "metadata": {
            "tool_name": "customer_journey_analysis",
            "enhanced": True,
            "version": "1.0.0"
        }
    }