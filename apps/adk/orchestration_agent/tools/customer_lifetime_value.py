"""Customer lifetime value tool using shared processing service"""

import json
from typing import Optional, Dict
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.customer_ltv.sync_processing_service import SyncCustomerLtvService


def calculate_customer_lifetime_value(
    time_period: str = "default",
    prediction_horizon: int = 12,
    customer_segment: Optional[str] = None,
    include_forecast: bool = True
) -> str:
    """
    Calculate and predict customer lifetime value using ML models.
    Now uses the shared processing service for consistency with dashboards.

    Args:
        time_period: Analysis period (default, YYYY-MM-DD:YYYY-MM-DD, etc.)
        prediction_horizon: Months to predict into the future
        customer_segment: Optional segment to analyze
        include_forecast: Whether to include future predictions

    Returns:
        Formatted LTV analysis as a string.
    """

    # Initialize the sync service
    service = SyncCustomerLtvService()

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
        filters['date_from'] = f'{time_period}-01-01'
        filters['date_to'] = f'{time_period}-12-31'

    if customer_segment:
        filters['segments'] = [customer_segment]

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(filters)

        # Format the response
        output = []
        output.append("# Customer Lifetime Value Analysis")
        output.append(f"\nAnalysis Period: {filters.get('date_from')} to {filters.get('date_to')}")
        if customer_segment:
            output.append(f"Segment: {customer_segment}")

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            output.append(f"- Average LTV: ${kpis.get('avgLTV', 0):,.2f}")
            output.append(f"- Total LTV: ${kpis.get('totalLTV', 0):,.2f}")
            output.append(f"- High Value Customers: {kpis.get('highValueCount', 0):,}")
            output.append(f"- LTV Growth: {kpis.get('ltvGrowth', 0):.1f}%")

        # Add top customers by LTV
        if result.get('mlResults', {}).get('predictions'):
            predictions = result['mlResults']['predictions']

            # Sort by predicted LTV
            sorted_predictions = sorted(predictions, key=lambda x: x.get('predicted_ltv', 0), reverse=True)

            output.append("\n## Top 10 Customers by Predicted LTV")
            for i, customer in enumerate(sorted_predictions[:10], 1):
                output.append(f"{i}. {customer.get('customer_name', 'Unknown')} - ${customer.get('predicted_ltv', 0):,.2f} ({customer.get('ltv_percentile', 'N/A')})")

        # Add LTV distribution
        if result.get('mainData', {}).get('ltvDistribution'):
            output.append("\n## LTV Distribution")
            for bucket in result['mainData']['ltvDistribution'][:5]:
                output.append(f"- {bucket.get('range', 'N/A')}: {bucket.get('count', 0):,} customers")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        # Add forecast if requested
        if include_forecast:
            output.append(f"\n## {prediction_horizon}-Month Forecast")
            output.append(f"Based on current trends and ML predictions, the total customer lifetime value is expected to grow by approximately {kpis.get('ltvGrowth', 0):.1f}% over the next {prediction_horizon} months.")

        return "\n".join(output)

    except Exception as e:
        return f"Error calculating customer lifetime value: {str(e)}"


# Alias for backward compatibility
predict_customer_ltv = calculate_customer_lifetime_value
