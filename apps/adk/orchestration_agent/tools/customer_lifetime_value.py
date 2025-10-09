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

    IMPORTANT: Parse the user's date request and pass it in time_period!

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Uses full year 2021 (default if not specified)
            - "last_30_days" - Last 30 days from current date
            - "last_90_days" - Last 90 days from current date
            - "last_180_days" - Last 180 days from current date
            - "last_year" - Last 365 days from current date
            - "YYYY" - Full year (e.g., "2018", "2019", "2020", "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range (e.g., "2021-01-01:2021-12-31")
            - "QX YYYY" - Quarter (e.g., "Q1 2021", "Q4 2021")

            EXAMPLES FROM USER QUERIES:
            - "customer lifetime value for 2020" → time_period="2020"
            - "LTV for Q4 2021" → time_period="Q4 2021"
            - "lifetime value from Jan to March 2021" → time_period="2021-01-01:2021-03-31"
            - "calculate LTV for last 30 days" → time_period="last_30_days"
            - "customer lifetime value" (no date specified) → time_period="default"

        prediction_horizon: Months to predict into the future
        customer_segment: Optional segment to analyze
        include_forecast: Whether to include future predictions

    Returns:
        Formatted LTV analysis as a string with visualization tags.
    """

    # Initialize the sync service
    service = SyncCustomerLtvService()

    # Build filters
    filters = {}

    # Define data availability range (2018-2021)
    DATA_START = datetime(2018, 1, 1)
    DATA_END = datetime(2021, 12, 31)
    current_date = datetime.now()

    # Parse time period with date validation
    if time_period == "last_30_days":
        # Check if this is beyond our data range
        if current_date > DATA_END:
            return f"""<output>
# Customer Lifetime Value Analysis

## No Data Available for Last 30 Days

The requested time period (last 30 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2018-01-01 to 2021-12-31

To view LTV data, please:
- Specify a date range within 2018-2021
- Use the default view (full year 2021)
- Query specific historical periods

Example valid queries:
- "Calculate customer lifetime value" (defaults to full 2021)
- "LTV for June 2021"
- "Lifetime value from 2021-01-01 to 2021-03-31"
</output>
<is_visualisation>false</is_visualisation>"""
        else:
            filters['date_to'] = current_date.strftime('%Y-%m-%d')
            filters['date_from'] = (current_date - timedelta(days=30)).strftime('%Y-%m-%d')

    elif time_period == "last_90_days":
        if current_date > DATA_END:
            return f"""<output>
# Customer Lifetime Value Analysis

## No Data Available for Last 90 Days

The requested time period (last 90 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2018-01-01 to 2021-12-31

Please specify a date range within the available data or use the default view.
</output>
<is_visualisation>false</is_visualisation>"""
        else:
            filters['date_to'] = current_date.strftime('%Y-%m-%d')
            filters['date_from'] = (current_date - timedelta(days=90)).strftime('%Y-%m-%d')

    elif time_period == "last_180_days":
        if current_date > DATA_END:
            return f"""<output>
# Customer Lifetime Value Analysis

## No Data Available for Last 180 Days

The requested time period (last 180 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2018-01-01 to 2021-12-31

Please specify a date range within the available data or use the default view.
</output>
<is_visualisation>false</is_visualisation>"""
        else:
            filters['date_to'] = current_date.strftime('%Y-%m-%d')
            filters['date_from'] = (current_date - timedelta(days=180)).strftime('%Y-%m-%d')

    elif time_period == "last_year":
        if current_date > DATA_END:
            return f"""<output>
# Customer Lifetime Value Analysis

## No Data Available for Last Year

The requested time period (last year from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2018-01-01 to 2021-12-31

Please specify a date range within the available data or use the default view.
</output>
<is_visualisation>false</is_visualisation>"""
        else:
            filters['date_to'] = current_date.strftime('%Y-%m-%d')
            filters['date_from'] = (current_date - timedelta(days=365)).strftime('%Y-%m-%d')

    else:
        # Check for year only (e.g., "2018", "2019", "2020", "2021")
        if time_period and time_period.isdigit() and len(time_period) == 4:
            year = int(time_period)
            if year < 2018 or year > 2021:
                return f"""<output>
# Customer Lifetime Value Analysis

## No Data Available for {year}

The requested year ({year}) is outside our available data range.

**Available Data Range**: 2018-01-01 to 2021-12-31

Please specify a year between 2018 and 2021.
</output>
<is_visualisation>false</is_visualisation>"""
            filters['date_from'] = f'{year}-01-01'
            filters['date_to'] = f'{year}-12-31'

        # Check for date range with colon separator
        elif ':' in time_period:
            dates = time_period.split(':')
            filters['date_from'] = dates[0].strip()
            filters['date_to'] = dates[1].strip()

        # Check for quarter format (e.g., "Q1 2021")
        elif 'q' in time_period.lower():
            import re
            match = re.search(r'(q[1-4])\s*(\d{4})|(\d{4})\s*(q[1-4])', time_period.lower())
            if match:
                groups = match.groups()
                quarter = groups[0] or groups[3]
                year = int(groups[1] or groups[2])

                if year < 2018 or year > 2021:
                    return f"""<output>
# Customer Lifetime Value Analysis

## No Data Available for {quarter.upper()} {year}

The requested period is outside our available data range.

**Available Data Range**: 2018-01-01 to 2021-12-31
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
                    filters['date_from'] = f'{year}-{start}'
                    filters['date_to'] = f'{year}-{end}'

        # Default to 2017-2021 (consistent with all dashboards)
        elif time_period == "default" or not time_period:
            filters['date_from'] = '2017-01-01'
            filters['date_to'] = '2021-12-31'
        else:
            # Fallback for unrecognized format
            filters['date_from'] = '2017-01-01'
            filters['date_to'] = '2021-12-31'

    if customer_segment:
        filters['segments'] = [customer_segment]

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(filters)

        # Format the response
        output = []
        output.append("<output>")
        output.append("# Customer Lifetime Value Analysis")
        output.append(f"\nAnalysis Period: {filters.get('date_from')} to {filters.get('date_to')}")
        if customer_segment:
            output.append(f"Segment: {customer_segment}")
        output.append(f"Date Range: {filters.get('date_from', 'N/A')} to {filters.get('date_to', 'N/A')}")

        # Track metrics for visualization
        kpi_data = {}
        ltv_distribution = []
        top_customers = []

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            kpi_data = {
                'avgLTV': kpis.get('avgLtv', 0),  # Fixed: avgLTV → avgLtv (case)
                'totalLTV': kpis.get('totalValue', 0),  # Fixed: totalLTV → totalValue (API uses different key)
                'highValueCount': kpis.get('highValueCount', 0),
                'ltvGrowth': kpis.get('ltvGrowth', 0)
            }
            output.append(f"- Average LTV: ${kpi_data['avgLTV']:,.2f}")
            output.append(f"- Total LTV: ${kpi_data['totalLTV']:,.2f}")
            output.append(f"- High Value Customers: {kpi_data['highValueCount']:,}")
            output.append(f"- LTV Growth: {kpi_data['ltvGrowth']:.1f}%")

        # Add top customers by LTV
        if result.get('mlResults', {}).get('predictions'):
            predictions = result['mlResults']['predictions']

            # Sort by predicted LTV
            sorted_predictions = sorted(predictions, key=lambda x: x.get('predicted_ltv', 0), reverse=True)
            top_customers = sorted_predictions[:10]

            output.append("\n## Top 10 Customers by Predicted LTV")
            for i, customer in enumerate(top_customers, 1):
                output.append(f"{i}. {customer.get('customer_name', 'Unknown')} - ${customer.get('predicted_ltv', 0):,.2f} ({customer.get('ltv_percentile', 'N/A')})")

        # Add LTV distribution
        if result.get('mainData', {}).get('ltvDistribution'):
            ltv_distribution = result['mainData']['ltvDistribution'][:5]
            output.append("\n## LTV Distribution")
            for bucket in ltv_distribution:
                output.append(f"- {bucket.get('range', 'N/A')}: {bucket.get('count', 0):,} customers")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        # Add forecast if requested
        if include_forecast:
            output.append(f"\n## {prediction_horizon}-Month Forecast")
            output.append(f"Based on current trends and ML predictions, the total customer lifetime value is expected to grow by approximately {kpi_data.get('ltvGrowth', 0):.1f}% over the next {prediction_horizon} months.")

        # Add visualization metadata - using metadata-only approach like sales-performance
        output.append("\n## Visualization Data (Machine-Readable)")
        output.append("```json")

        # Build filter metadata for frontend to fetch data
        viz_data = {
            "toolname": "customer-lifetime-value",
            "componentName": "ltvDistribution",  # Primary component for LTV
            "body": {}
        }

        # Add time period filters
        if filters.get('dateRange'):
            viz_data["body"]["dateFrom"] = filters['dateRange'].get('startDate')
            viz_data["body"]["dateTo"] = filters['dateRange'].get('endDate')
        elif filters.get('date_from'):
            viz_data["body"]["dateFrom"] = filters.get('date_from')
            viz_data["body"]["dateTo"] = filters.get('date_to')

        # Add customer segment filter
        if customer_segment:
            viz_data["body"]["segment"] = customer_segment

        # Add prediction horizon
        if prediction_horizon:
            viz_data["body"]["predictionHorizon"] = prediction_horizon

        import json
        output.append(json.dumps(viz_data, indent=2))
        output.append("```")
        output.append("</output>")
        output.append("<is_visualisation>true</is_visualisation>")

        return "\n".join(output)

    except Exception as e:
        return f"""<output>
# Customer Lifetime Value Analysis Error

An error occurred while calculating customer lifetime value: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. ML model training status

For debugging, the error details are:
{str(e)}
</output>
<is_visualisation>false</is_visualisation>"""


# Alias for backward compatibility
predict_customer_ltv = calculate_customer_lifetime_value
