"""Sales performance tool for orchestration agent using sync processing service"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.sales.sales_performance.sync_processing_service import SyncSalesPerformanceProcessingService


def analyze_sales_performance(
    time_period: str = "default",
    region: Optional[str] = None,
    category: Optional[str] = None,
    product: Optional[str] = None
) -> str:
    """
    Analyze sales performance metrics and trends.

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Last 30 days (default)
            - "last_30_days" - Last 30 days
            - "last_90_days" - Last 90 days
            - "last_year" - Last 365 days
            - "YYYY" - Full year (e.g., "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range
            - "QX YYYY" - Quarter (e.g., "Q1 2021")
        region: Optional region to filter
        category: Optional category to filter
        product: Optional product to filter

    Returns:
        String containing the sales performance analysis report
    """
    # Initialize the sync wrapper for agent framework
    service = SyncSalesPerformanceProcessingService()

    # Build filters based on parameters
    filters = {}

    # Parse time period
    current_date = datetime.now()

    if time_period == "last_30_days" or time_period == "default":
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
    if region:
        filters['region'] = [region]
    if category:
        filters['category'] = [category]
    if product:
        filters['product'] = [product]

    try:
        # Get dashboard data
        data = service.get_dashboard_data(filters)

        # Extract components - data structure: { kpiMetrics: {...}, mainData: {...} }
        kpis = data.get('kpiMetrics', {})
        main_data = data.get('mainData', {})
        product_performance = main_data.get('productPerformance', [])
        region_performance = main_data.get('regionPerformance', [])
        sales_trends = main_data.get('salesTrends', [])
        category_performance = main_data.get('categoryPerformance', [])
        top_customers = main_data.get('topCustomers', [])

        # Format the results
        result = f"""# Sales Performance Analysis Report

## Analysis Period: {time_period}
{f"Region: {region}" if region else "All Regions"}
{f"Category: {category}" if category else "All Categories"}
{f"Product: {product}" if product else "All Products"}

## Key Performance Indicators

- **Total Revenue**: ${kpis.get('totalRevenue', 0):,.2f}
- **Total Units Sold**: {kpis.get('totalUnits', 0):,}
- **Average Order Value**: ${kpis.get('avgOrderValue', 0):,.2f}
- **Unique Customers**: {kpis.get('uniqueCustomers', 0):,}
- **Revenue Growth**: {kpis.get('revenueGrowth', 0):.1f}%
- **Conversion Rate**: {kpis.get('conversionRate', 0):.1f}%

## Top Products Performance

"""
        for idx, prod in enumerate(product_performance[:5], 1):
            result += f"{idx}. **{prod.get('productName', 'Unknown')}**\n"
            result += f"   - Category: {prod.get('category', 'N/A')}\n"
            result += f"   - Revenue: ${prod.get('revenue', 0):,.2f}\n"
            result += f"   - Units Sold: {prod.get('unitsSold', 0):,}\n"
            result += f"   - Average Price: ${prod.get('avgPrice', 0):,.2f}\n"
            result += f"   - Market Share: {prod.get('marketShare', 0):.1f}%\n\n"

        result += """## Regional Performance

"""
        for region_data in region_performance[:5]:
            result += f"**{region_data.get('regionName', 'Unknown')}**\n"
            result += f"  - Revenue: ${region_data.get('revenue', 0):,.2f}\n"
            result += f"  - Customers: {region_data.get('customerCount', 0):,}\n"
            result += f"  - Units: {region_data.get('units', 0):,}\n"
            result += f"  - Growth Rate: {region_data.get('growthRate', 0):.1f}%\n\n"

        result += """## Top Customers

"""
        for idx, cust in enumerate(top_customers[:5], 1):
            result += f"{idx}. **{cust.get('customerName', 'Unknown')}**\n"
            result += f"   - Segment: {cust.get('segment', 'N/A')}\n"
            result += f"   - Total Revenue: ${cust.get('totalRevenue', 0):,.2f}\n"
            result += f"   - Total Units: {cust.get('totalUnits', 0):,}\n"
            result += f"   - AOV: ${cust.get('avgOrderValue', 0):,.2f}\n\n"

        result += """## Recommendations

1. **Focus on Top Products**: The top 5 products contribute significantly to revenue
2. **Regional Expansion**: Consider expanding in high-growth regions
3. **Customer Retention**: Engage with top customers for retention
4. **Category Optimization**: Review category performance for optimization opportunities

---

## Visualization Data (Machine-Readable)

```json
"""
        # Add visualization metadata for enterprise-iq canvas
        viz_data = {
            "toolname": "sales-performance",
            "componentName": "overview",  # Can be: kpis, overview, timeSeries, distribution
            "body": {
                "dateFrom": filters.get('dateRange', {}).get('startDate') or filters.get('dateFrom'),
                "dateTo": filters.get('dateRange', {}).get('endDate') or filters.get('dateTo'),
            }
        }

        # Add other filters to metadata
        if region:
            viz_data["body"]["regions"] = [region]
        if category:
            viz_data["body"]["categories"] = [category]
        if product:
            viz_data["body"]["products"] = [product]

        import json
        result += json.dumps(viz_data, indent=2)
        result += """
```

---

**Note**: This analysis uses the same unified data source as the Sales Performance Dashboard, ensuring complete consistency between agent responses and dashboard visualizations.
"""

        return result

    except Exception as e:
        return f"""# Sales Performance Analysis Error

An error occurred while analyzing sales performance: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. Filter validity

Error details: {str(e)}
"""


# Test function
def test_sales_performance():
    """Test function to verify the sales performance tool is working."""
    try:
        result = analyze_sales_performance(
            time_period="last_30_days",
            region=None,
            category=None,
            product=None
        )
        print(result)
        return True
    except Exception as e:
        print(f"Test failed: {e}")
        return False


if __name__ == "__main__":
    # Run test when executed directly
    test_sales_performance()