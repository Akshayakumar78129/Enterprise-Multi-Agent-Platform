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
            for customer_id, products in list(result['mlResults']['product_recommendations'].items())[:5]:
                output.append(f"\nCustomer {customer_id}:")
                for product in products[:3]:
                    output.append(f"  - {product.get('product_name', 'Unknown')} (Confidence: {product.get('confidence', 0):.1f}%)")

        # Add purchase patterns
        if result.get('mlResults', {}).get('purchase_patterns'):
            output.append("\n## Identified Purchase Patterns")
            patterns = result['mlResults']['purchase_patterns']
            for customer_id, pattern in list(patterns.items())[:5]:
                output.append(f"- Customer {customer_id}: Avg {pattern.get('avg_days_between_purchases', 0):.1f} days between purchases")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        return "\n".join(output)

    except Exception as e:
        return f"Error predicting next purchase: {str(e)}"
