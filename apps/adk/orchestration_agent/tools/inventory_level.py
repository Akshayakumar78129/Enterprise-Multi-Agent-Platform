"""Inventory level analysis tool for orchestration agent using sync processing service"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.inventory_level.sync_processing_service import SyncInventoryLevelProcessingService


def analyze_inventory_levels(
    time_period: str = "default",
    warehouse: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None
) -> str:
    """
    Analyze current inventory levels and stock health.

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Last 30 days (default)
            - "last_30_days" - Last 30 days
            - "last_90_days" - Last 90 days
            - "last_year" - Last 365 days
            - "YYYY" - Full year (e.g., "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range
            - "QX YYYY" - Quarter (e.g., "Q1 2021")
        warehouse: Optional warehouse to filter (not currently used)
        category: Optional category to filter
        status: Optional status filter (low, normal, excess)

    Returns:
        String containing the inventory level analysis report
    """
    # Initialize the sync wrapper for agent framework
    service = SyncInventoryLevelProcessingService()

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
    if warehouse:
        filters['warehouse'] = [warehouse]
    if category:
        filters['category'] = [category]
    if status:
        filters['status'] = [status]

    try:
        # Get dashboard data
        data = service.get_dashboard_data(filters)

        # Get health analysis
        health = service.analyze_inventory_health(filters)

        # Extract components
        kpis = data.get('kpis', {})
        stock_levels = data.get('stockLevels', [])
        movements = data.get('movements', [])
        alerts = data.get('alerts', [])
        insights = data.get('insights', [])

        # Format the results
        result = f"""# Inventory Level Analysis Report

## Analysis Period: {time_period}
{f"Category: {category}" if category else "All Categories"}
{f"Status Filter: {status}" if status else "All Status Types"}

## Key Performance Indicators

- **Total Inventory Value**: ${kpis.get('totalInventoryValue', 0):,.2f}
- **Stock Turnover Rate**: {kpis.get('stockTurnover', 0):.2f}x per year
- **Stockout Risk**: {kpis.get('stockoutRisk', 0):.1f}%
- **Average Days on Hand**: {kpis.get('averageDaysOnHand', 0):.1f} days
- **Inventory Accuracy**: {kpis.get('inventoryAccuracy', 0):.1f}%
- **Excess Stock Value**: ${kpis.get('excessStock', 0):,.2f}

## Inventory Health Assessment

- **Health Score**: {health.get('healthScore', 0)}/100
- **Health Status**: {health.get('healthStatus', 'Unknown')}

### Health Factors:
"""
        for factor in health.get('factors', []):
            result += f"- {factor}\n"

        result += """
## Top Stock Items

"""
        for idx, item in enumerate(stock_levels[:10], 1):
            result += f"{idx}. **{item.get('itemName', 'Unknown')}**\n"
            result += f"   - Category: {item.get('category', 'N/A')}\n"
            result += f"   - Current Stock: {item.get('currentStock', 0):,} units\n"
            result += f"   - Stock Value: ${item.get('stockValue', 0):,.2f}\n"
            result += f"   - Status: {item.get('status', 'unknown').upper()}\n"
            result += f"   - Days on Hand: {item.get('daysOnHand', 0):.0f}\n\n"

        if alerts:
            result += """## Alerts

"""
            for alert in alerts:
                result += f"- {alert}\n"

        if insights:
            result += """
## Insights

"""
            for insight in insights:
                result += f"- {insight}\n"

        if movements and len(movements) > 0:
            # Show recent movement summary
            recent_movements = movements[:5]
            total_inbound = sum(m.get('inbound', 0) for m in recent_movements)
            total_outbound = sum(m.get('outbound', 0) for m in recent_movements)

            result += f"""
## Recent Inventory Movement (Last 5 Days)

- **Total Inbound**: {total_inbound:,} units
- **Total Outbound**: {total_outbound:,} units
- **Net Movement**: {total_inbound - total_outbound:,} units
"""

        if health.get('recommendations'):
            result += """
## Recommendations

"""
            for rec in health.get('recommendations', []):
                result += f"- {rec}\n"

        result += """
## Data Consistency Note

This analysis uses the same data source as the Inventory Level Dashboard,
ensuring complete consistency between agent responses and dashboard visualizations.
"""

        return result

    except Exception as e:
        return f"""# Inventory Level Analysis Error

An error occurred while analyzing inventory levels: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. Filter validity

Error details: {str(e)}
"""


# Test function
def test_inventory_level():
    """Test function to verify the inventory level tool is working."""
    try:
        result = analyze_inventory_levels(
            time_period="last_30_days",
            warehouse=None,
            category=None,
            status=None
        )
        print(result)
        return True
    except Exception as e:
        print(f"Test failed: {e}")
        return False


if __name__ == "__main__":
    # Run test when executed directly
    test_inventory_level()