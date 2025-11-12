"""Inventory holding cost analysis tool for orchestration agent using sync processing service

This tool follows the metadata-only visualization pattern for optimal performance.
"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.inventory.holding_cost.sync_processing_service import SyncHoldingCostProcessingService


def analyze_holding_costs(
    time_period: str = "default",
    category: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    annual_holding_rate: float = 0.25,
    opportunity_rate: float = 0.08,
    excessive_only: bool = False
) -> str:
    """
    Analyze inventory holding costs with breakdown by category, warehouse, and cost components.

    **CRITICAL: NEVER ASK FOR PARAMETERS - USE DEFAULTS**
    This tool automatically uses sensible defaults for all parameters.

    Args:
        time_period: Analysis period - MUST be one of:
            - "default" - Full dataset (2017-2021, default)
            - "last_quarter" - Last 90 days
            - "last_6_months" - Last 180 days
            - "last_year" - Last 365 days
            - "YYYY" - Full year (e.g., "2021")
            - "YYYY-MM-DD:YYYY-MM-DD" - Custom date range
            - "QX YYYY" - Quarter (e.g., "Q1 2021")
        category: Optional product category filter (e.g., "Electronics", "Furniture")
        warehouse_id: Optional warehouse ID filter (e.g., "WH001", "WH002")
        annual_holding_rate: Annual holding cost percentage (default: 0.25 = 25%)
        opportunity_rate: Opportunity cost rate (default: 0.08 = 8%)
        excessive_only: Show only items with excessive holding costs (>30%)

    Returns:
        String containing holding cost analysis report with metadata-only visualization
    """
    # Initialize the sync wrapper for agent framework
    service = SyncHoldingCostProcessingService()

    # Build filters based on parameters
    filters = {}

    # Parse time period
    current_date = datetime.now()

    if time_period == "default":
        # Use dataset default: 2017-01-01 to 2021-12-31
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    elif time_period == "last_quarter":
        filters['dateFrom'] = (current_date - timedelta(days=90)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
    elif time_period == "last_6_months":
        filters['dateFrom'] = (current_date - timedelta(days=180)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
    elif time_period == "last_year":
        filters['dateFrom'] = (current_date - timedelta(days=365)).strftime('%Y-%m-%d')
        filters['dateTo'] = current_date.strftime('%Y-%m-%d')
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
    if warehouse_id:
        filters['warehouseIds'] = [warehouse_id]
    if excessive_only:
        filters['excessiveOnly'] = True

    # Add cost parameters
    filters['annualHoldingCostRate'] = annual_holding_rate
    filters['opportunityCostRate'] = opportunity_rate

    try:
        # Get dashboard data
        data = service.get_dashboard_summary(filters)

        # Extract components
        kpis = data.get('kpiMetrics', {})
        category_analysis = data.get('categoryAnalysis', [])
        warehouse_analysis = data.get('warehouseAnalysis', [])
        high_cost_items = data.get('highCostItems', [])
        cost_breakdown = data.get('costBreakdown', [])
        insights = data.get('insights', [])

        # Format the results as text report for AI
        result = f"""# Inventory Holding Cost Analysis Report

## Analysis Period: {filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}
{f"Category Filter: {category}" if category else "All Categories"}
{f"Warehouse Filter: {warehouse_id}" if warehouse_id else "All Warehouses"}
Annual Holding Rate: {annual_holding_rate:.1%}
Opportunity Cost Rate: {opportunity_rate:.1%}

## Key Performance Indicators

- **Total Inventory Value**: ${kpis.get('total_inventory_value', 0):,.2f}
- **Total Annual Holding Cost**: ${kpis.get('total_annual_holding_cost', 0):,.2f}
- **Average Holding Cost %**: {kpis.get('avg_holding_cost_pct', 0):.2%}
- **Total Items Analyzed**: {kpis.get('total_items_analyzed', 0):,}
- **Items with Excessive Costs (>30%)**: {kpis.get('excessive_cost_items', 0):,}
- **Potential Annual Savings**: ${kpis.get('potential_annual_savings', 0):,.2f}

## Cost Breakdown

