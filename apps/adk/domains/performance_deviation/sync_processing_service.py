"""Synchronous wrapper for Performance Processing Service - used by agent tools"""

import asyncio
from typing import Dict, Optional, List
from .processing_service import PerformanceProcessingService


class SyncPerformanceProcessingService:
    """Synchronous wrapper for the async PerformanceProcessingService

    This is needed for the agent framework which expects synchronous functions.
    """

    def __init__(self):
        self.async_service = PerformanceProcessingService()

    def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Synchronous version of get_dashboard_summary"""
        loop = None
        try:
            # Try to get existing event loop
            loop = asyncio.get_event_loop()
        except RuntimeError:
            # Create new event loop if none exists
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        try:
            # Run the async function
            if loop.is_running():
                # If loop is already running (shouldn't happen in agent context)
                # Create a new task
                future = asyncio.create_task(
                    self.async_service.get_dashboard_summary(filters)
                )
                return loop.run_until_complete(future)
            else:
                # Normal case - run the coroutine
                return loop.run_until_complete(
                    self.async_service.get_dashboard_summary(filters)
                )
        except Exception as e:
            print(f"[SyncPerformanceProcessingService] Error: {e}")
            # Return empty response on error
            return self.async_service._empty_response()

    def format_agent_response(self, summary_data: Dict) -> str:
        """Format the summary data for agent tool output

        Only uses the 3 core ML outputs that the agent needs.
        """
        result = "# Performance Deviation Analysis\n\n"

        # Add date range if available
        metadata = summary_data.get('metadata', {})
        if metadata.get('dateRange'):
            date_range = metadata['dateRange']
            if date_range.get('from') and date_range.get('to'):
                result += f"**Analysis Period:** {date_range['from']} to {date_range['to']}\n\n"

        # 1. Feature Importance (Core ML output 1)
        feature_importance = summary_data.get('featureImportance', {})
        aggregated = feature_importance.get('aggregated', [])

        if aggregated:
            result += "## Key Influencing Factors\n\n"
            result += "| Factor | Impact |\n|--------|--------|\n"
            for feat in aggregated[:5]:  # Top 5 factors
                result += f"| {feat['feature']} | {feat['avg_importance']:.2%} |\n"
            result += "\n"

        # 2. Variance Decomposition (Core ML output 2)
        variance_decomp = summary_data.get('varianceDecomposition', {})
        components = variance_decomp.get('components', [])

        if components:
            result += "## Variance Analysis\n\n"
            result += "| Component | Share of Variance |\n|-----------|------------------|\n"
            for comp in components:
                result += f"| {comp['name']} | {comp['share']:.1%} |\n"
            result += "\n"

        # 3. Performance Deviations (Core ML output 3)
        performance = summary_data.get('performanceExplorer', {})

        for kpi_name, data_points in performance.items():
            if data_points:
                result += f"## {kpi_name.replace('_', ' ').title()} Analysis\n\n"

                # Calculate statistics
                deviations = [p['deviation'] for p in data_points]
                if deviations:
                    avg_dev = sum(deviations) / len(deviations)
                    max_dev = max(deviations)
                    min_dev = min(deviations)

                    result += f"- **Average Deviation:** {avg_dev:.2f}\n"
                    result += f"- **Maximum Deviation:** {max_dev:.2f}\n"
                    result += f"- **Minimum Deviation:** {min_dev:.2f}\n"
                    result += f"- **Data Points:** {len(data_points)}\n\n"

        # Add recommendations based on analysis
        result += "## Recommendations\n\n"

        # Check for significant deviations in each KPI
        for kpi_name, data_points in performance.items():
            if data_points:
                deviations = [abs(p['deviation']) for p in data_points]
                avg_deviation = sum(deviations) / len(deviations) if deviations else 0

                # If average deviation is significant
                if avg_deviation > 100:  # Threshold can be adjusted
                    result += f"- **{kpi_name.replace('_', ' ').title()}**: "
                    result += "Significant systematic deviation detected. "
                    result += "Review top influencing factors for optimization opportunities.\n"

        # Add metadata
        if metadata.get('totalDataPoints'):
            result += f"\n**Total Data Points Analyzed:** {metadata['totalDataPoints']}\n"

        if metadata.get('businessFunctions'):
            functions = metadata['businessFunctions']
            if functions:
                result += f"**Business Functions:** {', '.join(functions)}\n"

        return result