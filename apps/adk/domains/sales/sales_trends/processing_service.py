"""Processing service for sales trends analysis with caching and insights"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio
from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import SalesTrendsDataService
from .models import (
    SalesTrendKPI,
    TimeSeriesDataPoint,
    SeasonalityDataPoint,
    GrowthRateDataPoint,
    TopPerformerDataPoint,
    SalesTrendMainData,
    SalesTrendMetadata,
    SalesTrendResponse,
    SalesTrendInsight
)


class SalesTrendsProcessingService:
    """Processing service for sales trends with caching"""

    def __init__(self):
        self.data_service = SalesTrendsDataService()

    @cache_dashboard_endpoint("sales_trends", ttl=180)  # 3 min cache
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete sales trends dashboard data"""

        # Normalize filters
        normalized_filters = self._normalize_filters(filters)

        # Fetch all data components in parallel
        kpis = await self._get_kpis(normalized_filters)
        time_series = await self._get_time_series(normalized_filters)
        seasonality = await self._get_seasonality(normalized_filters)
        growth_rates = await self._calculate_growth_rates(time_series)
        top_performers = await self._get_top_performers(normalized_filters)

        # Generate rule-based insights
        rule_based_insights = self._generate_insights(
            kpis.dict(),
            time_series,
            growth_rates,
            top_performers
        )

        # Get AI insights async (non-blocking with graceful fallback)
        ai_insights = await self._get_cached_ai_insights(
            normalized_filters,
            kpis.dict(),
            time_series,
            seasonality,
            growth_rates,
            top_performers
        )

        # Combine insights (rule-based + AI)
        all_insights = rule_based_insights + [{'type': 'ai', 'message': insight} for insight in ai_insights]

        # Create response
        return {
            'kpiMetrics': {
                'totalRevenue': kpis.totalRevenue,
                'totalUnits': kpis.totalUnits,
                'avgOrderValue': kpis.avgOrderValue,
                'marginPercentage': kpis.marginPercentage,
                'revenueGrowth': kpis.revenueGrowth,
                'transactionCount': kpis.transactionCount
            },
            'mainData': {
                'timeSeries': [ts.dict() for ts in time_series],
                'seasonality': [s.dict() for s in seasonality],
                'growthRates': [gr.dict() for gr in growth_rates],
                'topPerformers': [tp.dict() for tp in top_performers]
            },
            'insights': all_insights,
            'metadata': {
                'filtersApplied': normalized_filters,
                'timestamp': datetime.now().isoformat(),
                'recordCount': len(time_series),
                'dateRange': {
                    'from': normalized_filters.get('dateFrom', '2017-01-01'),
                    'to': normalized_filters.get('dateTo', '2021-12-31')
                }
            }
        }

    def _normalize_filters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize filter format"""
        normalized = filters.copy()

        # Set defaults if not provided
        if not normalized.get('dateFrom'):
            normalized['dateFrom'] = '2017-01-01'
        if not normalized.get('dateTo'):
            normalized['dateTo'] = '2021-12-31'
        if not normalized.get('granularity'):
            normalized['granularity'] = 'monthly'
        if not normalized.get('metric'):
            normalized['metric'] = 'revenue'

        # Handle old dateRange format
        if 'dateRange' in normalized and isinstance(normalized['dateRange'], dict):
            date_range = normalized.pop('dateRange')
            if 'startDate' in date_range and not normalized.get('dateFrom'):
                normalized['dateFrom'] = date_range['startDate']
            if 'endDate' in date_range and not normalized.get('dateTo'):
                normalized['dateTo'] = date_range['endDate']

        return normalized

    async def _get_kpis(self, filters: Dict[str, Any]) -> SalesTrendKPI:
        """Calculate KPI metrics with smart growth comparison"""

        # Get current period data
        summary = await self.data_service.get_kpi_summary(filters)

        # Calculate growth if date range provided
        revenue_growth = 0.0
        if filters.get('dateFrom') and filters.get('dateTo'):
            try:
                # Get previous period data for comparison
                prev_filters = self._get_previous_period_filters(filters)
                prev_summary = await self.data_service.get_kpi_summary(prev_filters)

                # Only calculate growth if previous period has meaningful data
                # (at least $1000 revenue to avoid false positives from sparse data)
                if prev_summary['totalRevenue'] >= 1000:
                    revenue_growth = ((summary['totalRevenue'] - prev_summary['totalRevenue'])
                                    / prev_summary['totalRevenue'] * 100)
                else:
                    # Previous period has no data or insufficient data
                    # Check if we can get any earlier data for context
                    revenue_growth = 0.0
            except Exception as e:
                # If comparison fails for any reason, default to 0
                print(f"[SalesTrends] Could not calculate revenue growth: {e}")
                revenue_growth = 0.0

        return SalesTrendKPI(
            totalRevenue=summary['totalRevenue'],
            totalUnits=summary['totalUnits'],
            avgOrderValue=summary['avgOrderValue'],
            marginPercentage=summary['marginPercentage'],
            revenueGrowth=revenue_growth,
            transactionCount=summary['totalOrders']
        )

    async def _get_time_series(self, filters: Dict[str, Any]) -> List[TimeSeriesDataPoint]:
        """Get time series data with moving averages"""

        raw_data = await self.data_service.get_time_series_data(filters)

        time_series = []
        for i, point in enumerate(raw_data):
            # Calculate average order value
            aov = point['revenue'] / point['orders'] if point['orders'] > 0 else 0

            # Calculate growth rate vs previous period
            growth_rate = None
            if i > 0:
                prev_revenue = raw_data[i - 1]['revenue']
                if prev_revenue > 0:
                    growth_rate = ((point['revenue'] - prev_revenue) / prev_revenue * 100)

            # Calculate 3-period moving average
            moving_avg = None
            if i >= 2:
                window = raw_data[max(0, i - 2):i + 1]
                moving_avg = sum(p['revenue'] for p in window) / len(window)

            time_series.append(TimeSeriesDataPoint(
                period=point['period'],
                revenue=point['revenue'],
                units=point['units'],
                orders=point['orders'],
                avgOrderValue=aov,
                growthRate=growth_rate,
                movingAverage=moving_avg
            ))

        return time_series

    async def _get_seasonality(self, filters: Dict[str, Any]) -> List[SeasonalityDataPoint]:
        """Get seasonality analysis data"""

        raw_data = await self.data_service.get_seasonality_data(filters)

        # Month names for formatting
        month_names = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
            '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
            '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
        }

        return [
            SeasonalityDataPoint(
                year=point['year'],
                month=point['month'],
                revenue=point['revenue'],
                period=f"{month_names.get(point['month'], point['month'])} {point['year']}"
            )
            for point in raw_data
        ]

    async def _calculate_growth_rates(self, time_series: List[TimeSeriesDataPoint]) -> List[GrowthRateDataPoint]:
        """Calculate growth rates with statistics"""

        growth_rates = []
        all_growth_rates = []

        for i, point in enumerate(time_series):
            if point.growthRate is not None:
                all_growth_rates.append(point.growthRate)

        # Calculate statistics
        avg_growth = sum(all_growth_rates) / len(all_growth_rates) if all_growth_rates else 0
        min_growth = min(all_growth_rates) if all_growth_rates else 0
        max_growth = max(all_growth_rates) if all_growth_rates else 0

        for point in time_series:
            if point.growthRate is not None:
                growth_rates.append(GrowthRateDataPoint(
                    period=point.period,
                    revenue=point.revenue,
                    growthRate=point.growthRate,
                    avgGrowthRate=avg_growth,
                    minGrowthRate=min_growth,
                    maxGrowthRate=max_growth
                ))

        return growth_rates

    async def _get_top_performers(self, filters: Dict[str, Any]) -> List[TopPerformerDataPoint]:
        """Get top performers by dimension"""

        raw_data = await self.data_service.get_top_performers(filters)

        if not raw_data:
            return []

        # Calculate total revenue for market share
        total_revenue = sum(p['revenue'] for p in raw_data)

        return [
            TopPerformerDataPoint(
                name=performer['name'],
                revenue=performer['revenue'],
                units=performer['units'],
                orders=performer['orders'],
                marketShare=(performer['revenue'] / total_revenue * 100) if total_revenue > 0 else 0,
                growthRate=0.0  # Would need previous period data
            )
            for performer in raw_data
        ]

    def _generate_insights(
        self,
        kpis: dict,
        time_series: List[TimeSeriesDataPoint],
        growth_rates: List[GrowthRateDataPoint],
        top_performers: List[TopPerformerDataPoint]
    ) -> List[Dict[str, str]]:
        """Generate rule-based insights"""

        insights = []

        # Revenue insights
        total_revenue = kpis.get('totalRevenue', 0)
        revenue_growth = kpis.get('revenueGrowth', 0)

        if revenue_growth > 15:
            insights.append({
                'type': 'positive',
                'message': f"🚀 Strong revenue growth of {revenue_growth:.1f}% indicates positive market momentum. **Action:** Scale successful channels and expand to new segments within 30 days. Expected: Additional 10-15% revenue lift.",
                'priority': 'HIGH'
            })
        elif revenue_growth > 5:
            insights.append({
                'type': 'positive',
                'message': f"📈 Revenue growing at {revenue_growth:.1f}%, showing healthy business trajectory. **Action:** Continue current strategy and monitor key drivers. Expected: Maintain growth trajectory.",
                'priority': 'INFO'
            })
        elif revenue_growth < -10:
            insights.append({
                'type': 'warning',
                'message': f"⚠️ CRITICAL: Revenue declining by {abs(revenue_growth):.1f}%. Immediate action required. **Action:** Conduct root cause analysis within 48h, review pricing and customer feedback. Expected: Stabilize decline within 2 weeks.",
                'priority': 'CRITICAL'
            })
        elif revenue_growth < 0:
            insights.append({
                'type': 'warning',
                'message': f"⚠️ Revenue declining by {abs(revenue_growth):.1f}%. **Action:** Review market conditions and competitor activity within 1 week. Expected: Identify corrective actions.",
                'priority': 'HIGH'
            })

        # Growth volatility insights
        if growth_rates:
            growth_values = [gr.growthRate for gr in growth_rates if gr.growthRate is not None]
            if growth_values:
                std_dev = (sum((x - sum(growth_values) / len(growth_values)) ** 2 for x in growth_values) / len(growth_values)) ** 0.5
                if std_dev > 20:
                    insights.append({
                        'type': 'warning',
                        'message': f"📊 High growth volatility detected (std dev: {std_dev:.1f}%). **Action:** Investigate irregular patterns and stabilize revenue streams through diversification. Expected: Reduce volatility by 30%.",
                        'priority': 'MODERATE'
                    })

        # Seasonality insights
        if len(time_series) >= 12:
            monthly_revenues = [ts.revenue for ts in time_series[-12:]]
            avg_revenue = sum(monthly_revenues) / len(monthly_revenues)
            max_revenue = max(monthly_revenues)
            min_revenue = min(monthly_revenues)
            seasonality_strength = ((max_revenue - min_revenue) / avg_revenue * 100) if avg_revenue > 0 else 0

            if seasonality_strength > 40:
                insights.append({
                    'type': 'info',
                    'message': f"📅 Strong seasonality detected ({seasonality_strength:.0f}% variance). **Action:** Optimize inventory and staffing for peak periods, launch off-season promotions. Expected: Smooth out 20-25% of variance.",
                    'priority': 'INFO'
                })

        # Top performer insights
        if top_performers and len(top_performers) > 0:
            top = top_performers[0]
            if top.marketShare > 30:
                insights.append({
                    'type': 'info',
                    'message': f"⭐ Top performer '{top.name}' dominates with {top.marketShare:.1f}% market share. **Action:** Protect this asset while diversifying revenue streams to reduce concentration risk. Expected: Maintain leadership while building alternatives.",
                    'priority': 'MODERATE'
                })

        # Average order value insights
        aov = kpis.get('avgOrderValue', 0)
        if aov > 0 and total_revenue > 0:
            transaction_count = kpis.get('transactionCount', 0)
            if transaction_count > 0:
                if aov < 100:
                    insights.append({
                        'type': 'info',
                        'message': f"💰 Average order value is ${aov:.0f}. **Action:** Implement upsell/cross-sell strategies and bundle offers. Expected: Increase AOV by 15-20% within 60 days.",
                        'priority': 'MODERATE'
                    })

        # Default insight if nothing specific
        if not insights:
            insights.append({
                'type': 'info',
                'message': f"📊 Dashboard analysis completed for ${total_revenue:,.0f} in total revenue across {len(time_series)} periods. Review trends and patterns for optimization opportunities.",
                'priority': 'INFO'
            })

        return insights

    def _get_previous_period_filters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get filters for previous period comparison with smart date handling"""

        prev_filters = filters.copy()

        if filters.get('dateFrom') and filters.get('dateTo'):
            # Parse dates
            start = datetime.fromisoformat(filters['dateFrom'])
            end = datetime.fromisoformat(filters['dateTo'])

            # Calculate period length
            period_days = (end - start).days

            # Smart comparison logic:
            # For periods > 365 days, use year-over-year comparison
            # For shorter periods, use period-over-period
            if period_days > 365:
                # Year-over-year comparison
                prev_filters['dateFrom'] = (start - timedelta(days=365)).isoformat()
                prev_filters['dateTo'] = (end - timedelta(days=365)).isoformat()
            else:
                # Period-over-period comparison
                prev_filters['dateFrom'] = (start - timedelta(days=period_days)).isoformat()
                prev_filters['dateTo'] = (end - timedelta(days=period_days)).isoformat()

        return prev_filters

    @cache_dashboard_endpoint(dashboard_type="sales_trends_ai_insights", ttl=1800)
    async def _get_cached_ai_insights(
        self,
        filters: Dict[str, Any],
        kpis: Dict,
        time_series: List,
        seasonality: List,
        growth_rates: List,
        top_performers: List
    ) -> List[str]:
        """Get AI insights from cache or generate async (non-blocking)

        Cached separately with longer TTL (30 min) since AI insights are less filter-dependent.
        Uses asyncio.to_thread() to run blocking AI generation in thread pool.

        Returns:
            List of AI-generated insight strings (empty on error)
        """
        try:
            # Run AI generation in thread pool to avoid blocking event loop
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                kpis,
                time_series,
                seasonality,
                growth_rates,
                top_performers,
                filters
            )
            return ai_insights
        except Exception as e:
            print(f"[SalesTrendsProcessingService] Error in _get_cached_ai_insights: {e}")
            return []  # Graceful fallback

    def _generate_ai_insights(
        self,
        kpis: Dict,
        time_series: List,
        seasonality: List,
        growth_rates: List,
        top_performers: List,
        filters: Dict
    ) -> List[str]:
        """Generate AI-powered strategic insights using Gemini

        This complements rule-based insights with creative, strategic analysis.
        Uses dashboard-specific prompts for consistent, actionable recommendations.

        Args:
            kpis: KPI metrics from dashboard
            time_series: Time series data points
            seasonality: Seasonality patterns
            growth_rates: Growth rate data
            top_performers: Top performers by metric
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            # Import at method level for error isolation
            from lib.ai_insights_generator import generate_ai_insights

            # Calculate additional metrics for AI context
            total_periods = len(time_series)
            
            # Find peak and lowest periods
            if time_series:
                peak_period = max(time_series, key=lambda x: x.get('value', 0) if isinstance(x, dict) else x.value)
                low_period = min(time_series, key=lambda x: x.get('value', 0) if isinstance(x, dict) else x.value)
            else:
                peak_period = None
                low_period = None

            # Find strongest seasonality
            if seasonality:
                strongest_season = max(seasonality, key=lambda x: x.get('value', 0) if isinstance(x, dict) else x.value)
            else:
                strongest_season = None

            # Find highest growth rate
            if growth_rates:
                highest_growth = max(growth_rates, key=lambda x: x.get('growthRate', 0) if isinstance(x, dict) else x.growthRate)
            else:
                highest_growth = None

            # Build KPIs dict for AI
            kpis_dict = {
                'total_revenue': kpis.get('totalRevenue', 0),
                'total_units': kpis.get('totalUnits', 0),
                'avg_order_value': kpis.get('avgOrderValue', 0),
                'margin_percentage': kpis.get('marginPercentage', 0),
                'revenue_growth': kpis.get('revenueGrowth', 0),
                'transaction_count': kpis.get('transactionCount', 0),
            }

            peak_val = peak_period.value if hasattr(peak_period, 'value') else peak_period.get('value', 0) if peak_period else 0
            low_val = low_period.value if hasattr(low_period, 'value') else low_period.get('value', 0) if low_period else 0
            peak_date = peak_period.date if hasattr(peak_period, 'date') else peak_period.get('date', 'N/A') if peak_period else 'N/A'
            low_date = low_period.date if hasattr(low_period, 'date') else low_period.get('date', 'N/A') if low_period else 'N/A'

            data_summary = {
                'total_periods': total_periods,
                'peak_period': peak_date,
                'peak_value': peak_val,
                'low_period': low_date,
                'low_value': low_val,
                'strongest_season': strongest_season.period if strongest_season and hasattr(strongest_season, 'period') else 'N/A',
                'highest_growth_period': highest_growth.period if highest_growth and hasattr(highest_growth, 'period') else 'N/A',
                'highest_growth_rate': highest_growth.growthRate if highest_growth and hasattr(highest_growth, 'growthRate') else 0,
            }

            # Generate AI insights using CORRECT function signature
            ai_insights = generate_ai_insights(
                dashboard_type='sales_trends',
                kpis=kpis_dict,
                data_summary=data_summary,
                filters=filters
            )

            print(f"[SalesTrendsProcessingService] Generated {len(ai_insights)} AI insights")
            return ai_insights

        except ImportError:
            print("[SalesTrendsProcessingService] AI insights module not available, skipping AI insights")
            return []
        except Exception as e:
            print(f"[SalesTrendsProcessingService] Error generating AI insights: {e}")
            return []

