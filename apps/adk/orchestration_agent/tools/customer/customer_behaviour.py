from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import logging
from datetime import datetime, timedelta
import os
import sys
import json

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.customer.customer_behavior.sync_processing_service import SyncCustomerBehaviorProcessingService

# Setup logger
logger = logging.getLogger(__name__)

def analyze_customer_behavior(
    time_period: str = "last_90_days",
    segment_id: Optional[str] = None,
    behavior_types: Optional[List[str]] = None,
    include_visualization: bool = False
) -> str:
    """
    Analyze CUSTOMER BEHAVIOR - product preferences, channel usage, and engagement.

    This tool focuses on WHAT customers buy and HOW they engage, NOT how often:
    - Product preferences (top categories, product diversity)
    - Channel usage (Item, Unknown, etc.)
    - Engagement metrics (recency, engagement scores)
    - Customer segments (Business segments)

    NOTE: For purchase FREQUENCY (how often customers buy), use analyze_purchase_frequency instead!

    Args:
        time_period: Analysis period ('last_30_days', 'last_90_days', 'last_180_days', 'last_year', or date range)
        segment_id: Optional customer segment to analyze
        behavior_types: Types of behavior to analyze (defaults to all types)
        include_visualization: Whether to include visualizations (not implemented for consistency)

    Returns:
        String containing the analysis results
    """
    # Call the synchronous version directly
    result = _analyze_customer_behavior_sync(time_period, segment_id, behavior_types)
    return result


