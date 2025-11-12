"""Stock optimization tool for orchestration agent using sync processing service

This tool follows the metadata-only visualization pattern for optimal performance.
"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.inventory.stock_optimization.sync_processing_service import SyncStockOptimizationProcessingService


def optimize_stock_levels(
    time_period: str = "default",
    category: Optional[str] = None,
    warehouse: Optional[str] = None,
    supplier: Optional[str] = None,
    optimization_level: str = "balanced"
) -> str:
    """
    Optimize stock levels with EOQ, reorder points, safety stock, and cost recommendations.

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
        warehouse: Optional warehouse filter
        supplier: Optional supplier filter
        optimization_level: Optimization aggressiveness ("conservative", "balanced", "aggressive")

    Returns:
        String containing stock optimization analysis report with metadata-only visualization
    """
    # Initialize the sync wrapper for agent framework
    service = SyncStockOptimizationProcessingService()

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
        filters['category'] = [category]
    if warehouse:
        filters['warehouse'] = [warehouse]
    if supplier:
        filters['supplier'] = [supplier]
    if optimization_level:
        filters['optimizationLevel'] = optimization_level

    try:
        # Get dashboard data
        data = service.get_dashboard_summary(filters)

        # Extract components
        kpis = data.get('kpiMetrics', {})
        recommendations = data.get('recommendations', [])
        metrics = data.get('metrics', [])
        reorder_analysis = data.get('reorderAnalysis', [])
        insights = data.get('insights', [])

        # Format the results as text report for AI
        result = f"""# Stock Optimization Analysis Report

## Analysis Period: {filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}
{f"Category Filter: {category}" if category else "All Categories"}
{f"Warehouse Filter: {warehouse}" if warehouse else "All Warehouses"}
{f"Supplier Filter: {supplier}" if supplier else "All Suppliers"}
Optimization Level: {optimization_level.capitalize()}

## Key Performance Indicators

- **Total Optimized Stock Value**: ${kpis.get('total_optimized_value', 0):,.2f}
- **Items Needing Reorder**: {kpis.get('items_needing_reorder', 0):,}
- **Safety Stock Coverage**: {kpis.get('safety_stock_coverage', 0):.2f}%
- **Average Order Frequency**: {kpis.get('avg_order_frequency', 0):.2f} times/year
- **Projected Cost Savings**: ${kpis.get('total_cost_savings', 0):,.2f}
- **Target Service Level**: {kpis.get('service_level', 0):.1f}%
- **Total Items Analyzed**: {kpis.get('total_items', 0):,}
- **Items Overstocked**: {kpis.get('items_overstock', 0):,}
- **Items Understocked**: {kpis.get('items_understock', 0):,}

## Optimization Metrics (Current vs. Optimized)

"""
        for metric in metrics:
            improvement_direction = "↑" if metric.get('improvement', 0) > 0 else "↓" if metric.get('improvement', 0) < 0 else "→"
            result += f"- **{metric.get('metric', 'Unknown')}**\n"
            result += f"  - Current: {metric.get('current', 0):,.2f}\n"
            result += f"  - Optimized: {metric.get('optimized', 0):,.2f}\n"
            result += f"  - Improvement: {improvement_direction} {abs(metric.get('improvement', 0)):.2f}%\n\n"

        if recommendations:
            result += """
## Top 10 Stock Optimization Recommendations

"""
            for idx, item in enumerate(recommendations[:10], 1):
                stock_status = "⚠️ URGENT REORDER" if item.get('currentLevel', 0) < item.get('reorderPoint', 0) else "✓ Adequate"
                result += f"{idx}. **{item.get('itemName', 'Unknown')}** - {item.get('category', 'N/A')} {stock_status}\n"
                result += f"   - Current Stock Level: {item.get('currentLevel', 0):,}\n"
                result += f"   - Recommended Level: {item.get('recommendedLevel', 0):,}\n"
                result += f"   - Reorder Point: {item.get('reorderPoint', 0):,}\n"
                result += f"   - Safety Stock: {item.get('safetyStock', 0):,}\n"
                result += f"   - Economic Order Quantity (EOQ): {item.get('orderQuantity', 0):,}\n"
                result += f"   - Order Frequency: {item.get('orderFrequency', 0):.2f} times/year\n"
                result += f"   - Daily Demand: {item.get('dailyDemand', 0):.2f}\n"
                result += f"   - Projected Annual Savings: ${item.get('savings', 0):,.2f}\n\n"

        if reorder_analysis:
            result += """
## Reorder Point Analysis (Top Items)

"""
            for idx, item in enumerate(reorder_analysis[:5], 1):
                result += f"{idx}. **{item.get('itemName', 'Unknown')}**\n"
                result += f"   - Lead Time: {item.get('leadTime', 0)} days\n"
                result += f"   - Daily Demand: {item.get('dailyDemand', 0):.2f}\n"
                result += f"   - Demand Variability: {item.get('demandVariability', 0):.2f}\n"
                result += f"   - Service Level Target: {item.get('serviceLevel', 0):.1f}%\n"
                result += f"   - Calculated Reorder Point: {item.get('reorderPoint', 0):,}\n"
                result += f"   - Safety Stock: {item.get('safetyStock', 0):,}\n\n"

        if insights:
            result += """
## Strategic Insights

"""
            for insight in insights:
                result += f"- {insight}\n"

        # Add methodology explanation
        result += """
## Optimization Methodology

This analysis uses industry-standard inventory optimization techniques:

1. **Economic Order Quantity (EOQ)**: Optimal order size minimizing total costs
   - Formula: EOQ = √((2 × Annual Demand × Ordering Cost) / Holding Cost per Unit)
   - Assumes 25% annual holding cost rate, $50 ordering cost per order

2. **Reorder Point (ROP)**: When to place new orders
   - Formula: ROP = (Daily Demand × Lead Time) + Safety Stock
   - Assumes 7-day lead time, 95% service level (Z-score 1.65)

3. **Safety Stock**: Buffer inventory for demand variability
   - Formula: Safety Stock = Z-score × √(Lead Time) × Demand Variability
   - Protects against stockouts during lead time

4. **Demand Analysis**: Based on historical sales patterns
   - Daily demand calculated from 5-year historical data (2017-2021)
   - Variability estimated from transaction patterns

"""

        # Add metadata-only visualization section
        viz_metadata = {
            "toolname": "stock-optimization",
            "componentName": "overview",
            "body": {
                "dateFrom": filters.get('dateFrom'),
                "dateTo": filters.get('dateTo'),
                "category": filters.get('category', []),
                "warehouse": filters.get('warehouse', []),
                "supplier": filters.get('supplier', []),
                "optimizationLevel": optimization_level
            }
        }

        result += f"""
## Data Consistency Note

This analysis uses the same data source as the Stock Optimization Dashboard,
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
        return f"""# Stock Optimization Analysis Error

An error occurred while optimizing stock levels: {str(e)}

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
    print("Testing Stock Optimization Tool...")
    result = optimize_stock_levels(time_period="default")
    print(result[:1000] + "...\n[Output truncated]")