"""
        for component in cost_breakdown:
            result += f"- **{component.get('component', 'Unknown')}**: ${component.get('amount', 0):,.2f} ({component.get('percentage', 0):.1f}%)\n"

        if category_analysis:
            result += """
## Analysis by Category

"""
            for idx, cat in enumerate(category_analysis[:10], 1):
                result += f"{idx}. **{cat.get('category', 'Unknown')}**\n"
                result += f"   - Items: {cat.get('items_count', 0):,}\n"
                result += f"   - Inventory Value: ${cat.get('inventory_value', 0):,.2f}\n"
                result += f"   - Total Holding Cost: ${cat.get('total_holding_cost', 0):,.2f}\n"
                result += f"   - Avg Holding Cost %: {cat.get('avg_holding_cost_pct', 0):.2%}\n"
                result += f"   - High-Cost Items: {cat.get('high_cost_items', 0)}\n"
                result += f"   - Potential Savings: ${cat.get('potential_savings', 0):,.2f}\n\n"

        if warehouse_analysis:
            result += """
## Analysis by Warehouse

"""
            for idx, wh in enumerate(warehouse_analysis[:5], 1):
                result += f"{idx}. **{wh.get('warehouse_name', 'Unknown')}** ({wh.get('warehouse_id', 'N/A')})\n"
                result += f"   - Type: {wh.get('warehouse_type', 'Unknown')}\n"
                result += f"   - Items: {wh.get('items_count', 0):,}\n"
                result += f"   - Inventory Value: ${wh.get('inventory_value', 0):,.2f}\n"
                result += f"   - Total Holding Cost: ${wh.get('total_holding_cost', 0):,.2f}\n"
                result += f"   - Storage Cost: ${wh.get('storage_cost', 0):,.2f}\n"
                result += f"   - High-Cost Items: {wh.get('high_cost_items', 0)}\n"
                result += f"   - Potential Savings: ${wh.get('potential_savings', 0):,.2f}\n\n"

        if high_cost_items:
            result += """
## Top 10 Items with Highest Holding Costs

"""
            for idx, item in enumerate(high_cost_items[:10], 1):
                result += f"{idx}. **{item.get('item_name', 'Unknown')}** ({item.get('item_number', 'N/A')})\n"
                result += f"   - Category: {item.get('category', 'N/A')}\n"
                result += f"   - Warehouse: {item.get('warehouse_name', 'N/A')}\n"
                result += f"   - Inventory Value: ${item.get('inventory_value', 0):,.2f}\n"
                result += f"   - Total Holding Cost: ${item.get('total_holding_cost', 0):,.2f}\n"
                result += f"   - Holding Cost %: {item.get('holding_cost_pct', 0):.2%}\n"
                result += f"   - Potential Savings: ${item.get('potential_savings', 0):,.2f}\n\n"

        if insights:
            result += """
## Strategic Insights

"""
            for insight in insights:
                result += f"- {insight}\n"

        # Add metadata-only visualization section
        viz_metadata = {
            "toolname": "inventory-holding-cost",
            "componentName": "overview",
            "body": {
                "dateFrom": filters.get('dateFrom'),
                "dateTo": filters.get('dateTo'),
                "categories": filters.get('categories', []),
                "warehouseIds": filters.get('warehouseIds', []),
                "excessiveOnly": filters.get('excessiveOnly', False),
                "annualHoldingCostRate": annual_holding_rate,
                "opportunityCostRate": opportunity_rate
            }
        }

        result += f"""
## Data Consistency Note

This analysis uses the same data source as the Inventory Holding Cost Dashboard,
ensuring complete consistency between agent responses and dashboard visualizations.

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
        import traceback
        return f"""# Inventory Holding Cost Analysis Error

An error occurred while analyzing holding costs: {str(e)}

Please check:
1. Database connectivity
2. Data availability for the specified time period
3. Filter validity
4. Schema compatibility (PostgreSQL/SQLite)

Error details: {str(e)}
Traceback: {traceback.format_exc()}
"""


# Test function for debugging
if __name__ == "__main__":
    print("Testing Holding Cost Analysis Tool...")
    result = analyze_holding_costs(time_period="default")
    print(result[:1000] + "...\n[Output truncated]")
