"""Customer retention planning tool using shared processing service"""

import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import sys
import os

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from domains.retention_planner.sync_processing_service import SyncRetentionPlannerService


def plan_retention_strategy(
    time_period: str = "default",
    risk_threshold: str = "medium",
    budget_limit: Optional[float] = None,
    include_roi_analysis: bool = True
) -> str:
    """
    Plan customer retention strategies using ML optimization.

    Args:
        time_period: Analysis period
        risk_threshold: Risk level to target (low, medium, high)
        budget_limit: Optional budget constraint for retention efforts
        include_roi_analysis: Whether to include ROI analysis

    Returns:
        Formatted retention strategy plan as a string.
    """

    # Initialize the sync service
    service = SyncRetentionPlannerService()

    # Build filters
    filters = {}

    # Parse time period
    if time_period == "default":
        filters['date_from'] = '2021-01-01'
        filters['date_to'] = '2021-12-31'
    elif ':' in time_period:
        dates = time_period.split(':')
        filters['date_from'] = dates[0]
        filters['date_to'] = dates[1]

    filters['risk_threshold'] = risk_threshold

    if budget_limit:
        filters['budget_limit'] = budget_limit

    # Get results from processing service
    try:
        result = service.get_dashboard_summary(filters)

        # Format the response
        output = []
        output.append("# Customer Retention Strategy Plan")
        output.append(f"\nAnalysis Period: {filters.get('date_from')} to {filters.get('date_to')}")
        output.append(f"Risk Threshold: {risk_threshold}")
        if budget_limit:
            output.append(f"Budget Limit: ${budget_limit:,.2f}")

        # Add KPI metrics
        if result.get('kpiMetrics'):
            output.append("\n## Key Metrics")
            kpis = result['kpiMetrics']
            output.append(f"- Current Retention Rate: {kpis.get('retentionRate', 0):.1f}%")
            output.append(f"- At-Risk Customer Value: ${kpis.get('atRiskValue', 0):,.2f}")
            output.append(f"- Intervention Success Rate: {kpis.get('interventionSuccess', 0):.1f}%")
            output.append(f"- Projected Cost Savings: ${kpis.get('costSavings', 0):,.2f}")

        # Add retention strategies
        output.append("\n## Recommended Retention Strategies")

        output.append("\n### High-Risk Customers")
        output.append("- **Strategy**: Immediate personal outreach with retention specialist")
        output.append("- **Offer**: 20-30% discount on next purchase or service upgrade")
        output.append("- **Expected Success Rate**: 65%")

        output.append("\n### Medium-Risk Customers")
        output.append("- **Strategy**: Automated email campaign with personalized offers")
        output.append("- **Offer**: 10-15% loyalty discount")
        output.append("- **Expected Success Rate**: 45%")

        output.append("\n### Low-Risk Customers")
        output.append("- **Strategy**: Engagement through content and community")
        output.append("- **Offer**: Early access to new products/features")
        output.append("- **Expected Success Rate**: 80%")

        # Add ROI analysis if requested
        if include_roi_analysis and result.get('mainData', {}).get('interventionroiData'):
            output.append("\n## ROI Analysis")
            roi_data = result['mainData']['interventionroiData']
            if roi_data:
                for intervention in roi_data[:5]:
                    output.append(f"- {intervention.get('strategy', 'Unknown')}: {intervention.get('roi', 0):.1f}x return")

        # Add customer segments to target
        if result.get('mlResults', {}).get('segments'):
            output.append("\n## Priority Customer Segments")
            for segment in result['mlResults']['segments'][:5]:
                output.append(f"\n### Segment {segment.get('segment_id', 'Unknown')}")
                output.append(f"- Size: {segment.get('size', 0):,} customers")
                output.append(f"- Risk Level: {segment.get('risk_level', 'Unknown')}")
                output.append(f"- Total Value: ${segment.get('total_value', 0):,.2f}")
                output.append(f"- Recommended Action: {segment.get('recommended_action', 'Monitor')}")

        # Add insights
        if result.get('insights'):
            output.append("\n## Strategic Insights")
            for insight in result['insights']:
                output.append(f"- {insight}")

        return "\n".join(output)

    except Exception as e:
        return f"Error planning retention strategy: {str(e)}"
