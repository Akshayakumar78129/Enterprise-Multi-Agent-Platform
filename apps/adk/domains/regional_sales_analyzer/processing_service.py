"""Processing service for regional sales analyzer - business logic layer"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio
from domains.common.dashboard_cache import cache_dashboard_endpoint
from .data_service import RegionalSalesAnalyzerDataService
from .models import (
    RegionalKPI,
    RegionPerformance,
    CountryPerformance,
    TimeSeries,
    OpportunityRegion,
    TopRegion
)


class RegionalSalesAnalyzerProcessingService:
    """Processing service for regional sales analysis"""

    def __init__(self):
        self.data_service = RegionalSalesAnalyzerDataService()

    @cache_dashboard_endpoint(dashboard_type="regional_sales_analyzer", ttl=300)
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete regional sales analyzer dashboard data"""

        # Normalize filter format
        normalized_filters = self._normalize_filters(filters)

        # Fetch all data components in parallel would be ideal, but doing sequentially for simplicity
        kpis = await self._get_kpis(normalized_filters)
        regional_performance = await self._get_regional_performance(normalized_filters)
        country_performance = await self._get_country_performance(normalized_filters)
        time_series = await self._get_time_series(normalized_filters)
        opportunities = await self._get_opportunities(normalized_filters)
        top_regions = await self._get_top_regions(normalized_filters)

        # Generate rule-based insights (fast, always present)
        rule_based_insights = self._generate_insights(kpis.dict(), regional_performance, opportunities)

        # Get AI insights from separate cache (non-blocking, async)
        ai_insights = await self._get_cached_ai_insights(
            normalized_filters,
            kpis.dict(),
            regional_performance,
            opportunities
        )

        # Combine into single unified insights array
        combined_insights = rule_based_insights + ai_insights

        # Get available filter options for dropdowns (countries, states)
        filter_options = await self.data_service.get_available_regions()

        # Create response structure
        return {
            'kpiMetrics': {
                'totalSales': kpis.totalSales,
                'netSales': kpis.netSales,
                'grossProfit': kpis.grossProfit,
                'profitMargin': kpis.profitMargin,
                'countryCount': kpis.countryCount,
                'stateCount': kpis.stateCount,
                'customerCount': kpis.customerCount,
                'transactionCount': kpis.transactionCount,
                'avgTransactionValue': kpis.avgTransactionValue,
                'growthRate': kpis.growthRate
            },
            'mainData': {
                'regionalPerformance': [r.dict() for r in regional_performance],
                'countryPerformance': [c.dict() for c in country_performance],
                'timeSeries': [t.dict() for t in time_series],
                'opportunities': [o.dict() for o in opportunities],
                'topRegions': [tr.dict() for tr in top_regions]
            },
            'insights': combined_insights,
            'insights_metadata': {
                'total_count': len(combined_insights),
                'rule_based_count': len(rule_based_insights),
                'ai_count': len(ai_insights),
                'insights_version': 'unified_v2'
            },
            'metadata': {
                'filtersApplied': normalized_filters,
                'timestamp': datetime.now().isoformat(),
                'filterOptions': filter_options  # Include filter options in summary response
            }
        }

    def _normalize_filters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize filter format to handle both old and new formats"""
        normalized = filters.copy()

        # Handle old dateRange format → convert to dateFrom/dateTo
        if 'dateRange' in normalized and isinstance(normalized['dateRange'], dict):
            date_range = normalized.pop('dateRange')
            if 'startDate' in date_range and not normalized.get('dateFrom'):
                normalized['dateFrom'] = date_range['startDate']
            if 'endDate' in date_range and not normalized.get('dateTo'):
                normalized['dateTo'] = date_range['endDate']

        return normalized

    async def _get_kpis(self, filters: Dict[str, Any]) -> RegionalKPI:
        """Calculate KPI metrics"""

        # Get current period summary
        summary = await self.data_service.get_regional_summary(filters)

        # Calculate growth rate if date range provided
        growth_rate = None
        if filters.get('dateFrom') and filters.get('dateTo'):
            prev_filters = self._get_previous_period_filters(filters)
            prev_summary = await self.data_service.get_regional_summary(prev_filters)

            prev_total_sales = prev_summary.get('totalSales', 0) or 0
            curr_total_sales = summary.get('totalSales', 0) or 0

            if prev_total_sales > 0:
                growth_rate = round(
                    ((curr_total_sales - prev_total_sales) / prev_total_sales * 100),
                    2
                )

        return RegionalKPI(
            totalSales=summary.get('totalSales', 0) or 0,
            netSales=summary.get('netSales', 0) or 0,
            grossProfit=summary.get('grossProfit', 0) or 0,
            profitMargin=summary.get('profitMargin', 0) or 0,
            countryCount=summary.get('countryCount', 0) or 0,
            stateCount=summary.get('stateCount', 0) or 0,
            customerCount=summary.get('customerCount', 0) or 0,
            transactionCount=summary.get('transactionCount', 0) or 0,
            avgTransactionValue=summary.get('avgTransactionValue', 0) or 0,
            growthRate=growth_rate
        )

    async def _get_regional_performance(self, filters: Dict[str, Any]) -> List[RegionPerformance]:
        """Get regional performance data"""

        regions = await self.data_service.get_regional_sales_data(filters)

        return [
            RegionPerformance(
                country=r.get('country', ''),
                state=r.get('state', ''),
                totalSales=r.get('totalSales', 0) or 0,
                netSales=r.get('netSales', 0) or 0,
                totalQuantity=r.get('totalQuantity', 0) or 0,
                grossProfit=r.get('grossProfit', 0) or 0,
                profitMargin=r.get('profitMargin', 0) or 0,
                customerCount=r.get('customerCount', 0) or 0,
                transactionCount=r.get('transactionCount', 0) or 0,
                avgTransactionValue=r.get('avgTransactionValue', 0) or 0,
                firstSaleDate=r.get('firstSaleDate'),
                lastSaleDate=r.get('lastSaleDate')
            )
            for r in regions
        ]

    async def _get_country_performance(self, filters: Dict[str, Any]) -> List[CountryPerformance]:
        """Get country-level performance data"""

        countries = await self.data_service.get_country_level_data(filters)

        return [
            CountryPerformance(
                country=c.get('country', ''),
                totalSales=c.get('totalSales', 0) or 0,
                netSales=c.get('netSales', 0) or 0,
                totalQuantity=c.get('totalQuantity', 0) or 0,
                grossProfit=c.get('grossProfit', 0) or 0,
                profitMargin=c.get('profitMargin', 0) or 0,
                customerCount=c.get('customerCount', 0) or 0,
                transactionCount=c.get('transactionCount', 0) or 0,
                stateCount=c.get('stateCount', 0) or 0
            )
            for c in countries
        ]

    async def _get_time_series(self, filters: Dict[str, Any]) -> List[TimeSeries]:
        """Get time series data"""

        series = await self.data_service.get_time_series_data(filters)

        return [
            TimeSeries(
                period=s.get('period', ''),
                country=s.get('country', ''),
                state=s.get('state', ''),
                totalSales=s.get('totalSales', 0) or 0,
                netSales=s.get('netSales', 0) or 0,
                totalQuantity=s.get('totalQuantity', 0) or 0,
                grossProfit=s.get('grossProfit', 0) or 0,
                customerCount=s.get('customerCount', 0) or 0,
                transactionCount=s.get('transactionCount', 0) or 0
            )
            for s in series
        ]

    async def _get_opportunities(self, filters: Dict[str, Any]) -> List[OpportunityRegion]:
        """Get opportunity analysis data"""

        opportunities = await self.data_service.get_opportunity_analysis(filters)

        return [
            OpportunityRegion(
                country=o.get('country', ''),
                state=o.get('state', ''),
                totalSales=o.get('totalSales', 0) or 0,
                grossProfit=o.get('grossProfit', 0) or 0,
                customerCount=o.get('customerCount', 0) or 0,
                transactionCount=o.get('transactionCount', 0) or 0,
                avgTransactionValue=o.get('avgTransactionValue', 0) or 0,
                opportunityCategory=o.get('opportunityCategory', 'Focus Area'),
                salesVsAvg=o.get('salesVsAvg', 0) or 0,
                customersVsAvg=o.get('customersVsAvg', 0) or 0,
                profitMargin=o.get('profitMargin', 0) or 0
            )
            for o in opportunities
        ]

    async def _get_top_regions(self, filters: Dict[str, Any]) -> List[TopRegion]:
        """Get top performing regions"""

        top = await self.data_service.get_top_regions(filters, limit=5)

        return [
            TopRegion(
                country=t.get('country', ''),
                state=t.get('state', ''),
                totalSales=t.get('totalSales', 0) or 0,
                profitMargin=t.get('profitMargin', 0) or 0
            )
            for t in top
        ]

    def _generate_insights(self, kpis: dict, regional_performance: list, opportunities: list) -> List[str]:
        """Generate rule-based insights (fast, deterministic)

        These insights are always present and provide immediate value without API calls.
        Focus on data-driven observations with actionable recommendations.

        Returns:
            List of formatted insight strings with priority indicators
        """
        insights = []

        # Growth rate insight
        growth_rate = kpis.get('growthRate')
        if growth_rate is not None:
            if growth_rate > 20:
                insights.append(
                    f"CRITICAL: Regional sales growing at {growth_rate:.1f}%, significantly above market average. "
                    f"**Action:** Analyze success factors and replicate across underperforming regions. "
                    f"Expected: 15-20% boost in low-growth regions."
                )
            elif growth_rate > 10:
                insights.append(
                    f"HIGH: Strong regional sales growth at {growth_rate:.1f}%. "
                    f"**Action:** Identify drivers and expand investment in top-performing regions. "
                    f"Expected: Maintain growth trajectory."
                )
            elif growth_rate < -5:
                insights.append(
                    f"CRITICAL: Regional sales declining by {abs(growth_rate):.1f}%. "
                    f"**Action:** Launch immediate market analysis within 48h to identify root causes. "
                    f"Expected: Stabilize decline within 30 days."
                )

        # Total sales insight with revenue protection
        total_sales = kpis.get('totalSales', 0)
        if total_sales > 5000000:
            insights.append(
                f"HIGH: Strong regional portfolio at ${total_sales:,.0f} in total sales. "
                f"**Action:** Implement revenue protection measures and customer retention programs. "
                f"Expected: Secure ${total_sales * 0.95:,.0f} baseline revenue."
            )

        # Profit margin insight with action items
        profit_margin = kpis.get('profitMargin', 0)
        if profit_margin > 30:
            insights.append(
                f"HIGH: Excellent profit margin of {profit_margin:.1f}% across regions. "
                f"**Action:** Document pricing strategy and operational efficiency best practices. "
                f"Expected: Replicate in lower-margin regions."
            )
        elif profit_margin < 15:
            insights.append(
                f"CRITICAL: Low profit margin at {profit_margin:.1f}% requires immediate attention. "
                f"**Action:** Conduct pricing review and cost analysis within 7 days. "
                f"Expected: 5-8% margin improvement through optimization."
            )

        # Top region insight with strategic recommendations
        if regional_performance and len(regional_performance) > 0:
            top_region = regional_performance[0]
            insights.append(
                f"INFO: Top performing region is {top_region.state}, {top_region.country} with ${top_region.totalSales:,.0f} in sales. "
                f"**Action:** Study success factors for replication. Monitor for market saturation signals."
            )

        # Opportunity insights with quantified impact
        if opportunities:
            star_regions = [o for o in opportunities if o.opportunityCategory == 'Star Region']
            growth_regions = [o for o in opportunities if o.opportunityCategory == 'Growth Opportunity']

            if star_regions:
                total_star_sales = sum(o.totalSales for o in star_regions)
                insights.append(
                    f"HIGH: {len(star_regions)} Star Region(s) identified with high sales and customer engagement (${total_star_sales:,.0f}). "
                    f"**Action:** Prioritize resource allocation and maintain competitive positioning. "
                    f"Expected: Protect ${total_star_sales * 0.9:,.0f} revenue baseline."
                )

            if growth_regions and len(growth_regions) >= 3:
                insights.append(
                    f"MODERATE: {len(growth_regions)} Growth Opportunity region(s) with high customer potential. "
                    f"**Action:** Develop targeted expansion plans for top 3 opportunities within Q1. "
                    f"Expected: 25-30% sales increase in targeted regions."
                )

        # Geographic diversity insight with risk assessment
        country_count = kpis.get('countryCount', 0)
        state_count = kpis.get('stateCount', 0)
        if country_count > 5:
            insights.append(
                f"INFO: Strong geographic diversity across {country_count} countries and {state_count} states reduces market risk. "
                f"**Action:** Maintain balanced portfolio and monitor regional dependencies."
            )
        elif country_count <= 2:
            insights.append(
                f"MODERATE: Limited geographic diversity ({country_count} countries) increases market concentration risk. "
                f"**Action:** Explore expansion into 2-3 adjacent markets within 6 months. "
                f"Expected: 20% risk reduction through diversification."
            )

        # Always provide a fallback insight if nothing specific was generated
        if not insights:
            insights = [
                f"INFO: Regional analysis completed for {country_count} countries and {state_count} states.",
                "INFO: Review segment performance and trends for optimization opportunities."
            ]

        return insights

    @cache_dashboard_endpoint(dashboard_type="regional_sales_analyzer_ai_insights", ttl=1800)
    async def _get_cached_ai_insights(
        self,
        filters: Dict[str, Any],
        kpis: Dict,
        regional_performance: List,
        opportunities: List
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
                regional_performance,
                opportunities,
                filters
            )
            return ai_insights
        except Exception as e:
            print(f"[RegionalSalesAnalyzerProcessingService] Error in _get_cached_ai_insights: {e}")
            return []  # Graceful fallback

    def _generate_ai_insights(
        self,
        kpis: Dict,
        regional_performance: List,
        opportunities: List,
        filters: Dict
    ) -> List[str]:
        """Generate AI-powered strategic insights using Gemini

        This complements rule-based insights with creative, strategic analysis.
        Uses dashboard-specific prompts for consistent, actionable recommendations.

        Args:
            kpis: KPI metrics from dashboard
            regional_performance: Regional performance data
            opportunities: Opportunity analysis data
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            # Import at method level for error isolation
            from lib.ai_insights_generator import generate_ai_insights

            # Calculate additional metrics for AI context
            total_regions = len(regional_performance)
            top_region = regional_performance[0] if regional_performance else None
            star_regions = [o for o in opportunities if o.opportunityCategory == 'Star Region']
            growth_regions = [o for o in opportunities if o.opportunityCategory == 'Growth Opportunity']

            # Build context for AI
            kpis_dict = {
                'total_sales': kpis.get('totalSales', 0),
                'gross_profit': kpis.get('grossProfit', 0),
                'profit_margin': kpis.get('profitMargin', 0),
                'growth_rate': kpis.get('growthRate', 0),
                'country_count': kpis.get('countryCount', 0),
                'state_count': kpis.get('stateCount', 0),
                'customer_count': kpis.get('customerCount', 0),
            }

            data_summary = {
                'total_regions': total_regions,
                'top_region': f"{top_region.state}, {top_region.country}" if top_region else "N/A",
                'top_region_sales': top_region.totalSales if top_region else 0,
                'star_region_count': len(star_regions),
                'growth_region_count': len(growth_regions),
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='regional_sales',
                kpis=kpis_dict,
                data_summary=data_summary,
                filters=filters
            )

            return ai_insights

        except ImportError:
            print("[RegionalSalesAnalyzerProcessingService] AI insights module not available, skipping AI insights")
            return []
        except Exception as e:
            print(f"[RegionalSalesAnalyzerProcessingService] Error generating AI insights: {e}")
            return []  # Graceful fallback

    def _get_previous_period_filters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get filters for previous period comparison"""

        prev_filters = filters.copy()

        if filters.get('dateFrom') and filters.get('dateTo'):
            start = datetime.fromisoformat(filters['dateFrom'])
            end = datetime.fromisoformat(filters['dateTo'])

            period_days = (end - start).days

            prev_filters['dateFrom'] = (start - timedelta(days=period_days)).isoformat()
            prev_filters['dateTo'] = (end - timedelta(days=period_days)).isoformat()

        return prev_filters
