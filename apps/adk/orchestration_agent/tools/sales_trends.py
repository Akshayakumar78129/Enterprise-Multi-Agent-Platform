"""Sales trends analysis tool for orchestration agent

This tool enables the AI agent to analyze sales trends, time series patterns,
seasonality, growth rates, and top performers across different dimensions.
"""

import json
from typing import List, Optional
from domains.sales_trends.processing_service import SalesTrendsProcessingService


def analyze_sales_trends(
    time_period: str = "default",
    granularity: str = "monthly",
    metric: str = "revenue",
    dimension: Optional[str] = None,
    customer_categories: List[str] = [],
    customer_regions: List[str] = [],
    items: List[str] = [],
    top_n: int = 10
) -> str:
    """Analyze sales trends with time series, seasonality, and growth patterns

    Args:
        time_period: Time period for analysis. Options:
            - "default" or empty: 2017-2021 (full dataset)
            - "2021": Specific year
            - "Q1 2021": Specific quarter
            - "Jan 2021": Specific month
            - "2020-2021": Year range
        granularity: Time granularity. Options: "daily", "weekly", "monthly", "quarterly", "annual"
        metric: Primary metric to analyze. Options: "revenue", "units", "aov", "margin"
        dimension: Optional dimension for top performers. Options: "product", "category", "region", "customer"
        customer_categories: Filter by customer categories (e.g., ["Retail", "Wholesale"])
        customer_regions: Filter by customer regions/states
        items: Filter by specific item names
        top_n: Number of top performers to return (default: 10)

    Returns:
        Text report with sales trends insights + metadata for visualization spawning

    Example:
        analyze_sales_trends(time_period="2021", granularity="monthly", metric="revenue", dimension="product", top_n=20)
    """

    # Initialize filters with defaults
    filters = {}

    # Handle time period
    if time_period == "default" or not time_period:
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    else:
        # Parse time_period string
        parsed_dates = _parse_time_period(time_period)
        filters.update(parsed_dates)

    # Add other filters
    filters['granularity'] = granularity
    filters['metric'] = metric
    if dimension:
        filters['dimension'] = dimension
    filters['topN'] = top_n

    if customer_categories:
        filters['customerCategory'] = customer_categories
    if customer_regions:
        filters['customerRegion'] = customer_regions
    if items:
        filters['itemName'] = items

    # Get data from processing service
    service = SalesTrendsProcessingService()

    # Run async method synchronously
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    data = loop.run_until_complete(service.get_dashboard_data(filters))

    # Generate text report for AI
    report = _generate_text_report(data, filters)

    # Create metadata-only visualization
    viz_metadata = {
        "toolname": "sales-trends",
        "componentName": "overview",  # Default to overview, agent can change to: kpis, timeSeries, seasonality, growthRates, topPerformers
        "body": {
            "dateFrom": filters.get('dateFrom'),
            "dateTo": filters.get('dateTo'),
            "granularity": filters.get('granularity'),
            "metric": filters.get('metric'),
            "dimension": filters.get('dimension'),
            "topN": filters.get('topN'),
            "customerCategory": filters.get('customerCategory', []),
            "customerRegion": filters.get('customerRegion', []),
            "itemName": filters.get('itemName', [])
        }
    }

    # Format output with text report + visualization metadata
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


