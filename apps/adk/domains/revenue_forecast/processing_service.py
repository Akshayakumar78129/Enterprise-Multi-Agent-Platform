"""Processing service for Revenue Forecast domain - business logic and calculations"""

import logging
from typing import List, Dict, Any
from datetime import datetime
from .data_service import RevenueForecastDataService

logger = logging.getLogger(__name__)


class RevenueForecastProcessingService:
    """Service for processing and calculating revenue forecast metrics"""

    def __init__(self):
        self.data_service = RevenueForecastDataService()

    async def get_revenue_forecast_summary(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for revenue forecast dashboard data
        Returns: KPIs, visualizations, and insights
        """
        try:
            # Convert Pydantic model to dict if needed
            filters_dict = filters.dict() if hasattr(filters, 'dict') else filters

            # Fetch all required data - handle empty database gracefully
            kpi_data = await self.data_service.get_kpi_data(filters_dict) or {}
            growth_decomp = await self.data_service.get_revenue_growth_decomposition(filters_dict) or []
            cohort_data = await self.data_service.get_cohort_retention_data(filters_dict) or []
            segment_data = await self.data_service.get_segment_forecast_data(filters_dict) or []
            customer_econ = await self.data_service.get_customer_economics_data(filters_dict) or {}

            # Check if database is completely empty
            has_no_data = (
                not kpi_data and
                not growth_decomp and
                not cohort_data and
                not segment_data and
                not customer_econ
            )

            if has_no_data:
                logger.warning("No data available in database for revenue forecast")
                return self._empty_response(filters_dict)

            # Calculate KPIs
            kpi_metrics = self._calculate_kpis(kpi_data, customer_econ)

            # Process growth decomposition
            growth_components = self._process_growth_decomposition(growth_decomp)

            # Process cohort retention
            cohort_metrics = self._process_cohort_retention(cohort_data)

            # Generate insights
            insights = self._generate_insights(kpi_metrics, growth_components, cohort_metrics)

            return {
                'kpiMetrics': kpi_metrics,
                'mainData': {
                    'growthDecomposition': growth_components,
                    'cohortRetention': cohort_metrics,
                    'segmentForecast': segment_data,
                    'customerEconomics': customer_econ,
                    'monthlyTrend': growth_decomp
                },
                'insights': insights,
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'filters_applied': filters_dict,
                    'forecast_horizon': filters_dict.get('forecastHorizon', 12),
                    'confidence_level': filters_dict.get('confidenceLevel', 80.0)
                }
            }

        except Exception as e:
            logger.error(f"Error in get_revenue_forecast_summary: {str(e)}")
            raise

    def _calculate_kpis(self, kpi_data: Dict[str, Any], customer_econ: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate the 5 main KPI metrics"""

        # Extract values safely
        rule_of_40 = kpi_data.get('rule_of_40', 0) or 0
        nrr = kpi_data.get('net_revenue_retention', 100) or 100
        ltv_cac = customer_econ.get('ltv_cac_ratio', 0) or 0
        revenue_quality = kpi_data.get('revenue_quality_score', 0) or 0
        market_momentum = kpi_data.get('market_share_momentum', 0) or 0

        # Calculate status indicators safely
        rule_of_40_status = 'good' if rule_of_40 >= 40 else ('warning' if rule_of_40 >= 25 else 'critical')
        nrr_status = 'good' if nrr >= 110 else ('warning' if nrr >= 100 else 'critical')
        ltv_cac_status = 'good' if ltv_cac >= 3 else ('warning' if ltv_cac >= 1.5 else 'critical')
        quality_status = 'good' if revenue_quality >= 70 else ('warning' if revenue_quality >= 50 else 'critical')
        momentum_status = 'good' if market_momentum > 0 else ('warning' if market_momentum >= -5 else 'critical')

        return {
            'ruleOf40': {
                'value': round(rule_of_40, 1),
                'change': 2.5,  # Placeholder - would need historical data
                'trend': 'up' if rule_of_40 >= 40 else 'down',
                'benchmark': 40.0,
                'status': rule_of_40_status,
                'formatted_value': None
            },
            'netRevenueRetention': {
                'value': round(nrr, 1),
                'change': 3.2,  # Placeholder
                'trend': 'up' if nrr >= 100 else 'down',
                'benchmark': 110.0,
                'status': nrr_status,
                'formatted_value': None
            },
            'ltvCacRatio': {
                'value': round(ltv_cac, 2),
                'change': 0.3,  # Placeholder
                'trend': 'up' if ltv_cac >= 3 else 'down',
                'benchmark': 3.0,
                'status': ltv_cac_status,
                'formatted_value': None
            },
            'revenueQuality': {
                'value': round(revenue_quality, 0),
                'change': 5.0,  # Placeholder
                'trend': 'up' if revenue_quality >= 70 else 'down',
                'benchmark': 70.0,
                'status': quality_status,
                'formatted_value': None
            },
            'marketMomentum': {
                'value': round(market_momentum, 1),
                'change': 1.2,  # Placeholder
                'trend': 'up' if market_momentum > 0 else 'down',
                'benchmark': 0.0,
                'status': momentum_status,
                'formatted_value': None
            }
        }

    def _process_growth_decomposition(self, growth_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process revenue growth decomposition into waterfall components"""
        if not growth_data or len(growth_data) < 2:
            return []

        components = []

        # Get first and last months for comparison
        first_month = growth_data[0]
        last_month = growth_data[-1]

        starting_revenue = first_month.get('total_revenue', 0)
        ending_revenue = last_month.get('total_revenue', 0)
        total_growth = ending_revenue - starting_revenue

        if total_growth == 0:
            return []

        # Decompose into components
        # Product revenue change
        product_change = (last_month.get('product_revenue', 0) - first_month.get('product_revenue', 0))
        if product_change != 0:
            components.append({
                'component_name': 'Product Revenue Growth',
                'value': round(product_change, 2),
                'percentage': round((product_change / abs(total_growth)) * 100, 1) if total_growth != 0 else 0,
                'category': 'organic' if product_change > 0 else 'negative'
            })

        # Service revenue change
        service_change = (last_month.get('service_revenue', 0) - first_month.get('service_revenue', 0))
        if service_change != 0:
            components.append({
                'component_name': 'Service Revenue Growth',
                'value': round(service_change, 2),
                'percentage': round((service_change / abs(total_growth)) * 100, 1) if total_growth != 0 else 0,
                'category': 'organic' if service_change > 0 else 'negative'
            })

        return components

    def _process_cohort_retention(self, cohort_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process cohort retention data into retention metrics"""
        if not cohort_data:
            return []

        # Group by cohort and calculate retention
        cohort_groups = {}
        for row in cohort_data:
            cohort = row.get('cohort_month')
            if cohort not in cohort_groups:
                cohort_groups[cohort] = []
            cohort_groups[cohort].append(row)

        retention_metrics = []
        for cohort, data_points in cohort_groups.items():
            if len(data_points) < 2:
                continue

            # Sort by months since cohort
            sorted_points = sorted(data_points, key=lambda x: x.get('months_since_cohort', 0))

            # Double-check after sorting (should never happen but safety first)
            if not sorted_points or len(sorted_points) == 0:
                continue

            initial_revenue = sorted_points[0].get('cohort_revenue', 0)
            if initial_revenue == 0:
                continue

            for point in sorted_points:
                months = point.get('months_since_cohort', 0)
                current_revenue = point.get('cohort_revenue', 0)
                retention_rate = (current_revenue / initial_revenue * 100) if initial_revenue > 0 else 0

                retention_metrics.append({
                    'cohort_month': cohort,
                    'month_number': int(months),
                    'retained_revenue': round(current_revenue, 2),
                    'retention_rate': round(retention_rate, 1),
                    'expansion_rate': round(max(0, retention_rate - 100), 1),
                    'churn_rate': round(max(0, 100 - retention_rate), 1)
                })

        return retention_metrics

    def _generate_insights(
        self,
        kpi_metrics: Dict[str, Any],
        growth_components: List[Dict[str, Any]],
        cohort_metrics: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate AI-powered insights from the data"""
        insights = []

        # Rule of 40 insights
        rule_of_40_value = kpi_metrics.get('ruleOf40', {}).get('value', 0)
        if rule_of_40_value >= 40:
            insights.append(
                f"🎯 Excellent Rule of 40 score of {rule_of_40_value}% indicates balanced growth and profitability"
            )
        elif rule_of_40_value < 25:
            insights.append(
                f"⚠️ Rule of 40 score of {rule_of_40_value}% is below benchmark - consider growth acceleration or margin improvement"
            )

        # NRR insights
        nrr_value = kpi_metrics.get('netRevenueRetention', {}).get('value', 0)
        if nrr_value >= 110:
            insights.append(
                f"✅ Net Revenue Retention of {nrr_value}% shows strong customer expansion"
            )
        elif nrr_value < 100:
            insights.append(
                f"🔴 Net Revenue Retention of {nrr_value}% indicates customer contraction - focus on retention strategies"
            )

        # LTV/CAC insights
        ltv_cac_value = kpi_metrics.get('ltvCacRatio', {}).get('value', 0)
        if ltv_cac_value >= 3:
            insights.append(
                f"💰 LTV/CAC ratio of {ltv_cac_value}x demonstrates efficient customer acquisition"
            )
        elif ltv_cac_value < 1.5:
            insights.append(
                f"⚠️ LTV/CAC ratio of {ltv_cac_value}x is below healthy threshold - optimize acquisition costs"
            )

        # Revenue Quality insights
        quality_value = kpi_metrics.get('revenueQuality', {}).get('value', 0)
        if quality_value >= 70:
            insights.append(
                f"⭐ Revenue Quality Score of {quality_value}/100 indicates high-quality, sustainable revenue"
            )
        elif quality_value < 50:
            insights.append(
                f"⚠️ Revenue Quality Score of {quality_value}/100 suggests need for more recurring revenue streams"
            )

        # Growth component insights
        if growth_components:
            organic_components = [c for c in growth_components if c['category'] == 'organic']
            if organic_components:
                total_organic = sum(c['value'] for c in organic_components)
                insights.append(
                    f"📈 Organic revenue growth of ${total_organic:,.0f} driven by {len(organic_components)} components"
                )

        return insights

    def _empty_response(self, filters_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Return empty response when database has no data"""
        return {
            'kpiMetrics': {
                'ruleOf40': {'value': 0.0, 'change': 0.0, 'trend': 'neutral', 'benchmark': 40.0, 'status': 'warning', 'formatted_value': None},
                'netRevenueRetention': {'value': 100.0, 'change': 0.0, 'trend': 'neutral', 'benchmark': 110.0, 'status': 'warning', 'formatted_value': None},
                'ltvCacRatio': {'value': 0.0, 'change': 0.0, 'trend': 'neutral', 'benchmark': 3.0, 'status': 'warning', 'formatted_value': None},
                'revenueQuality': {'value': 0.0, 'change': 0.0, 'trend': 'neutral', 'benchmark': 70.0, 'status': 'warning', 'formatted_value': None},
                'marketMomentum': {'value': 0.0, 'change': 0.0, 'trend': 'neutral', 'benchmark': 0.0, 'status': 'warning', 'formatted_value': None}
            },
            'mainData': {
                'growthDecomposition': [],
                'cohortRetention': [],
                'segmentForecast': [],
                'customerEconomics': {},
                'monthlyTrend': []
            },
            'insights': ['No data available for the selected period. Please check database connection and data availability.'],
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'filters_applied': filters_dict,
                'forecast_horizon': filters_dict.get('forecastHorizon', 12),
                'confidence_level': filters_dict.get('confidenceLevel', 80.0),
                'has_data': False
            }
        }
