"""Processing service for demand forecast analysis"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import DemandForecastDataService

logger = logging.getLogger(__name__)


class DemandForecastProcessingService:
    """Processing service for demand forecast operations"""

    def __init__(self):
        self.data_service = DemandForecastDataService()
        logger.info("DemandForecastService initialized")

    @cache_dashboard_endpoint("demand_forecast.get_dashboard_data")
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete dashboard data"""
        try:
            # Get all data components
            kpis = await self.get_kpis(filters)
            trend_data = await self.data_service.get_trend_data(filters)
            distribution_data = await self.data_service.get_distribution_data(filters)
            performance_data = await self.data_service.get_performance_data(filters)
            insights = await self.get_insights(filters)

            return {
                'kpiMetrics': kpis,
                'mainData': {
                    'trends': trend_data,
                    'distribution': distribution_data,
                    'performance': performance_data
                },
                'insights': insights,
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'filters_applied': filters
                }
            }

        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return {
                'kpiMetrics': {
                    'forecastAccuracy': {'label': 'Forecast Accuracy', 'value': 0, 'change': 0, 'trend': 'neutral', 'status': 'warning'},
                    'demandVariability': {'label': 'Demand Variability', 'value': 0, 'change': 0, 'trend': 'neutral', 'status': 'warning'},
                    'seasonalityIndex': {'label': 'Seasonality Index', 'value': 0, 'change': 0, 'trend': 'neutral', 'status': 'warning'},
                    'trendDirection': {'label': 'Trend Direction', 'value': 0, 'change': 0, 'trend': 'neutral', 'status': 'warning'},
                    'confidenceInterval': {'label': 'Confidence Interval', 'value': 0, 'change': 0, 'trend': 'neutral', 'status': 'warning'},
                    'leadTimeRequirement': {'label': 'Lead Time (Days)', 'value': 0, 'change': 0, 'trend': 'neutral', 'status': 'warning'}
                },
                'mainData': {
                    'trends': [],
                    'distribution': [],
                    'performance': []
                },
                'insights': [],
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'filters_applied': filters
                }
            }

    @cache_dashboard_endpoint("demand_forecast.get_kpis")
    async def get_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get demand forecast KPIs"""
        try:
            return await self.data_service.get_kpis(filters)
        except Exception as e:
            logger.error(f"Error getting KPIs: {e}")
            return {'forecastAccuracy': 0, 'demandVariability': 0, 'seasonalityIndex': 0, 'trendDirection': 0, 'confidenceInterval': 0, 'leadTimeRequirement': 0}

    @cache_dashboard_endpoint("demand_forecast.get_detailed_data")
    async def get_detailed_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get detailed data"""
        try:
            return await self.data_service.get_detailed_data(filters)
        except Exception as e:
            logger.error(f"Error getting detailed data: {e}")
            return []

    async def get_insights(self, filters: Dict[str, Any] = {}) -> List[str]:
        """Generate hybrid insights: rule-based + AI-powered analysis"""
        # Start with rule-based insights (fast, always available)
        rule_insights = await self._generate_rule_based_insights(filters)

        # Add AI insights (creative, strategic)
        ai_insights = await self._generate_ai_insights(filters)

        # Combine both - rule-based first for immediate context, then AI for depth
        return rule_insights + ai_insights

    async def _generate_rule_based_insights(self, filters: Dict[str, Any] = {}) -> List[str]:
        """Generate fast rule-based insights"""
        insights = []

        try:
            kpis = await self.get_kpis(filters)

            # Forecast Accuracy insights
            forecast_accuracy = kpis.get('forecastAccuracy', {}).get('value', 0) if isinstance(kpis.get('forecastAccuracy'), dict) else 0
            if forecast_accuracy >= 90:
                insights.append(
                    f"✅ Excellent forecast accuracy of {forecast_accuracy}% indicates reliable demand planning"
                )
            elif forecast_accuracy < 80:
                insights.append(
                    f"⚠️ Forecast accuracy of {forecast_accuracy}% is below target - review prediction models and historical data quality"
                )

            # Demand Variability insights
            demand_variability = kpis.get('demandVariability', {}).get('value', 0) if isinstance(kpis.get('demandVariability'), dict) else 0
            if demand_variability < 0.3:
                insights.append(
                    f"📊 Low demand variability ({demand_variability:.2f}) suggests stable, predictable patterns"
                )
            elif demand_variability > 0.5:
                insights.append(
                    f"🔴 High demand variability ({demand_variability:.2f}) requires increased safety stock and flexible capacity planning"
                )

            # Seasonality insights
            seasonality_index = kpis.get('seasonalityIndex', {}).get('value', 0) if isinstance(kpis.get('seasonalityIndex'), dict) else 0
            if seasonality_index > 1.2:
                insights.append(
                    f"📈 Significant seasonality (index: {seasonality_index:.2f}) - plan inventory peaks ahead of demand surges"
                )

            # Lead Time insights
            lead_time = kpis.get('leadTimeRequirement', {}).get('value', 0) if isinstance(kpis.get('leadTimeRequirement'), dict) else 0
            if lead_time > 14:
                insights.append(
                    f"⏰ Extended lead time of {lead_time} days requires advanced planning and buffer inventory"
                )
            elif lead_time <= 7:
                insights.append(
                    f"⚡ Short lead time of {lead_time} days enables responsive replenishment and lower safety stock"
                )

        except Exception as e:
            logger.error(f"Error generating rule-based insights: {e}")

        return insights

    async def _generate_ai_insights(self, filters: Dict[str, Any] = {}) -> List[str]:
        """Generate AI-powered strategic insights using Gemini

        Complements rule-based insights with creative, strategic analysis.
        """
        try:
            from lib.ai_insights_generator import generate_ai_insights

            kpis = await self.get_kpis(filters)
            trend_data = await self.data_service.get_trend_data(filters)
            distribution_data = await self.data_service.get_distribution_data(filters)

            # Prepare data summary for AI context
            data_summary = {
                'forecastAccuracy': kpis.get('forecastAccuracy', {}).get('value', 0) if isinstance(kpis.get('forecastAccuracy'), dict) else 0,
                'demandVariability': kpis.get('demandVariability', {}).get('value', 0) if isinstance(kpis.get('demandVariability'), dict) else 0,
                'seasonalityIndex': kpis.get('seasonalityIndex', {}).get('value', 0) if isinstance(kpis.get('seasonalityIndex'), dict) else 0,
                'trendDirection': kpis.get('trendDirection', {}).get('value', 0) if isinstance(kpis.get('trendDirection'), dict) else 0,
                'confidenceInterval': kpis.get('confidenceInterval', {}).get('value', 0) if isinstance(kpis.get('confidenceInterval'), dict) else 0,
                'leadTimeRequirement': kpis.get('leadTimeRequirement', {}).get('value', 0) if isinstance(kpis.get('leadTimeRequirement'), dict) else 0,
                'trend_summary': self._format_trend_summary(trend_data),
                'distribution_summary': self._format_distribution_summary(distribution_data)
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='demand_forecast',
                kpis=kpis,
                data_summary=data_summary,
                filters=filters
            )

            return ai_insights

        except Exception as e:
            logger.warning(f"AI insights generation failed: {e}")
            return []  # Graceful fallback - rule-based insights still available

    def _format_trend_summary(self, trend_data: List[Dict[str, Any]]) -> str:
        """Format trend data for AI prompt"""
        if not trend_data or len(trend_data) < 2:
            return "Limited trend data available"

        summary_parts = []

        # Get first and last months
        first_month = trend_data[0]
        last_month = trend_data[-1]

        first_value = first_month.get('value', 0) or 0
        last_value = last_month.get('value', 0) or 0

        if first_value > 0:
            growth_pct = ((last_value - first_value) / first_value) * 100
            summary_parts.append(f"Overall trend: {'+' if growth_pct > 0 else ''}{growth_pct:.1f}% growth")

        # Calculate average monthly value
        avg_value = sum(month.get('value', 0) or 0 for month in trend_data) / len(trend_data)
        summary_parts.append(f"Average monthly value: ${avg_value:,.0f}")

        return " | ".join(summary_parts) if summary_parts else "Trend analysis in progress"

    def _format_distribution_summary(self, distribution_data: List[Dict[str, Any]]) -> str:
        """Format distribution data for AI prompt"""
        if not distribution_data:
            return "No distribution data available"

        summary_lines = []
        for i, category in enumerate(distribution_data[:3], 1):  # Top 3 categories
            cat_name = category.get('category', 'Unknown')
            value = category.get('value', 0) or 0
            quantity = category.get('quantity', 0) or 0
            summary_lines.append(
                f"{i}. {cat_name}: ${value:,.0f} ({quantity:,.0f} units)"
            )

        return "\n".join(summary_lines) if summary_lines else "Limited category data"
