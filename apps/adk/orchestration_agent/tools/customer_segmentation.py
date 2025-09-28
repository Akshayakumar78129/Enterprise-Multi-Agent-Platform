"""Customer segmentation tool using shared processing service"""

import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.customer_segmentation.sync_processing_service import SyncCustomerSegmentationService


def identify_customer_segments(
    segmentation_method: str = "rfm",
    time_period: str = "quarterly",
    num_segments: Optional[int] = None,
    include_attributes: Optional[List[str]] = None,
    filters: Optional[Dict[str, Any]] = None,
    include_visualization: bool = True
) -> str:
    """
    Identifies and defines customer segments using ML clustering.
    Now uses the shared processing service for consistency with dashboards.

    Args:
        segmentation_method: Method for segmentation (rfm, behavioral, value_based, etc.)
        time_period: Time period to analyze
        num_segments: Target number of segments (optional)
        include_attributes: Specific attributes to include
        filters: Optional filters to narrow analysis
        include_visualization: Whether to include visualizations

    Returns:
        Formatted segmentation results as a string.
    """

    # Initialize the sync service
    service = SyncCustomerSegmentationService()

    # Build filters
    request_filters = filters or {}

    # Parse time period
    if time_period == "quarterly":
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        request_filters['date_from'] = start_date.strftime('%Y-%m-%d')
        request_filters['date_to'] = end_date.strftime('%Y-%m-%d')
    elif time_period == "annual":
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        request_filters['date_from'] = start_date.strftime('%Y-%m-%d')
        request_filters['date_to'] = end_date.strftime('%Y-%m-%d')
    elif ':' in time_period:
        dates = time_period.split(':')
        request_filters['date_from'] = dates[0]
        request_filters['date_to'] = dates[1]

    # Add method and number of segments
    request_filters['segmentation_method'] = segmentation_method
    if num_segments:
        request_filters['num_segments'] = num_segments

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(request_filters)

        # Format the response
        output = []
        output.append("# Customer Segmentation Analysis")
        output.append(f"\nMethod: {segmentation_method.upper()}")
        output.append(f"Time Period: {time_period}")

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            output.append(f"- Total Segments: {kpis.get('totalSegments', 0)}")
            output.append(f"- Largest Segment Size: {kpis.get('largestSegmentSize', 0):,}")
            output.append(f"- Average Segment Value: ${kpis.get('avgSegmentValue', 0):,.2f}")
            output.append(f"- Segmentation Quality: {kpis.get('segmentationQuality', 0):.1f}%")

        # Add segment details
        if result.get('mlResults', {}).get('segments'):
            output.append("\n## Segment Details")
            for segment in result['mlResults']['segments']:
                output.append(f"\n### Segment {segment.get('segment_id', 'Unknown')}")
                output.append(f"- Size: {segment.get('size', 0):,} customers ({segment.get('percentage', 0):.1f}%)")
                output.append(f"- Average Revenue: ${segment.get('avg_revenue', 0):,.2f}")
                output.append(f"- Average Transactions: {segment.get('avg_transactions', 0):.1f}")

                if segment.get('characteristics'):
                    output.append("- Characteristics:")
                    for key, value in segment['characteristics'].items():
                        output.append(f"  - {key}: {value:.2f}")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        # Add feature importance
        if result.get('mlResults', {}).get('feature_importance'):
            output.append("\n## Feature Importance")
            for feature in result['mlResults']['feature_importance'][:5]:
                output.append(f"- {feature['feature']}: {feature['importance']*100:.1f}%")

        return "\n".join(output)

    except Exception as e:
        return f"Error performing customer segmentation: {str(e)}"
