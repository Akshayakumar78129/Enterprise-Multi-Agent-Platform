"""Product performance tool for orchestration agent using sync processing service"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.sales.product_performance.sync_processing_service import SyncProductPerformanceProcessingService


def analyze_product_performance(
    time_period: str = "default",
    category: Optional[str] = None,
    product: Optional[str] = None,
    min_margin: Optional[float] = None
) -> str:
    """
    Analyze product performance metrics including sales, margins, and categories.

    IMPORTANT: Use "default" or date range format "2017-01-01:2021-12-31" for multi-year analysis.
    Do NOT call this tool multiple times for different years - use a single call with date range.

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Full historical data 2017-2021 (RECOMMENDED for multi-year analysis)
            - "last_30_days" - Last 30 days
            - "last_90_days" - Last 90 days
            - "last_year" - Last 365 days
            - "YYYY" - Full year (e.g., "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range (e.g., "2017-01-01:2021-12-31")
            - "QX YYYY" - Quarter (e.g., "Q1 2021")
        category: Optional category name to filter (e.g., "Bikes", "Cargo")
        product: Optional product name to filter
        min_margin: Minimum margin percentage to filter (e.g., 30.0 for products with >30% margin)

    Returns:
        String containing the product performance analysis report with KPIs and visualization metadata

    Examples:
        - analyze_product_performance("default") - Full 2017-2021 analysis
        - analyze_product_performance("2021") - Single year
        - analyze_product_performance("default", category="Bikes") - Bikes category 2017-2021
        - analyze_product_performance("default", min_margin=30.0) - High-margin products
    """
    # Initialize the sync wrapper for agent framework
    service = SyncProductPerformanceProcessingService()

    # Build filters based on parameters
    filters = {}

    # Parse time period
    current_date = datetime.now()

    if time_period == "last_30_days":
        filters['dateFrom'] = (current_date - timedelta(days=30)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
    elif time_period == "last_90_days":
        filters['dateFrom'] = (current_date - timedelta(days=90)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
    elif time_period == "last_year":
        filters['dateFrom'] = (current_date - timedelta(days=365)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
    elif time_period == "default" or not time_period:
        # Default to 2017-2021 for consistency with all dashboards
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    elif time_period and time_period.isdigit() and len(time_period) == 4:
        # Year format
        year = int(time_period)
        filters['dateFrom'] = f'{year}-01-01'
        filters['dateTo'] = f'{year}-12-31'
    elif ':' in time_period:
        # Date range format
        parts = time_period.split(':')
        if len(parts) == 2:
            filters['dateFrom'] = parts[0].strip()
            filters['dateTo'] = parts[1].strip()
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
                filters['dateFrom'] = f'{year}-{start}'
                filters['dateTo'] = f'{year}-{end}'

    # Add other filters
    if category:
        filters['categories'] = [category]
    if product:
        filters['products'] = [product]
    if min_margin is not None:
        filters['minMargin'] = min_margin

    try:
        # Get dashboard data
        data = service.get_dashboard_data(filters)

        # Extract components
        kpis = data.get('kpiMetrics', {})
        main_data = data.get('mainData', {})
        insights = data.get('insights', [])

        top_products = main_data.get('topProducts', [])
        category_performance = main_data.get('categoryPerformance', [])
        margin_analysis = main_data.get('marginAnalysis', [])
        price_bands = main_data.get('priceBandDistribution', [])

        # Format the results
        result = f"""# Product Performance Analysis Report

## Analysis Period: {time_period}
{f"Category Filter: {category}" if category else "All Categories"}
{f"Product Filter: {product}" if product else "All Products"}
{f"Minimum Margin: {min_margin}%" if min_margin else ""}

## Key Performance Indicators

- **Total Revenue**: ${kpis.get('totalRevenue', 0):,.2f}
- **Total Units Sold**: {kpis.get('totalUnits', 0):,}
- **Average Price**: ${kpis.get('avgPrice', 0):,.2f}
- **Average Margin**: {kpis.get('avgMargin', 0):.1f}%
- **Top Category**: {kpis.get('topCategory', {}).get('name', 'N/A')} (${kpis.get('topCategory', {}).get('revenue', 0):,.2f})
- **Total Products**: {kpis.get('totalProducts', 0)}

## Top Performing Products

"""
        for idx, prod in enumerate(top_products[:5], 1):
            result += f"{idx}. **{prod.get('productName', 'Unknown')}**\n"
            result += f"   - Category: {prod.get('category', 'N/A')}\n"
            result += f"   - Revenue: ${prod.get('revenue', 0):,.2f}\n"
            result += f"   - Units Sold: {prod.get('unitsSold', 0):,}\n"
            result += f"   - Average Price: ${prod.get('avgPrice', 0):,.2f}\n"
            result += f"   - Margin: {prod.get('marginPercent', 0):.1f}%\n\n"

        result += """## Category Performance

"""
        for cat in category_performance[:5]:
            result += f"**{cat.get('category', 'Unknown')}**\n"
            result += f"  - Revenue: ${cat.get('revenue', 0):,.2f}\n"
            result += f"  - Products: {cat.get('productCount', 0)}\n"
            result += f"  - Units: {cat.get('unitsSold', 0):,}\n"
            result += f"  - Avg Price: ${cat.get('avgPrice', 0):,.2f}\n\n"

        result += """## Margin Analysis (Top 5 by Margin)

"""
        for idx, item in enumerate(margin_analysis[:5], 1):
            result += f"{idx}. **{item.get('productName', 'Unknown')}**\n"
            result += f"   - Margin: {item.get('marginPercent', 0):.1f}% (${item.get('totalMargin', 0):,.2f})\n"
            result += f"   - Revenue: ${item.get('revenue', 0):,.2f}\n"
            result += f"   - Avg Price: ${item.get('avgPrice', 0):,.2f} | Avg Cost: ${item.get('avgCost', 0):,.2f}\n\n"

        if price_bands:
            result += """## Price Band Distribution

"""
            for band in price_bands:
                result += f"**{band.get('name', 'Unknown')}**: {band.get('count', 0)} products (${band.get('revenue', 0):,.2f})\n"

        result += """

## Key Insights

"""
        for insight in insights:
            result += f"- {insight}\n"

        result += """

## Recommendations

1. **High Margin Products**: Focus marketing on products with >30% margins
2. **Category Optimization**: Expand top-performing categories
3. **Pricing Strategy**: Review low-margin products for price increases or cost reductions
4. **Product Mix**: Consider discontinuing products with consistently low performance

## Data Consistency Note

This analysis uses the same data source as the Product Performance Dashboard,
ensuring complete consistency between agent responses and dashboard visualizations.

## Visualization Data (Machine-Readable)

```json
{
  "toolname": "product-performance",
  "componentName": "overview",
  "body": {
    "dateFrom": """ + json.dumps(filters.get('dateFrom')) + """,
    "dateTo": """ + json.dumps(filters.get('dateTo')) + """
""" + (f""",
    "categories": {json.dumps(filters.get('categories'))}""" if filters.get('categories') else "") + """
""" + (f""",
    "products": {json.dumps(filters.get('products'))}""" if filters.get('products') else "") + """
""" + (f""",
    "minMargin": {filters.get('minMargin')}""" if filters.get('minMargin') is not None else "") + """
  }
}
```
</output>
<is_visualisation>true</is_visualisation>
"""

        return result

    except Exception as e:
        return f"""<output>
# Product Performance Analysis Error

An error occurred while analyzing product performance: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. Filter validity

Error details: {str(e)}
</output>
<is_visualisation>false</is_visualisation>
"""


# Test function
def test_product_performance():
    """Test function to verify the product performance tool is working."""
    try:
        result = analyze_product_performance(
            time_period="last_90_days",
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
    test_product_performance()
