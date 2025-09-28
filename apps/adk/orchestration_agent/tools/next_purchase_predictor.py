"""Next purchase prediction tool using shared processing service"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.next_purchase.sync_processing_service import SyncNextPurchaseService


def predict_next_purchase(
    time_period: str = "default",
    customer_id: Optional[str] = None,
    include_product_recommendations: bool = True,
    confidence_threshold: float = 0.7
) -> str:
    """
    Predict next purchase timing and products using ML models.
    Now uses the shared processing service for consistency with dashboards.

    Args:
        time_period: Analysis period for historical data
        customer_id: Specific customer to predict for (optional)
        include_product_recommendations: Whether to include product recommendations
        confidence_threshold: Minimum confidence for predictions (0-1)

    Returns:
        Formatted next purchase predictions as a string.
    """

    # Initialize the sync service
    service = SyncNextPurchaseService()

    # Build filters
    filters = {}

    # Parse time period
    if time_period == "default":
        filters['date_from'] = '2021-01-01'
        filters['date_to'] = '2021-12-31'
    elif ':' in time_period:
        dates = time_period.split(':')
        filters['date_from'] = dates[0]
        filters['date_to'] = dates[1]
    elif time_period.isdigit() and len(time_period) == 4:
        # Year format
        filters['date_from'] = f'{time_period}-01-01'
        filters['date_to'] = f'{time_period}-12-31'
    elif time_period.startswith('Q') and len(time_period) > 2:
        # Quarter format (e.g., Q1 2021)
        parts = time_period.split()
        if len(parts) == 2:
            quarter = int(parts[0][1])
            year = parts[1]
            if quarter == 1:
                filters['date_from'] = f'{year}-01-01'
                filters['date_to'] = f'{year}-03-31'
            elif quarter == 2:
                filters['date_from'] = f'{year}-04-01'
                filters['date_to'] = f'{year}-06-30'
            elif quarter == 3:
                filters['date_from'] = f'{year}-07-01'
                filters['date_to'] = f'{year}-09-30'
            elif quarter == 4:
                filters['date_from'] = f'{year}-10-01'
                filters['date_to'] = f'{year}-12-31'

    if customer_id:
        filters['customer_ids'] = [customer_id]

    filters['confidence_threshold'] = confidence_threshold

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(filters)

        # Format the response
        output = []
        output.append("# Next Purchase Predictions")
        output.append(f"\nAnalysis Period: {filters.get('date_from')} to {filters.get('date_to')}")
        if customer_id:
            output.append(f"Customer: {customer_id}")

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            output.append(f"- Average Days to Next Purchase: {kpis.get('avgDaysToNext', 0):.1f}")
            output.append(f"- Prediction Accuracy Rate: {kpis.get('accuracyRate', 0):.1f}%")
            output.append(f"- Conversion Probability: {kpis.get('conversionProbability', 0):.1f}%")
            output.append(f"- Recommendation Score: {kpis.get('recommendationScore', 0):.1f}/10")

        # Add predictions
        if result.get('mlResults', {}).get('predictions'):
            predictions = result['mlResults']['predictions']

            output.append("\n## Purchase Predictions (Top 10)")
            for i, pred in enumerate(predictions[:10], 1):
                output.append(f"{i}. {pred.get('customer_name', 'Unknown')}")
                output.append(f"   - Predicted Date: {pred.get('predicted_purchase_date', 'N/A')}")
                output.append(f"   - Days Until Purchase: {pred.get('predicted_days_to_purchase', 0):.0f}")

        # Add product recommendations if requested
        if include_product_recommendations and result.get('mlResults', {}).get('product_recommendations'):
            output.append("\n## Product Recommendations")
            recommendations = result['mlResults']['product_recommendations']

            if isinstance(recommendations, dict):
                for cust_id, products in list(recommendations.items())[:5]:
                    output.append(f"\nCustomer {cust_id}:")
                    if isinstance(products, list):
                        for product in products[:3]:
                            if isinstance(product, dict):
                                output.append(f"  - {product.get('product_name', 'Unknown')} (Confidence: {product.get('confidence', 0):.1f}%)")
                            else:
                                output.append(f"  - {product}")
            elif isinstance(recommendations, list):
                for rec in recommendations[:10]:
                    if isinstance(rec, dict):
                        output.append(f"- Customer {rec.get('customer_id', 'Unknown')}: {rec.get('product', 'Unknown')}")

        # Add purchase patterns
        if result.get('mlResults', {}).get('purchase_patterns'):
            output.append("\n## Identified Purchase Patterns")
            patterns = result['mlResults']['purchase_patterns']

            if isinstance(patterns, dict):
                for cust_id, pattern in list(patterns.items())[:5]:
                    if isinstance(pattern, dict):
                        output.append(f"- Customer {cust_id}: Avg {pattern.get('avg_days_between_purchases', 0):.1f} days between purchases")
                    else:
                        output.append(f"- Customer {cust_id}: {pattern}")
            elif isinstance(patterns, list):
                for pattern in patterns[:5]:
                    output.append(f"- {pattern}")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        # Add recommendations
        output.append("\n## Recommendations")
        output.append("- Target customers with predicted purchase dates in the next 7 days")
        output.append("- Send personalized product recommendations based on purchase history")
        output.append("- Offer incentives to customers with lower conversion probability")
        output.append("- Monitor customers with irregular purchase patterns for churn risk")

        return "\n".join(output)

    except Exception as e:
        return f"Error predicting next purchase: {str(e)}"


# Backward compatibility - keep the old class for any legacy code
class NextPurchasePredictor:
    """Legacy predictor class - now uses the new processing service"""

    def __init__(self, db_path: str = None):
        """Initialize the predictor."""
        self.service = SyncNextPurchaseService()

    def predict_next_purchase_date(self, customer_id: str = None) -> str:
        """Predict next purchase date for customer(s)"""
        return predict_next_purchase(customer_id=customer_id)

    def recommend_products(self, customer_id: str = None) -> str:
        """Get product recommendations for customer(s)"""
        return predict_next_purchase(
            customer_id=customer_id,
            include_product_recommendations=True
        )