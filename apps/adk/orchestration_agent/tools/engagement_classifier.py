"""Customer engagement classification tool using shared processing service"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.engagement_classifier.sync_processing_service import SyncEngagementClassifierService


def classify_customer_engagement(
    time_period: str = "default",
    engagement_threshold: str = "medium",
    include_recommendations: bool = True,
    customer_segment: Optional[str] = None
) -> str:
    """
    Classify customer engagement levels using ML models.

    IMPORTANT: Parse the user's date request and pass it in time_period!

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Uses full data range 2017-2021 (default if not specified)
            - "last_30_days" - Last 30 days from current date
            - "last_90_days" - Last 90 days from current date
            - "last_180_days" - Last 180 days from current date
            - "last_year" - Last 365 days from current date
            - "YYYY" - Full year (e.g., "2018", "2019", "2020", "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range (e.g., "2021-01-01:2021-12-31")
            - "QX YYYY" - Quarter (e.g., "Q1 2021", "Q4 2021")

            EXAMPLES FROM USER QUERIES:
            - "engagement levels for 2020" → time_period="2020"
            - "engagement for Q4 2021" → time_period="Q4 2021"
            - "engagement from Jan to March 2021" → time_period="2021-01-01:2021-03-31"
            - "analyze engagement for last 30 days" → time_period="last_30_days"
            - "customer engagement" (no date specified) → time_period="default"

        engagement_threshold: Minimum engagement level (low, medium, high)
        include_recommendations: Whether to include action recommendations
        customer_segment: Optional segment to analyze

    Returns:
        Formatted engagement classification as a string with visualization tags.
    """

    # Initialize the sync service
    service = SyncEngagementClassifierService()

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
# Customer Engagement Classification

## No Data Available for Last 30 Days

The requested time period (last 30 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

To view engagement data, please:
- Specify a date range within 2018-2021
- Use the default view (full year 2021)
- Query specific historical periods

Example valid queries:
- "Show customer engagement" (defaults to full 2021)
- "Engagement levels for June 2021"
- "Engagement from 2021-01-01 to 2021-03-31"
</output>
<is_visualisation>false</is_visualisation>"""
        else:
            filters['date_to'] = current_date.strftime('%Y-%m-%d')
            filters['date_from'] = (current_date - timedelta(days=30)).strftime('%Y-%m-%d')

    elif time_period == "last_90_days":
        if current_date > DATA_END:
            return f"""<output>
# Customer Engagement Classification

## No Data Available for Last 90 Days

The requested time period (last 90 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

Please specify a date range within the available data or use the default view.
</output>
<is_visualisation>false</is_visualisation>"""
        else:
            filters['date_to'] = current_date.strftime('%Y-%m-%d')
            filters['date_from'] = (current_date - timedelta(days=90)).strftime('%Y-%m-%d')

    elif time_period == "last_180_days":
        if current_date > DATA_END:
            return f"""<output>
# Customer Engagement Classification

## No Data Available for Last 180 Days

The requested time period (last 180 days from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

Please specify a date range within the available data or use the default view.
</output>
<is_visualisation>false</is_visualisation>"""
        else:
            filters['date_to'] = current_date.strftime('%Y-%m-%d')
            filters['date_from'] = (current_date - timedelta(days=180)).strftime('%Y-%m-%d')

    elif time_period == "last_year":
        if current_date > DATA_END:
            return f"""<output>
# Customer Engagement Classification

## No Data Available for Last Year

The requested time period (last year from {current_date.strftime('%Y-%m-%d')}) is beyond our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

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
            if year < 2017 or year > 2021:
                return f"""<output>
# Customer Engagement Classification

## No Data Available for {year}

The requested year ({year}) is outside our available data range.

**Available Data Range**: 2017-01-01 to 2021-12-31

Please specify a year between 2017 and 2021.
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

                if year < 2017 or year > 2021:
                    return f"""<output>
# Customer Engagement Classification

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
                    filters['date_from'] = f'{year}-{start}'
                    filters['date_to'] = f'{year}-{end}'

        # Default to full data range 2017-2021
        elif time_period == "default" or not time_period:
            filters['date_from'] = '2017-01-01'
            filters['date_to'] = '2021-12-31'
        else:
            # Fallback for unrecognized format - use full data range
            filters['date_from'] = '2017-01-01'
            filters['date_to'] = '2021-12-31'

    filters['engagement_threshold'] = engagement_threshold

    if customer_segment:
        filters['segments'] = [customer_segment]

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(filters)

        # Format the response
        output = []
        output.append("<output>")
        output.append("# Customer Engagement Classification")
        output.append(f"\nAnalysis Period: {filters.get('date_from')} to {filters.get('date_to')}")
        if customer_segment:
            output.append(f"Segment: {customer_segment}")
        output.append(f"Date Range: {filters.get('date_from', 'N/A')} to {filters.get('date_to', 'N/A')}")

        # Track metrics for visualization
        kpi_data = {}
        engagement_dist = {}
        total_customers = 0

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            kpi_data = {
                'highlyEngaged': kpis.get('highlyEngaged', 0),
                'atRiskCount': kpis.get('atRiskCount', 0),
                'avgEngagementScore': kpis.get('avgEngagementScore', 0),
                'engagementTrend': kpis.get('engagementTrend', 0)
            }
            output.append(f"- Highly Engaged Customers: {kpi_data['highlyEngaged']:,}")
            output.append(f"- At Risk Customers: {kpi_data['atRiskCount']:,}")
            output.append(f"- Average Engagement Score: {kpi_data['avgEngagementScore']:.1f}/100")
            output.append(f"- Engagement Trend: {'+' if kpi_data['engagementTrend'] > 0 else ''}{kpi_data['engagementTrend']:.1f}%")

        # Add engagement distribution
        if result.get('mlResults', {}).get('engagement_distribution'):
            output.append("\n## Engagement Distribution")
            engagement_dist = result['mlResults']['engagement_distribution']
            for level, count in engagement_dist.items():
                output.append(f"- {level}: {count:,} customers")
                total_customers += count

        # Add at-risk customers
        at_risk_customers = []
        if result.get('mlResults', {}).get('at_risk_customers'):
            at_risk_customers = result['mlResults']['at_risk_customers'][:10]
            output.append("\n## At-Risk Customers (Top 10)")
            for i, customer in enumerate(at_risk_customers, 1):
                output.append(f"{i}. {customer.get('customer_name', 'Unknown')} - Score: {customer.get('engagement_score', 0):.1f}")

        # Add recommendations if requested
        if include_recommendations:
            output.append("\n## Recommended Actions")
            output.append("- **For Highly Engaged**: Implement loyalty programs and exclusive offers")
            output.append("- **For Medium Engaged**: Increase touchpoints through personalized communications")
            output.append("- **For Low Engaged**: Re-engagement campaigns with incentives")
            output.append("- **For At-Risk**: Immediate intervention with retention offers")

        # Add insights
        if result.get('insights'):
            output.append("\n## Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        # Add visualization metadata
        output.append("\n## Visualization Data (Machine-Readable)")
        output.append("```json")

        # Build visualization data based on what we have
        viz_data = {
            "kpiTiles": [
                {
                    "title": "Highly Engaged",
                    "value": kpi_data.get('highlyEngaged', 0),
                    "unit": "customers",
                    "trend": "up" if kpi_data.get('engagementTrend', 0) > 0 else "down",
                    "color": "#10b981"
                },
                {
                    "title": "At Risk",
                    "value": kpi_data.get('atRiskCount', 0),
                    "unit": "customers",
                    "color": "#ef4444"
                },
                {
                    "title": "Avg Engagement",
                    "value": round(kpi_data.get('avgEngagementScore', 0), 1),
                    "unit": "/100",
                    "color": "#8b5cf6"
                },
                {
                    "title": "Trend",
                    "value": round(kpi_data.get('engagementTrend', 0), 1),
                    "unit": "%",
                    "trend": "up" if kpi_data.get('engagementTrend', 0) > 0 else "down",
                    "color": "#f59e0b"
                }
            ]
        }

        # Add engagement pyramid if we have distribution data
        if engagement_dist:
            viz_data["pyramid"] = [
                {
                    "level": "Highly Engaged",
                    "count": engagement_dist.get('Highly Engaged', engagement_dist.get('high', 0)),
                    "percentage": round(engagement_dist.get('Highly Engaged', engagement_dist.get('high', 0)) / total_customers * 100, 1) if total_customers > 0 else 0,
                    "color": "#10b981"
                },
                {
                    "level": "Medium Engaged",
                    "count": engagement_dist.get('Medium Engaged', engagement_dist.get('medium', 0)),
                    "percentage": round(engagement_dist.get('Medium Engaged', engagement_dist.get('medium', 0)) / total_customers * 100, 1) if total_customers > 0 else 0,
                    "color": "#f59e0b"
                },
                {
                    "level": "Low Engaged",
                    "count": engagement_dist.get('Low Engaged', engagement_dist.get('low', 0)),
                    "percentage": round(engagement_dist.get('Low Engaged', engagement_dist.get('low', 0)) / total_customers * 100, 1) if total_customers > 0 else 0,
                    "color": "#eab308"
                },
                {
                    "level": "At Risk",
                    "count": engagement_dist.get('At Risk', engagement_dist.get('at_risk', 0)),
                    "percentage": round(engagement_dist.get('At Risk', engagement_dist.get('at_risk', 0)) / total_customers * 100, 1) if total_customers > 0 else 0,
                    "color": "#ef4444"
                }
            ]

        # Add customer opportunities if we have at-risk data
        if at_risk_customers:
            viz_data["opportunityFinder"] = [
                {
                    "customer_name": c.get('customer_name', 'Unknown'),
                    "customer_id": c.get('customer_id', 'N/A'),
                    "engagement_score": round(c.get('engagement_score', 0), 1),
                    "risk_level": "at_risk",
                    "recommended_action": "Immediate intervention with retention offers"
                }
                for c in at_risk_customers[:5]
            ]

        # Add timeline placeholder (would need real trend data)
        viz_data["timeline"] = {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "datasets": [
                {
                    "label": "Engagement Score",
                    "data": [],  # Would be populated with real trend data
                    "borderColor": "#8b5cf6"
                }
            ]
        }

        import json
        output.append(json.dumps(viz_data, indent=2))
        output.append("```")
        output.append("</output>")
        output.append("<is_visualisation>true</is_visualisation>")

        return "\n".join(output)

    except Exception as e:
        return f"""<output>
# Customer Engagement Classification Error

An error occurred while analyzing customer engagement: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. ML model training status

For debugging, the error details are:
{str(e)}
</output>
<is_visualisation>false</is_visualisation>"""
