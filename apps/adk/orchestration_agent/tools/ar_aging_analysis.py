"""AR Aging Analysis tool using shared processing service"""

import json
from typing import Optional, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.ar_aging_analysis.sync_processing_service import get_sync_processing_service


def analyze_ar_aging(
    time_period: str = "default",
    customer_segments: Optional[List[str]] = None,
    risk_levels: Optional[List[str]] = None,
    min_amount: Optional[float] = None,
    wacc: float = 10.0
) -> str:
    """
    Analyze accounts receivable aging to understand payment patterns, NPV impact,
    and customer risk profiles. Provides aging buckets, collection forecasts, and
    customer segmentation.

    IMPORTANT: Parse the user's date request and pass it in time_period!

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Uses full range 2017-2021 (default if not specified)
            - "last_30_days" - Last 30 days from current date
            - "last_90_days" - Last 90 days from current date
            - "last_180_days" - Last 180 days from current date
            - "last_year" - Last 365 days from current date
            - "YYYY" - Full year (e.g., "2018", "2019", "2020", "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range (e.g., "2021-01-01:2021-12-31")
            - "QX YYYY" - Quarter (e.g., "Q1 2021", "Q4 2021")

            EXAMPLES FROM USER QUERIES:
            - "AR aging for 2020" → time_period="2020"
            - "aging analysis for Q4 2021" → time_period="Q4 2021"
            - "accounts receivable from Jan to March 2021" → time_period="2021-01-01:2021-03-31"
            - "AR aging for last 30 days" → time_period="last_30_days"
            - "accounts receivable aging" (no date specified) → time_period="default"

        customer_segments: Optional list of customer segments to filter
        risk_levels: Optional list of risk levels ("high", "medium", "low")
        min_amount: Optional minimum AR amount filter
        wacc: Weighted average cost of capital for NPV calculations (default 10%)

    Returns:
        Formatted AR aging analysis with visualization tags.
    """

    # Initialize the sync service
    service = get_sync_processing_service()

    # Build filters
    filters = {}

    # Define data availability range (2017-2021)
    DATA_START = datetime(2017, 1, 1)
    DATA_END = datetime(2021, 12, 31)
    current_date = datetime.now()

    # Parse time period with date validation
    if time_period == "last_30_days":
        # Check if this is beyond our data range
        if current_date > DATA_END:
            return f"""<output>
# AR Aging Analysis

## No Data Available for Last 30 Days

The requested time period (last 30 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

To view AR aging data, please:
- Specify a date range within 2017-2021
- Use the default view (2017-2021)
- Query specific historical periods
</output>
<is_visualisation>false</is_visualisation>"""
        filters['dateFrom'] = (current_date - timedelta(days=30)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')

    elif time_period == "last_90_days":
        if current_date > DATA_END:
            return f"""<output>
# AR Aging Analysis

## No Data Available for Last 90 Days

The requested period is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31
</output>
<is_visualisation>false</is_visualisation>"""
        filters['dateFrom'] = (current_date - timedelta(days=90)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')

    elif time_period == "last_180_days":
        if current_date > DATA_END:
            return f"""<output>
# AR Aging Analysis

## No Data Available for Last 180 Days

The requested period is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31
</output>
<is_visualisation>false</is_visualisation>"""
        filters['dateFrom'] = (current_date - timedelta(days=180)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')

    elif time_period == "last_year":
        if current_date > DATA_END:
            return f"""<output>
# AR Aging Analysis

## No Data Available for Last Year

The requested period is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31
</output>
<is_visualisation>false</is_visualisation>"""
        filters['dateFrom'] = (current_date - timedelta(days=365)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')

    # Check for 4-digit year
    elif time_period.isdigit() and len(time_period) == 4:
        year = int(time_period)
        if year < 2017 or year > 2021:
            return f"""<output>
# AR Aging Analysis

## No Data Available for {year}

The requested year is outside our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

Please specify a year between 2017 and 2021.
</output>
<is_visualisation>false</is_visualisation>"""
        filters['dateFrom'] = f'{year}-01-01'
        filters['dateTo'] = f'{year}-12-31'

    # Check for date range with colon separator
    elif ':' in time_period:
        dates = time_period.split(':')
        filters['dateFrom'] = dates[0].strip()
        filters['dateTo'] = dates[1].strip()

    # Check for quarter format (e.g., "Q1 2021")
    elif 'q' in time_period.lower():
        import re
        match = re.search(r'(q[1-4])\s*(\d{4})|(\d{4})\s*(q[1-4])', time_period.lower())
        if match:
            groups = match.groups()
            quarter = groups[0] or groups[3]
            year = int(groups[1] or groups[2])

            if year < 2017 or year > 2021:
                return f"""<output>
# AR Aging Analysis

## No Data Available for {quarter.upper()} {year}

The requested period is outside our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31
</output>
<is_visualisation>false</is_visualisation>"""

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

    # Default to 2017-2021 (consistent with all dashboards)
    elif time_period == "default" or not time_period:
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    else:
        # Fallback for unrecognized format
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'

    # Add other filters
    if customer_segments:
        filters['customerSegments'] = customer_segments
    if risk_levels:
        filters['riskLevels'] = risk_levels
    if min_amount is not None:
        filters['minAmount'] = min_amount
    filters['wacc'] = wacc

    # Get results from processing service
    try:
        result = service.get_ar_aging_summary(filters)

        # Format the response
        output = []
        output.append("<output>")
        output.append("# Accounts Receivable Aging Analysis")
        output.append(f"\nAnalysis Period: {filters.get('dateFrom')} to {filters.get('dateTo')}")
        output.append(f"WACC: {wacc}%")
        if customer_segments:
            output.append(f"Customer Segments: {', '.join(customer_segments)}")

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Performance Indicators")
            kpis = result['kpiMetrics']

            if 'totalAR' in kpis:
                output.append(f"- **Total A/R**: {kpis['totalAR'].get('formatted_value', 'N/A')} ({kpis['totalAR'].get('status', 'N/A')})")

            if 'dso' in kpis:
                output.append(f"- **Days Sales Outstanding**: {kpis['dso'].get('formatted_value', 'N/A')} ({kpis['dso'].get('status', 'N/A')})")

            if 'overdueAmount' in kpis:
                output.append(f"- **Overdue Amount**: {kpis['overdueAmount'].get('formatted_value', 'N/A')} ({kpis['overdueAmount'].get('status', 'N/A')})")

            if 'collectionEfficiency' in kpis:
                output.append(f"- **Collection Efficiency**: {kpis['collectionEfficiency'].get('formatted_value', 'N/A')}")

            if 'riskExposure' in kpis:
                output.append(f"- **High Risk Exposure (90+ days)**: {kpis['riskExposure'].get('formatted_value', 'N/A')}")

        # Add aging buckets summary
        if result.get('mainData', {}).get('agingBuckets'):
            output.append("\n## Aging Buckets")
            buckets = result['mainData']['agingBuckets']
            for bucket in buckets:
                output.append(f"- **{bucket['range']}**: ${bucket['amount']:,.0f} ({bucket['percentOfTotal']:.1f}%) - {bucket['count']} invoices")
                output.append(f"  - NPV Adjusted: ${bucket['npvAdjustedAmount']:,.0f}")
                output.append(f"  - Value Erosion: ${bucket['valueErosion']:,.0f}")

        # Add NPV summary
        if result.get('mainData', {}).get('npvSummary'):
            output.append("\n## NPV Impact")
            npv = result['mainData']['npvSummary']
            output.append(f"- **Total Value Erosion**: ${npv.get('totalValueErosion', 0):,.2f} ({npv.get('erosionPercentage', 0):.1f}%)")
            output.append(f"- **Daily Erosion Rate**: ${npv.get('dailyErosionRate', 0):,.2f}")

        # Add customer segmentation summary
        if result.get('mainData', {}).get('customerInsights'):
            customers = result['mainData']['customerInsights']
            segments = {}
            for customer in customers:
                segment = customer.get('segment', 'Unknown')
                segments[segment] = segments.get(segment, 0) + 1

            output.append("\n## Customer Segmentation (BCG Matrix)")
            for segment, count in segments.items():
                output.append(f"- **{segment}**: {count} customers")

        # Add insights
        if result.get('insights'):
            output.append("\n## Key Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        # Add visualization metadata - using metadata-only approach
        output.append("\n## Visualization Data (Machine-Readable)")
        output.append("```json")

        # Build filter metadata for frontend to fetch data
        viz_data = {
            "toolname": "ar-aging-analysis",
            "componentName": "overview",  # Primary component
            "body": {
                "dateFrom": filters.get('dateFrom'),
                "dateTo": filters.get('dateTo'),
                "wacc": wacc
            }
        }

        # Add optional filters
        if customer_segments:
            viz_data["body"]["customerSegments"] = customer_segments
        if risk_levels:
            viz_data["body"]["riskLevels"] = risk_levels
        if min_amount:
            viz_data["body"]["minAmount"] = min_amount

        output.append(json.dumps(viz_data, indent=2))
        output.append("```")
        output.append("</output>")
        output.append("<is_visualisation>true</is_visualisation>")

        return "\n".join(output)

    except Exception as e:
        return f"""<output>
# AR Aging Analysis Error

An error occurred while analyzing accounts receivable: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. AR data presence in the system

For debugging, the error details are:
{str(e)}
</output>
<is_visualisation>false</is_visualisation>"""


# Alias for backward compatibility
ar_aging_tool = analyze_ar_aging
