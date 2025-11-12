"""Next purchase prediction tool using shared processing service"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.customer.next_purchase.sync_processing_service import SyncNextPurchaseService


def predict_next_purchase(
    time_period: str = "default",
    customer_id: Optional[str] = None,
    include_product_recommendations: bool = True,
    confidence_threshold: float = 0.7
) -> str:
    """
    Predict next purchase timing and products using ML models.

    Args:
        time_period: Analysis period for historical data. Supports multiple formats:
            - "default" or empty: Full dataset (2017-2021)
            - Year only: "2021" → 2021-01-01 to 2021-12-31
            - Quarter: "Q1 2021" or "2021 Q1" → Q1 date range
            - Date range with colon: "2017-01-01:2021-12-31"
            - Date range with " to ": "2017-01-01 to 2021-12-31"
            - Relative periods: "last_30_days", "last_90_days", "last_year"
        customer_id: Specific customer to predict for (optional)
        include_product_recommendations: Whether to include product recommendations
        confidence_threshold: Minimum confidence for predictions (0-1)

    Returns:
        Formatted next purchase predictions as a string.

    Examples:
        >>> predict_next_purchase("2021")  # Analyze 2021 only
        >>> predict_next_purchase("Q1 2021")  # Analyze Q1 2021
        >>> predict_next_purchase("2017-01-01:2021-12-31")  # Full range
        >>> predict_next_purchase("last_90_days")  # Last 90 days
    """

    # Initialize the sync service
    service = SyncNextPurchaseService()

    # Build filters
    filters = {}

    # Data availability validation
    data_start_date = datetime(2017, 1, 1)
    data_end_date = datetime(2021, 12, 31)

    # Parse time period with comprehensive format support
    # Check for year only (e.g., "2017", "2018", etc.)
    if time_period and time_period.isdigit() and len(time_period) == 4:
        year = int(time_period)

        # Validate year is within data range
        if year < 2017 or year > 2021:
            return f"""# Data Availability Error

The requested year {year} is outside the available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

Please specify a year between 2017 and 2021, or use the default view.
"""

        filters['dateFrom'] = f'{year}-01-01'
        filters['dateTo'] = f'{year}-12-31'
        print(f"[next_purchase] Parsed year {year} to date range: {filters['dateFrom']} to {filters['dateTo']}")

    # Check for date range with colon separator (e.g., "2017-01-01:2021-12-31")
    elif ':' in time_period:
        parts = time_period.split(':')
        if len(parts) == 2:
            filters['dateFrom'] = parts[0].strip()
            filters['dateTo'] = parts[1].strip()
            print(f"[next_purchase] Parsed date range: {filters['dateFrom']} to {filters['dateTo']}")

    # Check for date range with " to " separator (e.g., "2017-01-01 to 2021-12-31")
    elif ' to ' in time_period.lower():
        parts = time_period.lower().split(' to ')
        if len(parts) == 2:
            filters['dateFrom'] = parts[0].strip()
            filters['dateTo'] = parts[1].strip()
            print(f"[next_purchase] Parsed date range: {filters['dateFrom']} to {filters['dateTo']}")

    # Check for quarter format (e.g., "Q1 2017", "2017 Q1")
    elif 'q' in time_period.lower():
        import re
        match = re.search(r'(q[1-4])\s*(\d{4})|(\d{4})\s*(q[1-4])', time_period.lower())
        if match:
            groups = match.groups()
            quarter = groups[0] or groups[3]
            year = groups[1] or groups[2]

            quarter_ranges = {
                'q1': ('01-01', '03-31'),
                'q2': ('04-01', '06-30'),
                'q3': ('07-01', '09-30'),
                'q4': ('10-01', '12-31')
            }

            if quarter in quarter_ranges:
                start, end = quarter_ranges[quarter]
                filters['dateFrom'] = f'{year}-{start}'
                filters['dateTo'] = f'{year}-{end}'
                print(f"[next_purchase] Parsed quarter {quarter.upper()} {year}: {filters['dateFrom']} to {filters['dateTo']}")

    # Check for relative periods
    elif time_period.lower() in ['last_30_days', 'last_90_days', 'last_180_days', 'last_year']:
        # Calculate relative date from data_end_date (2021-12-31)
        if time_period.lower() == 'last_30_days':
            start_date = data_end_date - timedelta(days=30)
        elif time_period.lower() == 'last_90_days':
            start_date = data_end_date - timedelta(days=90)
        elif time_period.lower() == 'last_180_days':
            start_date = data_end_date - timedelta(days=180)
        elif time_period.lower() == 'last_year':
            start_date = data_end_date - timedelta(days=365)

        filters['dateFrom'] = start_date.strftime('%Y-%m-%d')
        filters['dateTo'] = data_end_date.strftime('%Y-%m-%d')
        print(f"[next_purchase] Parsed relative period '{time_period}': {filters['dateFrom']} to {filters['dateTo']}")

    # Default to 2017-2021 if no pattern matched or "default" specified
    elif time_period == "default" or not time_period:
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
        print(f"[next_purchase] Using default date range (2017-2021): {filters['dateFrom']} to {filters['dateTo']}")

    # Fallback for any unrecognized format
    else:
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
        print(f"[next_purchase] Unrecognized time_period '{time_period}', using default (2017-2021): {filters['dateFrom']} to {filters['dateTo']}")

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
