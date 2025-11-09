"""Purchase Frequency analysis tool for orchestration agent"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.purchase_frequency.sync_processing_service import SyncPurchaseFrequencyProcessingService


def analyze_purchase_frequency(
    time_period: str = "default",
    customer_segments: Optional[List[str]] = None,
    product_categories: Optional[List[str]] = None,
    component: str = "overview"
) -> str:
    """
    Analyze PURCHASE FREQUENCY - how often customers make purchases, repeat rates, frequency distribution.

    This tool focuses on:
    - Purchase frequency bins (1 purchase, 2-3, 4-6, 7-10, 11-20, 21+)
    - High/Medium/Low frequency segmentation (based on purchase count)
    - Purchase intervals (days between purchases)
    - Customer lifecycle stages (New, Active, At Risk, Dormant)
    - RFM segmentation combining frequency with monetary value

    IMPORTANT: Parse the user's date request and pass it in time_period!

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Uses full data range 2017-2021 (default if not specified)
            - "YYYY" - Full year (e.g., "2017", "2018", "2019", "2020", "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range
            - "QX YYYY" - Quarter (e.g., "Q1 2017", "Q4 2021")

            EXAMPLES FROM USER QUERIES:
            - "purchase frequency for 2020" → time_period="2020"
            - "frequency analysis for Q4 2021" → time_period="Q4 2021"
            - "purchase patterns" (no date) → time_period="default" (2017-2021)

        customer_segments: Filter by frequency segment (e.g., ["High", "Medium", "Low"])
        product_categories: Filter by product categories
        component: Which component to show:
            - "overview" - Complete dashboard overview with all metrics
            - "kpis" - Key metrics tiles only
            - "distribution" - Frequency distribution chart
            - "segmentation" - Customer segmentation analysis
            - "intervals" - Purchase interval distribution
            - "lifecycle" - Customer lifecycle stages
            - "table" - Customer details table

    Returns:
        String containing analysis results and visualization metadata
    """
    # Call the synchronous version directly
    result = _analyze_purchase_frequency_sync(time_period, customer_segments, product_categories, component)
    return result


def _analyze_purchase_frequency_sync(
    time_period: str,
    customer_segments: Optional[List[str]],
    product_categories: Optional[List[str]],
    component: str
) -> str:
    """Synchronous implementation of purchase frequency analysis."""

    # Initialize the sync wrapper for agent framework
    service = SyncPurchaseFrequencyProcessingService()

    # Build filters based on parameters
    filters = {}

    # Data availability check
    DATA_START = datetime(2017, 1, 1)
    DATA_END = datetime(2021, 12, 31)
    current_date = datetime.now()

    # Parse time period
    if time_period == "default" or not time_period:
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    elif len(time_period) == 4 and time_period.isdigit():
        # Full year: "2020"
        year = time_period
        filters['dateFrom'] = f'{year}-01-01'
        filters['dateTo'] = f'{year}-12-31'
    elif time_period.startswith('Q') and len(time_period) >= 6:
        # Quarter: "Q1 2020"
        parts = time_period.split()
        quarter = int(parts[0][1])
        year = parts[1]

        quarter_map = {
            1: ('01-01', '03-31'),
            2: ('04-01', '06-30'),
            3: ('07-01', '09-30'),
            4: ('10-01', '12-31')
        }
        start, end = quarter_map[quarter]
        filters['dateFrom'] = f'{year}-{start}'
        filters['dateTo'] = f'{year}-{end}'
    elif ':' in time_period:
        # Custom range: "2020-01-01:2020-12-31"
        dates = time_period.split(':')
        filters['dateFrom'] = dates[0]
        filters['dateTo'] = dates[1]
    else:
        # Default fallback
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'

    # Add optional filters
    if customer_segments:
        filters['customerSegments'] = customer_segments
    if product_categories:
        filters['productCategories'] = product_categories

    # Get dashboard data
    data = service.get_dashboard_summary(filters)

    # Generate text report
    report = _generate_text_report(data, filters)

    # Create visualization metadata
    viz_metadata = {
        "toolname": "purchase-frequency",
        "componentName": component,
        "body": {
            "dateFrom": filters.get('dateFrom'),
            "dateTo": filters.get('dateTo'),
            "customerSegments": filters.get('customerSegments', []),
            "productCategories": filters.get('productCategories', [])
        }
    }

    # Combine report and visualization
    output = f"""{report}

## Visualization Data (Machine-Readable)
```json
{json.dumps(viz_metadata, indent=2)}
```

<output>
{json.dumps(viz_metadata)}
</output>
<is_visualisation>true</is_visualisation>
"""

    return output


def _generate_text_report(data: Dict, filters: Dict) -> str:
    """Generate human-readable text report for AI."""

    kpis = data.get('kpiMetrics', {})
    frequency_dist = data.get('frequencyDistribution', [])
    segmentation = data.get('customerSegmentation', [])
    intervals = data.get('purchaseIntervals', [])
    lifecycle = data.get('lifecycleStages', [])
    customer_details = data.get('customerDetails', [])
    insights = data.get('insights', [])

    # Format date range
    date_from = filters.get('dateFrom', '2017-01-01')
    date_to = filters.get('dateTo', '2021-12-31')

    total_customers = kpis.get('total_customers', 1)

    report = f"""# Purchase Frequency Analysis Report

## Analysis Period
**Date Range**: {date_from} to {date_to}

## Executive Summary

### Customer Base Overview
- **Total Customers Analyzed**: {total_customers:,}
- **Average Purchase Frequency**: {kpis.get('avg_frequency', 0):.2f} purchases per customer
- **Total Revenue**: ${kpis.get('total_revenue', 0):,.2f}

### Frequency Distribution (By Purchase Count)
- **High Frequency** (10+ purchases): {kpis.get('high_frequency_customers', 0):,} customers ({(kpis.get('high_frequency_customers', 0) / max(total_customers, 1) * 100):.1f}%)
- **Medium Frequency** (5-9 purchases): {kpis.get('medium_frequency_customers', 0):,} customers ({(kpis.get('medium_frequency_customers', 0) / max(total_customers, 1) * 100):.1f}%)
- **Low Frequency** (<5 purchases): {kpis.get('low_frequency_customers', 0):,} customers ({(kpis.get('low_frequency_customers', 0) / max(total_customers, 1) * 100):.1f}%)

## Detailed Frequency Bins
"""

    # Add detailed frequency distribution
    if frequency_dist:
        report += "\n"
        for bin_data in frequency_dist:
            bin_range = bin_data.get('bin_range', 'Unknown')
            count = bin_data.get('customer_count', 0)
            pct = bin_data.get('percentage', 0)
            revenue = bin_data.get('total_revenue', 0)
            report += f"- **{bin_range} purchases**: {count:,} customers ({pct:.1f}%) - Revenue: ${revenue:,.2f}\n"

    # Add purchase interval analysis
    if intervals:
        report += "\n## Purchase Intervals (Average Days Between Purchases)\n\n"
        for interval_data in intervals:
            interval_range = interval_data.get('interval_days', 'Unknown')
            count = interval_data.get('customer_count', 0)
            pct = interval_data.get('percentage', 0)
            report += f"- **{interval_range} days**: {count:,} customers ({pct:.1f}%)\n"

    # Add lifecycle stage analysis
    if lifecycle:
        report += "\n## Customer Lifecycle Stages\n\n"
        for stage_data in lifecycle:
            stage = stage_data.get('stage', 'Unknown')
            count = stage_data.get('customer_count', 0)
            avg_freq = stage_data.get('avg_frequency', 0)
            revenue = stage_data.get('total_revenue', 0)
            pct = (count / max(total_customers, 1) * 100)
            report += f"### {stage}\n"
            report += f"- **Customers**: {count:,} ({pct:.1f}%)\n"
            report += f"- **Average Frequency**: {avg_freq:.2f} purchases\n"
            report += f"- **Total Revenue**: ${revenue:,.2f}\n\n"

    # Add RFM segmentation details
    if segmentation:
        report += "## RFM Customer Segmentation\n\n"
        for seg in segmentation:
            seg_name = seg.get('segment', 'Unknown')
            count = seg.get('customer_count', 0)
            avg_freq = seg.get('avg_frequency', 0)
            revenue = seg.get('total_revenue', 0)
            pct = (count / max(total_customers, 1) * 100)
            report += f"### {seg_name}\n"
            report += f"- **Customers**: {count:,} ({pct:.1f}%)\n"
            report += f"- **Average Frequency**: {avg_freq:.2f} purchases\n"
            report += f"- **Total Revenue**: ${revenue:,.2f}\n\n"

    # Add top customers sample
    if customer_details:
        report += f"## Sample Customer Data (Top {min(10, len(customer_details))} by Frequency)\n\n"
        for idx, customer in enumerate(customer_details[:10], 1):
            name = customer.get('customer_name', 'Unknown')
            freq = customer.get('purchase_count', 0)
            spent = customer.get('total_spent', 0)
            segment = customer.get('frequency_segment', 'Unknown')
            report += f"{idx}. **{name}** - {freq} purchases, ${spent:,.2f} spent ({segment} Frequency)\n"

    # Add key insights
    if insights:
        report += "\n## AI-Generated Insights\n\n"
        for i, insight in enumerate(insights[:5], 1):  # Top 5 insights
            report += f"{i}. {insight}\n\n"

    return report


# Tool metadata for agent registration
TOOL_METADATA = {
    "name": "analyze_purchase_frequency",
    "description": "Analyze how often customers make purchases - purchase frequency distribution, purchase intervals, RFM segmentation by frequency, and customer lifecycle stages. Use this for questions about purchase frequency, how often customers buy, repeat purchase rates, frequency bins (1-5 purchases, 6-10, etc), and frequency-based segmentation.",
    "parameters": {
        "time_period": {
            "type": "string",
            "description": "Time period for analysis (default, YYYY, QX YYYY, or custom range)"
        },
        "customer_segments": {
            "type": "array",
            "description": "Filter by customer segments (High, Medium, Low)"
        },
        "product_categories": {
            "type": "array",
            "description": "Filter by product categories"
        },
        "component": {
            "type": "string",
            "description": "Which component to display (overview, kpis, distribution, segmentation, intervals, lifecycle, table)"
        }
    }
}
