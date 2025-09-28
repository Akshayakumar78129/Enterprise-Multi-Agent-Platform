"""Purchase frequency analysis tool using shared processing service"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.purchase_frequency.sync_processing_service import SyncPurchaseFrequencyService


def analyze_purchase_frequency(
    time_period: str = "default",
    customer_segment: Optional[str] = None,
    frequency_threshold: Optional[int] = None,
    include_patterns: bool = True
) -> str:
    """
    Analyze customer purchase frequency patterns using ML models.

    Args:
        time_period: Analysis period
        customer_segment: Optional segment to analyze
        frequency_threshold: Minimum purchase frequency to include
        include_patterns: Whether to include seasonal patterns

    Returns:
        Formatted purchase frequency analysis as a string.
    """

    # Initialize the sync service
    service = SyncPurchaseFrequencyService()

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

    if customer_segment:
        filters['segments'] = [customer_segment]

    if frequency_threshold:
        filters['min_frequency'] = frequency_threshold

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(filters)

        # Format the response
        output = []
        output.append("# Purchase Frequency Analysis")
        output.append(f"\nAnalysis Period: {filters.get('date_from')} to {filters.get('date_to')}")

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            output.append(f"- Average Purchase Frequency: {kpis.get('avgFrequency', 0):.2f} purchases/month")
            output.append(f"- High Frequency Customers: {kpis.get('highFrequencyCustomers', 0):,}")
            output.append(f"- Frequency Trend: {kpis.get('frequencyTrend', 0):.1f}%")
            output.append(f"- Retention Rate: {kpis.get('retentionRate', 0):.1f}%")

        # Add frequency distribution
        if result.get('mainData', {}).get('frequencydistributionData'):
            output.append("\n## Frequency Distribution")
            for segment in result['mainData']['frequencydistributionData'][:5]:
                output.append(f"- {segment.get('range', 'N/A')}: {segment.get('count', 0):,} customers")

        # Add seasonal patterns if requested
        if include_patterns and result.get('mainData', {}).get('seasonalpatternsData'):
            output.append("\n## Seasonal Patterns")
            output.append("Peak purchase periods identified:")
            for pattern in result['mainData']['seasonalpatternsData'][:3]:
                output.append(f"- {pattern.get('period', 'N/A')}: {pattern.get('frequency', 0):.1f}x normal")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        return "\n".join(output)

    except Exception as e:
        return f"Error analyzing purchase frequency: {str(e)}"