def _analyze_customer_behavior_sync(time_period: str, segment_id: Optional[str], behavior_types: Optional[List[str]]) -> str:
    """Synchronous implementation of customer behavior analysis."""

    # Initialize the sync wrapper for agent framework
    service = SyncCustomerBehaviorProcessingService()

    # Build filters based on parameters
    filters = {}

    # Determine date range based on time period (using 2021 data)
    reference_date = datetime(2021, 12, 31)  # End of our data

    if time_period == "last_30_days":
        filters['dateFrom'] = (reference_date - timedelta(days=30)).strftime('%Y-%m-%d')
        filters['dateTo'] = reference_date.strftime('%Y-%m-%d')
        filters['time_period'] = '30d'
    elif time_period == "last_90_days" or time_period == "quarterly":
        filters['dateFrom'] = (reference_date - timedelta(days=90)).strftime('%Y-%m-%d')
        filters['dateTo'] = reference_date.strftime('%Y-%m-%d')
        filters['time_period'] = '90d'
    elif time_period == "last_180_days":
        filters['dateFrom'] = (reference_date - timedelta(days=180)).strftime('%Y-%m-%d')
        filters['dateTo'] = reference_date.strftime('%Y-%m-%d')
    elif time_period == "last_year" or time_period == "annual" or time_period == "yearly":
        # Use 2017-2021 for "last year" (consistent with other dashboards)
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    elif time_period == "monthly":
        filters['dateFrom'] = (reference_date - timedelta(days=30)).strftime('%Y-%m-%d')
        filters['dateTo'] = reference_date.strftime('%Y-%m-%d')
        filters['time_period'] = '30d'
    else:
        # Default to 2017-2021 (consistent with other dashboards)
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
        filters['time_period'] = 'all'

    # Add segment filter if specified
    if segment_id:
        filters['segment_id'] = segment_id

    # Add behavior types filter if specified
    if behavior_types:
        filters['behavior_types'] = behavior_types
    else:
        # Default to all behavior types
        filters['behavior_types'] = ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"]

    try:
        # Get behavior summary data (same data shown in UI)
        summary_data = service.get_behavior_summary(filters)

        # Extract metrics from summary
        purchase_patterns = summary_data.get('purchasePatterns', {})
        product_preferences = summary_data.get('productPreferences', {})
        channel_usage = summary_data.get('channelUsage', {})
        engagement_metrics = summary_data.get('engagementMetrics', {})
        customer_segments = summary_data.get('customerSegments', [])
        top_customers = summary_data.get('topCustomers', [])

        # Format the results
        result = f"""# Customer Behavior Analysis Report

## Analysis Period: {time_period}
{f"Segment: {segment_id}" if segment_id else "All Customers"}
Date Range: {filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}

## Overall Metrics

Total Customers Analyzed: {purchase_patterns.get('totalCustomersAnalyzed', len(top_customers) if top_customers else 0)}
Behavior Types Analyzed: {', '.join(filters.get('behavior_types', []))}

## Purchase Patterns Summary
"""

        # Add purchase pattern details
        if purchase_patterns:
            # Handle frequencyDistribution as list or dict
            freq_dist = purchase_patterns.get('frequencyDistribution', [])
            avg_order = purchase_patterns.get('avgOrderValue', 0) or purchase_patterns.get('spendPatterns', {}).get('avgOrderValue', 0)
            total_revenue = purchase_patterns.get('totalRevenue', 0) or purchase_patterns.get('spendPatterns', {}).get('totalRevenue', 0)
            total_customers = purchase_patterns.get('totalCustomersAnalyzed', 0)

            result += f"""
Average Order Value: ${avg_order:.2f}
Total Revenue: ${total_revenue:,.2f}
Total Customers Analyzed: {total_customers}

Purchase Frequency Distribution:
"""
            # Handle freq_dist as list
            if isinstance(freq_dist, list):
                for item in freq_dist:
                    result += f"- {item.get('category', 'Unknown')}: {item.get('percentage', 0):.1f}%\n"
            # Handle freq_dist as dict
            elif isinstance(freq_dist, dict):
                for freq_type, percentage in freq_dist.items():
                    result += f"- {freq_type}: {percentage:.1f}%\n"

        # Add product preferences
        if product_preferences:
            result += """
## Product Preferences
"""
            top_categories = product_preferences.get('topCategories', [])
            if top_categories:
                result += "\nTop Product Categories:\n"
                for idx, category in enumerate(top_categories[:5], 1):
                    result += f"{idx}. Category {category.get('category', 'Unknown')}: {category.get('percentage', 0):.1f}% of purchases\n"

        # Add channel usage
        if channel_usage:
            result += """
## Channel Usage Analysis
"""
            channel_dist = channel_usage.get('channelDistribution', {})
            if channel_dist:
                result += "\nChannel Distribution:\n"
                for channel, percentage in channel_dist.items():
                    result += f"- {channel}: {percentage:.1f}%\n"

        # Add engagement metrics
        if engagement_metrics:
            result += """
## Customer Engagement Metrics
"""
            avg_engagement = engagement_metrics.get('avgEngagementScore', 0)
            recency_dist = engagement_metrics.get('recencyDistribution', {})

            result += f"\nAverage Engagement Score: {avg_engagement:.2f}/100\n"

            if recency_dist:
                result += "\nCustomer Recency Distribution:\n"
                for recency_type, percentage in recency_dist.items():
                    result += f"- {recency_type}: {percentage:.1f}%\n"

        # Add customer segments
        if customer_segments:
            result += """
## Customer Segments Overview
"""
            for segment in customer_segments[:5]:
                result += f"""
{segment.get('segment', 'Unknown')} Segment:
  - Customer Count: {segment.get('customerCount', 0)}
  - Average Purchase Value: ${segment.get('avgPurchaseValue', 0):.2f}
  - Total Revenue: ${segment.get('totalRevenue', 0):,.2f}
"""

        # Add top customers
        if top_customers:
            result += """
## Top Customers (by Revenue)
"""
            for idx, customer in enumerate(top_customers[:10], 1):
                result += f"{idx}. {customer.get('customer_name', 'Unknown')} (ID: {customer.get('customer_id', 'N/A')})\n"
                result += f"   - Total Revenue: ${customer.get('total_revenue', 0):,.2f}\n"
                result += f"   - Order Count: {customer.get('order_count', 0)}\n"
                result += f"   - Average Order: ${customer.get('avg_order_value', 0):.2f}\n\n"

        result += """
## Recommendations

1. **Focus on High-Value Segments**: Target customers in top-performing segments with personalized campaigns

2. **Optimize Channel Strategy**: Allocate resources to channels with highest engagement and conversion

3. **Product Mix Optimization**: Stock and promote products from top-performing categories

4. **Engagement Improvement**: Implement retention strategies for customers showing declining engagement

## Data Consistency Note

This analysis uses the same data processing service as the Customer Behavior Dashboard,
ensuring complete consistency between agent responses and dashboard visualizations.
"""

        # Add visualization metadata for Enterprise-IQ
        viz_metadata = {
            "toolname": "customer-behaviour",
            "componentName": "overview",  # Default to overview (purchase patterns)
            "body": {
                "dateFrom": filters.get('dateFrom'),
                "dateTo": filters.get('dateTo'),
                "segmentId": segment_id,
                "behaviorTypes": filters.get('behavior_types', [])
            }
        }

        # Append visualization metadata
        result += f"""

## Visualization Data (Machine-Readable)
```json
{json.dumps(viz_metadata, indent=2)}
```

<output>
{json.dumps(viz_metadata)}
</output>
<is_visualisation>true</is_visualisation>
"""

        return result

    except Exception as e:
        return f"""# Customer Behavior Analysis Error

An error occurred while analyzing customer behavior: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. Processing service status

For debugging, the error details are:
{str(e)}
"""


# Additional helper function for testing
def test_customer_behavior():
    """Test function to verify the customer behavior tool is working."""
    try:
        result = analyze_customer_behavior(
            time_period="last_90_days",
            segment_id=None,
            behavior_types=None,
            include_visualization=False
        )
        print(result)
        return True
    except Exception as e:
        print(f"Test failed: {e}")
        return False


if __name__ == "__main__":
    # Run test when executed directly
    test_customer_behavior()