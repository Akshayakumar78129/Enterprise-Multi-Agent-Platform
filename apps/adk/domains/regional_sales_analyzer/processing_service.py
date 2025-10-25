"""Processing service for regional sales analyzer - business logic layer"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from domains.common.simple_cache import cache_dashboard_endpoint
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

    @cache_dashboard_endpoint("regional_sales_analyzer")
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
            'insights': self._generate_insights(kpis.dict(), regional_performance, opportunities),
            'metadata': {
                'filtersApplied': normalized_filters,
                'timestamp': datetime.now().isoformat()
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

    def _generate_insights(self, kpis: dict, regional_performance: list, opportunities: list) -> list:
        """Generate AI insights based on data"""
        insights = []

        # Growth rate insight
        growth_rate = kpis.get('growthRate')
        if growth_rate is not None:
            if growth_rate > 10:
                insights.append({
                    'type': 'positive',
                    'message': f"Regional sales growing strongly at {growth_rate}%"
                })
            elif growth_rate < -5:
                insights.append({
                    'type': 'warning',
                    'message': f"Regional sales declining by {abs(growth_rate)}%"
                })

        # Total sales insight
        total_sales = kpis.get('totalSales', 0)
        if total_sales > 1000000:
            insights.append({
                'type': 'positive',
                'message': f"Strong regional performance at ${total_sales:,.0f} in total sales"
            })

        # Profit margin insight
        profit_margin = kpis.get('profitMargin', 0)
        if profit_margin > 30:
            insights.append({
                'type': 'positive',
                'message': f"Excellent profit margin of {profit_margin:.1f}%"
            })
        elif profit_margin < 15:
            insights.append({
                'type': 'warning',
                'message': f"Low profit margin at {profit_margin:.1f}% - review pricing strategy"
            })

        # Top region insight
        if regional_performance and len(regional_performance) > 0:
            top_region = regional_performance[0]
            insights.append({
                'type': 'info',
                'message': f"Top performing region: {top_region.state}, {top_region.country} with ${top_region.totalSales:,.0f} in sales"
            })

        # Opportunity insight
        if opportunities:
            star_regions = [o for o in opportunities if o.opportunityCategory == 'Star Region']
            growth_regions = [o for o in opportunities if o.opportunityCategory == 'Growth Opportunity']

            if star_regions:
                insights.append({
                    'type': 'positive',
                    'message': f"{len(star_regions)} Star Region(s) identified with high sales and customer engagement"
                })

            if growth_regions:
                insights.append({
                    'type': 'info',
                    'message': f"{len(growth_regions)} Growth Opportunity region(s) with high customer potential"
                })

        # Geographic diversity insight
        country_count = kpis.get('countryCount', 0)
        state_count = kpis.get('stateCount', 0)
        if country_count > 5:
            insights.append({
                'type': 'positive',
                'message': f"Strong geographic diversity across {country_count} countries and {state_count} states"
            })

        return insights

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
