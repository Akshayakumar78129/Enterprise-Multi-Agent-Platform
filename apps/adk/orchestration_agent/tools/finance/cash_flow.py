"""Cash flow analysis tool for orchestration agent using sync processing service"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.finance.cash_flow.sync_processing_service import SyncCashFlowProcessingService


def analyze_cash_flow(
    time_period: str = "default",
    cash_flow_type: str = "all",
    region: Optional[str] = None,
    min_amount: Optional[float] = None
) -> str:
    """
    Analyze cash flow patterns and trends with operating, investing, and financing breakdowns.

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Default range 2017-2021 (recommended)
            - "last_30_days" - Last 30 days
            - "last_90_days" - Last 90 days
            - "last_year" - Last 365 days
            - "YYYY" - Full year (e.g., "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range
            - "QX YYYY" - Quarter (e.g., "Q1 2021")
        cash_flow_type: Type of cash flow to analyze:
            - "all" - All cash flow types (default)
            - "operating" - Operating activities only
            - "investing" - Investing activities only
            - "financing" - Financing activities only
        region: Optional region to filter
        min_amount: Optional minimum transaction amount filter

    Returns:
        String containing the cash flow analysis report with visualization metadata
    """
    # Initialize the sync wrapper for agent framework
    service = SyncCashFlowProcessingService()

    # Build filters based on parameters
    filters = {}

    # Parse time period
    current_date = datetime.now()

    # Default to 2017-2021 for consistency with other dashboards
    if time_period == "default":
        filters['dateRange'] = {
            'startDate': '2017-01-01',
            'endDate': '2021-12-31'
        }
    elif time_period == "last_30_days":
        filters['dateRange'] = {
            'endDate': current_date.strftime('%Y-%m-%d'),
            'startDate': (current_date - timedelta(days=30)).strftime('%Y-%m-%d')
        }
    elif time_period == "last_90_days":
        filters['dateRange'] = {
            'endDate': current_date.strftime('%Y-%m-%d'),
            'startDate': (current_date - timedelta(days=90)).strftime('%Y-%m-%d')
        }
    elif time_period == "last_year":
        filters['dateRange'] = {
            'endDate': current_date.strftime('%Y-%m-%d'),
            'startDate': (current_date - timedelta(days=365)).strftime('%Y-%m-%d')
        }
    elif time_period and time_period.isdigit() and len(time_period) == 4:
        # Year format
        year = int(time_period)
        filters['dateRange'] = {
            'startDate': f'{year}-01-01',
            'endDate': f'{year}-12-31'
        }
    elif ':' in time_period:
        # Date range format
        parts = time_period.split(':')
        if len(parts) == 2:
            filters['dateRange'] = {
                'startDate': parts[0].strip(),
                'endDate': parts[1].strip()
            }
    elif 'q' in time_period.lower():
        # Quarter format
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
                filters['dateRange'] = {
                    'startDate': f'{year}-{start}',
                    'endDate': f'{year}-{end}'
                }

    # Add other filters
    if cash_flow_type and cash_flow_type != "all":
        filters['cashFlowType'] = cash_flow_type
    if region:
        filters['regions'] = [region]
    if min_amount is not None:
        filters['minAmount'] = min_amount

    try:
        # Get dashboard data
        data = service.get_dashboard_data(filters)

        # Extract components - data structure: { kpiMetrics: {...}, mainData: {...} }
        kpis = data.get('kpiMetrics', {})
        main_data = data.get('mainData', {})
        trends = main_data.get('trends', [])
        operating = main_data.get('operating', [])
        investing = main_data.get('investing', [])
        financing = main_data.get('financing', [])
        projection = main_data.get('projection', [])

        # Format the results
        result = f"""# Cash Flow Analysis Report

<output>

## Analysis Period: {time_period}
{f"Cash Flow Type: {cash_flow_type.title()}" if cash_flow_type != "all" else "All Cash Flow Types"}
{f"Region: {region}" if region else "All Regions"}
{f"Minimum Amount Filter: ${min_amount:,.2f}" if min_amount else ""}

## Key Cash Flow Metrics

- **Net Cash Flow**: ${kpis.get('netCashFlow', 0):,.2f}
- **Operating Cash Flow**: ${kpis.get('operatingCashFlow', 0):,.2f}
- **Investing Cash Flow**: ${kpis.get('investingCashFlow', 0):,.2f}
- **Financing Cash Flow**: ${kpis.get('financingCashFlow', 0):,.2f}
- **Cash Ratio**: {kpis.get('cashRatio', 0):.2f}
- **Free Cash Flow**: ${kpis.get('freeCashFlow', 0):,.2f}

## Operating Cash Flow Breakdown

"""
        for idx, op in enumerate(operating[:5], 1):
            result += f"{idx}. **{op.get('category', 'Unknown')}**\n"
            result += f"   - Inflow: ${op.get('inflow', 0):,.2f}\n"
            result += f"   - Outflow: ${op.get('outflow', 0):,.2f}\n"
            result += f"   - Net: ${op.get('net', 0):,.2f}\n\n"

        result += """## Investing Activities

"""
        for idx, inv in enumerate(investing, 1):
            flow_type = "🔴 Outflow" if inv.get('type') == 'outflow' else "🟢 Inflow"
            result += f"{idx}. **{inv.get('category', 'Unknown')}** - {flow_type}\n"
            result += f"   - Amount: ${abs(inv.get('amount', 0)):,.2f}\n\n"

        result += """## Financing Activities

"""
        for idx, fin in enumerate(financing, 1):
            flow_type = "🔴 Outflow" if fin.get('type') == 'outflow' else "🟢 Inflow"
            result += f"{idx}. **{fin.get('category', 'Unknown')}** - {flow_type}\n"
            result += f"   - Amount: ${abs(fin.get('amount', 0)):,.2f}\n\n"

        result += """## Cash Flow Trends

"""
        # Show recent trends (last 6 months)
        recent_trends = trends[-6:] if len(trends) > 6 else trends
        for trend in recent_trends:
            result += f"**{trend.get('date', 'N/A')}**\n"
            result += f"  - Operating: ${trend.get('operating', 0):,.2f}\n"
            result += f"  - Investing: ${trend.get('investing', 0):,.2f}\n"
            result += f"  - Financing: ${trend.get('financing', 0):,.2f}\n"
            result += f"  - Net: ${trend.get('net', 0):,.2f}\n\n"

        result += """## Recommendations

1. **Operating Cash Flow**: """
        if kpis.get('operatingCashFlow', 0) > 0:
            result += "Strong operating cash flow indicates healthy core business operations\n"
        else:
            result += "Consider optimizing operations to improve cash generation\n"

        result += """2. **Free Cash Flow**: """
        if kpis.get('freeCashFlow', 0) > 0:
            result += "Positive free cash flow available for growth and distributions\n"
        else:
            result += "Focus on improving operational efficiency to generate positive free cash flow\n"

        result += """3. **Cash Ratio**: """
        if kpis.get('cashRatio', 0) > 1.5:
            result += "Strong liquidity position with good coverage\n"
        else:
            result += "Monitor cash levels to ensure adequate liquidity\n"

        result += """
---

</output>

<is_visualisation>true</is_visualisation>

## Visualization Data (Machine-Readable)

```json
"""
        # Add visualization metadata for enterprise-iq canvas
        viz_data = {
            "toolname": "cash-flow",
            "componentName": "kpis",  # Can be: kpis, trends, operating, investing, financing, projection, table
            "body": {
                "dateFrom": filters.get('dateRange', {}).get('startDate') or filters.get('dateFrom'),
                "dateTo": filters.get('dateRange', {}).get('endDate') or filters.get('dateTo'),
            }
        }

        # Add other filters to metadata
        if cash_flow_type and cash_flow_type != "all":
            viz_data["body"]["cashFlowType"] = cash_flow_type
        if region:
            viz_data["body"]["regions"] = [region]
        if min_amount is not None:
            viz_data["body"]["minAmount"] = min_amount

        result += json.dumps(viz_data, indent=2)
        result += """
```

---

**Note**: This analysis uses the same unified data source as the Cash Flow Dashboard, ensuring complete consistency between agent responses and dashboard visualizations.
"""

        return result

    except Exception as e:
        return f"""# Cash Flow Analysis Error

<output>

An error occurred while analyzing cash flow: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. Filter validity

Error details: {str(e)}

</output>
"""


# Test function
def test_cash_flow_analysis():
    """Test function to verify the cash flow analysis tool is working."""
    try:
        result = analyze_cash_flow(
            time_period="default",
            cash_flow_type="all",
            region=None,
            min_amount=None
        )
        print(result)
        return True
    except Exception as e:
        print(f"Test failed: {e}")
        return False


if __name__ == "__main__":
    # Run test when executed directly
    test_cash_flow_analysis()