def _parse_time_period(time_period: str) -> dict:
    """Parse time period string into dateFrom/dateTo"""

    filters = {}

    # Handle year range: "2020-2021"
    if '-' in time_period and len(time_period.split('-')) == 2:
        parts = time_period.split('-')
        if len(parts[0]) == 4 and len(parts[1]) == 4:
            filters['dateFrom'] = f'{parts[0]}-01-01'
            filters['dateTo'] = f'{parts[1]}-12-31'
            return filters

    # Handle specific year: "2021"
    if len(time_period) == 4 and time_period.isdigit():
        filters['dateFrom'] = f'{time_period}-01-01'
        filters['dateTo'] = f'{time_period}-12-31'
        return filters

    # Handle quarter: "Q1 2021", "Q2 2021"
    if time_period.startswith('Q') and len(time_period.split()) == 2:
        quarter_str, year = time_period.split()
        quarter = int(quarter_str[1])

        quarter_months = {
            1: ('01-01', '03-31'),
            2: ('04-01', '06-30'),
            3: ('07-01', '09-30'),
            4: ('10-01', '12-31')
        }

        if quarter in quarter_months:
            start, end = quarter_months[quarter]
            filters['dateFrom'] = f'{year}-{start}'
            filters['dateTo'] = f'{year}-{end}'
            return filters

    # Handle month: "Jan 2021", "January 2021"
    month_map = {
        'jan': '01', 'january': '01',
        'feb': '02', 'february': '02',
        'mar': '03', 'march': '03',
        'apr': '04', 'april': '04',
        'may': '05',
        'jun': '06', 'june': '06',
        'jul': '07', 'july': '07',
        'aug': '08', 'august': '08',
        'sep': '09', 'september': '09',
        'oct': '10', 'october': '10',
        'nov': '11', 'november': '11',
        'dec': '12', 'december': '12'
    }

    for month_name, month_num in month_map.items():
        if time_period.lower().startswith(month_name):
            year = time_period.split()[-1]
            if year.isdigit() and len(year) == 4:
                # Get last day of month
                import calendar
                last_day = calendar.monthrange(int(year), int(month_num))[1]
                filters['dateFrom'] = f'{year}-{month_num}-01'
                filters['dateTo'] = f'{year}-{month_num}-{last_day}'
                return filters

    # Default fallback
    filters['dateFrom'] = '2017-01-01'
    filters['dateTo'] = '2021-12-31'
    return filters


