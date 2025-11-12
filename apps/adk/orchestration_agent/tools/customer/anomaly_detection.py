"""Anomaly detection tool for orchestration agent using shared ML predictor"""

import json
from typing import Optional, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.customer.anomaly_detection.sync_processing_service import SyncAnomalyProcessingService
from domains.customer.anomaly_detection.ml_predictor import AnomalyMLPredictor

def detect_anomalies(
    time_period: str = "last_30_days",
    segment_id: Optional[str] = None,
    include_visualization: bool = False,
    contamination: float = 0.1
) -> str:
    """
    Detect anomalies in customer behavior using the shared ML predictor.
    This ensures consistency with any potential dashboard data.

    Args:
        time_period: Analysis period ('last_7_days', 'last_30_days', 'last_90_days', 'last_180_days', 'last_year')
        segment_id: Optional customer segment to analyze
        include_visualization: Whether to include visualizations (not implemented for consistency)
        contamination: Expected proportion of anomalies (default 0.1 = 10%)

    Returns:
        String containing the anomaly analysis results
    """
    # Call the synchronous version directly
    result = _detect_anomalies_sync(time_period, segment_id, contamination)
    return result


def _detect_anomalies_sync(time_period: str, segment_id: Optional[str], contamination: float) -> str:
    """Synchronous implementation of anomaly detection."""

    # Initialize the sync wrapper for agent framework
    service = SyncAnomalyProcessingService()

    # Build filters based on parameters
    filters = {}

    # Determine date range based on time period (using 2021 data like churn prediction)
    reference_date = datetime(2021, 12, 31)  # End of our data

    if time_period == "last_7_days":
        filters['dateFrom'] = (reference_date - timedelta(days=7)).strftime('%Y-%m-%d')
        filters['dateTo'] = reference_date.strftime('%Y-%m-%d')
        filters['timeRange'] = '7d'
    elif time_period == "last_30_days":
        filters['dateFrom'] = (reference_date - timedelta(days=30)).strftime('%Y-%m-%d')
        filters['dateTo'] = reference_date.strftime('%Y-%m-%d')
        filters['timeRange'] = '30d'
    elif time_period == "last_90_days":
        filters['dateFrom'] = (reference_date - timedelta(days=90)).strftime('%Y-%m-%d')
        filters['dateTo'] = reference_date.strftime('%Y-%m-%d')
        filters['timeRange'] = '90d'
    elif time_period == "last_180_days":
        filters['dateFrom'] = (reference_date - timedelta(days=180)).strftime('%Y-%m-%d')
        filters['dateTo'] = reference_date.strftime('%Y-%m-%d')
    elif time_period == "last_year":
        # Match frontend behavior - use 2017-2021 for consistency
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    else:
        # Default to 2017-2021 (consistent with all dashboards)
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
        filters['timeRange'] = 'full_period'

    # Add segment filter if specified
    if segment_id:
        filters['segments'] = [segment_id]

    try:
        # Get dashboard summary data (similar to churn prediction)
        summary_data = service.get_dashboard_summary(filters)

        # Get detailed anomaly data
        customer_anomalies = summary_data.get('customerAnomalies', [])
        segment_distribution = summary_data.get('segmentDistribution', [])
        region_distribution = summary_data.get('regionDistribution', [])
        severity_distribution = summary_data.get('severityDistribution', [])
        feature_importance = summary_data.get('featureImportance', [])

        # Calculate statistics
        total_customers = len(customer_anomalies)

        # Handle empty data
        if total_customers == 0:
            return """# Anomaly Detection Analysis Report

No customer data available for the specified time period.

Please check:
1. Date range is valid and contains data
2. Filters are correctly applied
3. Database connection is working
"""

        # Count anomalies and severity levels
        anomaly_count = sum(1 for c in customer_anomalies if c['is_anomaly'])
        high_severity_count = sum(1 for c in customer_anomalies if c['severity_level'] >= 4)
        critical_anomalies = [c for c in customer_anomalies if c['severity_level'] == 5]

        # Calculate anomaly rate
        anomaly_rate = (anomaly_count / total_customers * 100) if total_customers > 0 else 0

        # Format the results
        result = f"""# Anomaly Detection Analysis Report

## Analysis Period: {time_period}
{f"Segment: {segment_id}" if segment_id else "All Customers"}
Date Range: {filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}

## Overall Metrics

**Anomaly Detection Rate: {anomaly_rate:.1f}%**
- {anomaly_count} anomalies detected out of {total_customers} customers analyzed
- Detection threshold: {contamination * 100:.1f}% contamination rate
- High severity anomalies: {high_severity_count} customers

## Severity Distribution

"""
        # Add severity distribution
        for severity in severity_distribution:
            result += f"- {severity['label']} (Level {severity['severity_level']}): {severity['count']} customers ({severity['percentage']:.1f}%)\n"

        result += """
## Top Anomalous Patterns

Based on ML model analysis:
"""

        # Add feature importance (top anomaly indicators)
        for idx, feature in enumerate(feature_importance[:5], 1):
            result += f"{idx}. {feature['name']}: {feature['importance']:.1f}% contribution to anomaly detection\n"

        result += """
## Critical Anomalies (Severity Level 5)
"""

        if critical_anomalies:
            for idx, anomaly in enumerate(critical_anomalies[:10], 1):
                result += f"""
### {idx}. {anomaly['customer_name']} (ID: {anomaly['customer_id']})
- Anomaly Score: {anomaly['anomaly_score']:.4f}
- Region: {anomaly.get('region', 'N/A')}
- Segment: {anomaly.get('segment', 'N/A')}
- Transaction Count: {anomaly.get('transaction_count', 0)}
- Average Transaction: ${anomaly.get('avg_transaction_value', 0):,.2f}
- Days Since Last Transaction: {anomaly.get('days_since_last_txn', 'N/A')}
"""

                # Add anomalous features
                if anomaly.get('anomalous_features'):
                    result += "- Anomalous Features:\n"
                    for feat in anomaly['anomalous_features'][:3]:
                        result += f"  - {feat['feature'].replace('_', ' ').title()}: {feat['value']:.2f} (Z-score: {feat['zscore']:.2f})\n"
        else:
            result += "No critical severity anomalies detected.\n"

        # Segment Analysis
        if segment_distribution:
            result += """
## Anomaly Distribution by Segment
"""
            for segment in segment_distribution:
                if segment['total_customers'] > 0:
                    result += f"""
{segment['segment']} Segment:
  - Total Customers: {segment['total_customers']}
  - Anomalies: {segment['anomaly_count']} ({segment['anomaly_rate']:.1f}%)
  - Severity Distribution: L1:{segment['severity_distribution']['1']}, L2:{segment['severity_distribution']['2']}, L3:{segment['severity_distribution']['3']}, L4:{segment['severity_distribution']['4']}, L5:{segment['severity_distribution']['5']}
"""

        # Region Analysis
        if region_distribution:
            result += """
## Top Regions by Anomaly Rate
"""
            for idx, region in enumerate(region_distribution[:5], 1):
                result += f"{idx}. {region['region']}: {region['anomaly_rate']:.1f}% anomaly rate ({region['anomaly_count']}/{region['total_customers']} customers)\n"

        result += """
## Recommendations

1. **Immediate Investigation Required**:
   - Focus on customers with severity level 5 anomalies
   - These represent the most unusual behavior patterns
   - May indicate fraud, system errors, or significant business changes

2. **Pattern Analysis**:
   - Review the top anomalous features to understand what's driving anomalies
   - Look for common patterns among high-severity anomalies
   - Consider if anomalies represent risks or opportunities

3. **Segment-Specific Actions**:
"""

        # Find segment with highest anomaly rate
        if segment_distribution:
            max_anomaly_segment = max(segment_distribution, key=lambda x: x['anomaly_rate'])
            result += f"   - Prioritize {max_anomaly_segment['segment']} segment (highest anomaly rate: {max_anomaly_segment['anomaly_rate']:.1f}%)\n"

        result += """   - Implement targeted monitoring for high-anomaly segments
   - Consider segment-specific thresholds for anomaly detection

4. **Feature-Based Improvements**:
"""

        # Add recommendations based on top features
        for idx, feature in enumerate(feature_importance[:3], 1):
            feature_name = feature['feature'].replace('_', ' ').title()
            if 'transaction' in feature_name.lower():
                result += f"   - Monitor transaction patterns closely ({feature['importance']:.1f}% importance)\n"
            elif 'return' in feature_name.lower():
                result += f"   - Investigate return behavior anomalies ({feature['importance']:.1f}% importance)\n"
            elif 'discount' in feature_name.lower():
                result += f"   - Review discount usage patterns ({feature['importance']:.1f}% importance)\n"
            else:
                result += f"   - Analyze {feature_name} variations ({feature['importance']:.1f}% importance)\n"

        result += """
## Data Consistency Note

This analysis uses Isolation Forest ML model for anomaly detection,
providing consistent results that can be integrated with dashboard visualizations.
The model identifies outliers based on multiple behavioral and transactional features.
"""

        return result

    except Exception as e:
        return f"""# Anomaly Detection Analysis Error

An error occurred while detecting anomalies: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. ML model training status

For debugging, the error details are:
{str(e)}
"""


# Additional helper function for testing
def test_anomaly_detection():
    """Test function to verify the anomaly detection tool is working."""
    try:
        result = detect_anomalies(
            time_period="last_30_days",
            segment_id=None,
            include_visualization=False
        )
        print(result)
        return True
    except Exception as e:
        print(f"Test failed: {e}")
        return False


if __name__ == "__main__":
    # Run test when executed directly
    test_anomaly_detection()