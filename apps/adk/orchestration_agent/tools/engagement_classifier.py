"""Customer engagement classification tool using shared processing service"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.engagement_classifier.sync_processing_service import SyncEngagementClassifierService


def classify_customer_engagement(
    time_period: str = "default",
    engagement_threshold: str = "medium",
    include_recommendations: bool = True,
    customer_segment: Optional[str] = None
) -> str:
    """
    Classify customer engagement levels using ML models.

    Args:
        time_period: Analysis period
        engagement_threshold: Minimum engagement level (low, medium, high)
        include_recommendations: Whether to include action recommendations
        customer_segment: Optional segment to analyze

    Returns:
        Formatted engagement classification as a string.
    """

    # Initialize the sync service
    service = SyncEngagementClassifierService()

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

    filters['engagement_threshold'] = engagement_threshold

    if customer_segment:
        filters['segments'] = [customer_segment]

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(filters)

        # Format the response
        output = []
        output.append("# Customer Engagement Classification")
        output.append(f"\nAnalysis Period: {filters.get('date_from')} to {filters.get('date_to')}")

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            output.append(f"- Highly Engaged Customers: {kpis.get('highlyEngaged', 0):,}")
            output.append(f"- At Risk Customers: {kpis.get('atRiskCount', 0):,}")
            output.append(f"- Average Engagement Score: {kpis.get('avgEngagementScore', 0):.1f}/100")
            output.append(f"- Engagement Trend: {'+' if kpis.get('engagementTrend', 0) > 0 else ''}{kpis.get('engagementTrend', 0):.1f}%")

        # Add engagement distribution
        if result.get('mlResults', {}).get('engagement_distribution'):
            output.append("\n## Engagement Distribution")
            for level, count in result['mlResults']['engagement_distribution'].items():
                output.append(f"- {level}: {count:,} customers")

        # Add at-risk customers
        if result.get('mlResults', {}).get('at_risk_customers'):
            output.append("\n## At-Risk Customers (Top 10)")
            for i, customer in enumerate(result['mlResults']['at_risk_customers'][:10], 1):
                output.append(f"{i}. {customer.get('customer_name', 'Unknown')} - Score: {customer.get('engagement_score', 0):.1f}")

        # Add recommendations if requested
        if include_recommendations:
            output.append("\n## Recommended Actions")
            output.append("- **For Highly Engaged**: Implement loyalty programs and exclusive offers")
            output.append("- **For Medium Engaged**: Increase touchpoints through personalized communications")
            output.append("- **For Low Engaged**: Re-engagement campaigns with incentives")
            output.append("- **For At-Risk**: Immediate intervention with retention offers")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        return "\n".join(output)

    except Exception as e:
        return f"Error classifying customer engagement: {str(e)}"