def _generate_text_report(data: dict, filters: dict) -> str:
    """Generate text report from sales trends data"""

    kpis = data.get('kpiMetrics', {})
    main_data = data.get('mainData', {})
    insights = data.get('insights', [])
    metadata = data.get('metadata', {})

    # Extract key metrics
    total_revenue = kpis.get('totalRevenue', 0)
    total_units = kpis.get('totalUnits', 0)
    avg_order_value = kpis.get('avgOrderValue', 0)
    margin_pct = kpis.get('marginPercentage', 0)
    revenue_growth = kpis.get('revenueGrowth', 0)
    transaction_count = kpis.get('transactionCount', 0)

    # Time series data
    time_series = main_data.get('timeSeries', [])
    seasonality = main_data.get('seasonality', [])
    growth_rates = main_data.get('growthRates', [])
    top_performers = main_data.get('topPerformers', [])

    # Build report
    report_lines = []
    report_lines.append("# Sales Trends Analysis Report")
    report_lines.append("")

    # Date range
    date_range = metadata.get('dateRange', {})
    report_lines.append(f"**Analysis Period:** {date_range.get('from', 'N/A')} to {date_range.get('to', 'N/A')}")
    report_lines.append(f"**Granularity:** {filters.get('granularity', 'monthly').title()}")
    report_lines.append(f"**Primary Metric:** {filters.get('metric', 'revenue').title()}")
    report_lines.append("")

    # Key Performance Indicators
    report_lines.append("## Key Performance Indicators")
    report_lines.append("")
    report_lines.append(f"- **Total Revenue:** ${total_revenue:,.2f}")
    report_lines.append(f"- **Total Units Sold:** {total_units:,.0f}")
    report_lines.append(f"- **Average Order Value:** ${avg_order_value:,.2f}")
    report_lines.append(f"- **Profit Margin:** {margin_pct:.1f}%")
    report_lines.append(f"- **Revenue Growth:** {revenue_growth:+.1f}%")
    report_lines.append(f"- **Transaction Count:** {transaction_count:,.0f}")
    report_lines.append("")

    # Time series summary
    if time_series:
        report_lines.append("## Time Series Trends")
        report_lines.append("")
        report_lines.append(f"- **Total Periods Analyzed:** {len(time_series)}")

        # Calculate trend direction
        if len(time_series) > 1:
            first_revenue = time_series[0].get('revenue', 0)
            last_revenue = time_series[-1].get('revenue', 0)
            if first_revenue > 0:
                overall_trend = ((last_revenue - first_revenue) / first_revenue * 100)
                trend_direction = "↗️ Increasing" if overall_trend > 0 else "↘️ Decreasing"
                report_lines.append(f"- **Overall Trend:** {trend_direction} ({overall_trend:+.1f}%)")
        report_lines.append("")

    # Growth rate analysis
    if growth_rates:
        growth_values = [gr.get('growthRate', 0) for gr in growth_rates if gr.get('growthRate') is not None]
        if growth_values:
            avg_growth = sum(growth_values) / len(growth_values)
            max_growth = max(growth_values)
            min_growth = min(growth_values)

            report_lines.append("## Growth Rate Analysis")
            report_lines.append("")
            report_lines.append(f"- **Average Growth Rate:** {avg_growth:.1f}%")
            report_lines.append(f"- **Peak Growth Period:** {max_growth:+.1f}%")
            report_lines.append(f"- **Lowest Growth Period:** {min_growth:+.1f}%")
            report_lines.append("")

    # Seasonality insights
    if seasonality and len(seasonality) >= 12:
        report_lines.append("## Seasonality Patterns")
        report_lines.append("")

        # Group by month to find patterns
        month_totals = {}
        for point in seasonality:
            month = point.get('month', '')
            revenue = point.get('revenue', 0)
            if month not in month_totals:
                month_totals[month] = []
            month_totals[month].append(revenue)

        # Find peak and low months
        month_avgs = {month: sum(values)/len(values) for month, values in month_totals.items()}
        if month_avgs:
            peak_month = max(month_avgs, key=month_avgs.get)
            low_month = min(month_avgs, key=month_avgs.get)

            month_names = {
                '01': 'January', '02': 'February', '03': 'March', '04': 'April',
                '05': 'May', '06': 'June', '07': 'July', '08': 'August',
                '09': 'September', '10': 'October', '11': 'November', '12': 'December'
            }

            report_lines.append(f"- **Peak Season:** {month_names.get(peak_month, peak_month)} (Avg: ${month_avgs[peak_month]:,.0f})")
            report_lines.append(f"- **Low Season:** {month_names.get(low_month, low_month)} (Avg: ${month_avgs[low_month]:,.0f})")

            # Calculate seasonality strength
            max_avg = month_avgs[peak_month]
            min_avg = month_avgs[low_month]
            avg_all = sum(month_avgs.values()) / len(month_avgs)
            if avg_all > 0:
                seasonality_strength = ((max_avg - min_avg) / avg_all * 100)
                report_lines.append(f"- **Seasonality Strength:** {seasonality_strength:.0f}% variance")
        report_lines.append("")

    # Top performers
    if top_performers:
        dimension = filters.get('dimension', 'item')
        report_lines.append(f"## Top Performers (by {dimension.title()})")
        report_lines.append("")

        for i, performer in enumerate(top_performers[:5], 1):
            name = performer.get('name', 'Unknown')
            revenue = performer.get('revenue', 0)
            units = performer.get('units', 0)
            market_share = performer.get('marketShare', 0)

            report_lines.append(f"{i}. **{name}**")
            report_lines.append(f"   - Revenue: ${revenue:,.2f} ({market_share:.1f}% share)")
            report_lines.append(f"   - Units: {units:,.0f}")
        report_lines.append("")

    # Strategic Insights
    if insights:
        report_lines.append("## Strategic Insights & Recommendations")
        report_lines.append("")

        for insight in insights:
            message = insight.get('message', '')
            priority = insight.get('priority', 'INFO')
            report_lines.append(f"**[{priority}]** {message}")
            report_lines.append("")

    return "\n".join(report_lines)
