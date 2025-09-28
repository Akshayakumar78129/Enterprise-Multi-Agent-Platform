"""Transaction patterns analysis tool using shared processing service"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.transaction_patterns.sync_processing_service import SyncTransactionPatternsService


def analyze_transaction_patterns(
    time_period: str = "default",
    pattern_type: str = "all",
    anomaly_threshold: float = 0.95,
    include_anomalies: bool = True
) -> str:
    """
    Analyze transaction patterns and detect anomalies using ML models.

    Args:
        time_period: Analysis period
        pattern_type: Type of patterns to analyze (all, seasonal, behavioral)
        anomaly_threshold: Threshold for anomaly detection (0-1)
        include_anomalies: Whether to include anomaly detection

    Returns:
        Formatted transaction pattern analysis as a string.
    """

    # Initialize the sync service
    service = SyncTransactionPatternsService()

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

    filters['pattern_type'] = pattern_type
    filters['anomaly_threshold'] = anomaly_threshold

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(filters)

        # Format the response
        output = []
        output.append("# Transaction Pattern Analysis")
        output.append(f"\nAnalysis Period: {filters.get('date_from')} to {filters.get('date_to')}")
        output.append(f"Pattern Type: {pattern_type}")

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            output.append(f"- Unique Patterns Identified: {kpis.get('uniquePatterns', 0):,}")
            output.append(f"- Anomaly Rate: {kpis.get('anomalyRate', 0):.2f}%")
            output.append(f"- Pattern Stability: {kpis.get('patternStability', 0):.1f}%")
            output.append(f"- Average Transaction Value: ${kpis.get('avgTransactionValue', 0):,.2f}")

        # Add pattern clusters
        if result.get('mlResults', {}).get('segments'):
            output.append("\n## Pattern Clusters")
            for cluster in result['mlResults']['segments'][:5]:
                output.append(f"\n### Pattern {cluster.get('segment_id', 'Unknown')}")
                output.append(f"- Size: {cluster.get('size', 0):,} transactions")
                output.append(f"- Average Value: ${cluster.get('avg_revenue', 0):,.2f}")
                if cluster.get('characteristics'):
                    output.append("- Characteristics:")
                    for key, value in list(cluster['characteristics'].items())[:3]:
                        output.append(f"  - {key}: {value:.2f}")

        # Add anomalies if requested
        if include_anomalies and result.get('mainData', {}).get('anomalyscatterData'):
            output.append("\n## Detected Anomalies")
            anomalies = result['mainData']['anomalyscatterData']
            if anomalies:
                output.append(f"Found {len(anomalies)} anomalous transactions")
                output.append("Top anomalies:")
                for anomaly in anomalies[:5]:
                    output.append(f"- Transaction {anomaly.get('id', 'N/A')}: ${anomaly.get('value', 0):,.2f} (Score: {anomaly.get('score', 0):.2f})")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        return "\n".join(output)

    except Exception as e:
        return f"Error analyzing transaction patterns: {str(e)}"
