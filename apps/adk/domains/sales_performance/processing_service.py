"""Processing service for sales performance analysis"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import SalesPerformanceDataService
from .models import (
    SalesKPI,
    ProductPerformance,
    RegionPerformance,
    SalesTrend,
    CategoryPerformance,
    TopCustomer,
    SalesPerformanceResponse
)


class SalesPerformanceProcessingService:
    """Processing service for sales performance"""

    def __init__(self):
        self.data_service = SalesPerformanceDataService()

    @cache_dashboard_endpoint("sales_performance")
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete sales performance dashboard data"""

        # Normalize filter format - support both old (dateRange) and new (dateFrom/dateTo) formats
        normalized_filters = self._normalize_filters(filters)

        # Fetch all data components
        kpis = await self._get_kpis(normalized_filters)
        product_performance = await self._get_product_performance(normalized_filters)
        region_performance = await self._get_region_performance(normalized_filters)
        sales_trends = await self._get_sales_trends(normalized_filters)
        category_performance = await self._get_category_performance(normalized_filters)
        top_customers = await self._get_top_customers(normalized_filters)

        # Create response with KPI metrics structure
        return {
            'kpiMetrics': {
                'totalRevenue': kpis.totalRevenue,
                'totalUnits': kpis.totalUnits,
                'avgOrderValue': kpis.avgOrderValue,
                'uniqueCustomers': kpis.uniqueCustomers,
                'revenueGrowth': kpis.revenueGrowth,
                'conversionRate': kpis.conversionRate
            },
            'mainData': {
                'productPerformance': [p.dict() for p in product_performance],
                'regionPerformance': [r.dict() for r in region_performance],
                'salesTrends': [t.dict() for t in sales_trends],
                'categoryPerformance': [c.dict() for c in category_performance],
                'topCustomers': [cust.dict() for cust in top_customers]
            },
            'insights': self._generate_insights(kpis.dict(), product_performance, region_performance),
            'metadata': {
                'filtersApplied': normalized_filters,
                'timestamp': datetime.now().isoformat()
            }
        }

    def _generate_insights(self, kpis: dict, product_performance: list, region_performance: list) -> list:
        """Generate AI insights based on data"""
        insights = []

        # Revenue insights
        revenue_growth = kpis.get('revenueGrowth', 0)
        if revenue_growth > 10:
            insights.append({
                'type': 'positive',
                'message': f"Revenue growing strongly at {revenue_growth:.1f}%"
            })
        elif revenue_growth < -5:
            insights.append({
                'type': 'warning',
                'message': f"Revenue declining by {abs(revenue_growth):.1f}%"
            })

        # Total revenue insight
        total_revenue = kpis.get('totalRevenue', 0)
        if total_revenue > 1000000:
            insights.append({
                'type': 'positive',
                'message': f"Strong revenue performance at ${total_revenue:,.0f}"
            })

        # Product insights
        if product_performance:
            top_product = product_performance[0]
            insights.append({
                'type': 'info',
                'message': f"Top product: {top_product.productName} with {top_product.marketShare:.1f}% market share"
            })

        # Regional insights
        if region_performance:
            top_region = max(region_performance, key=lambda x: x.revenue)
            insights.append({
                'type': 'info',
                'message': f"Best performing region: {top_region.regionName}"
            })

        # Conversion rate insight
        conversion_rate = kpis.get('conversionRate', 0)
        if conversion_rate > 30:
            insights.append({
                'type': 'positive',
                'message': f"Strong conversion rate of {conversion_rate:.1f}%"
            })
        elif conversion_rate < 10:
            insights.append({
                'type': 'warning',
                'message': f"Low conversion rate at {conversion_rate:.1f}% - consider optimization"
            })

        return insights

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

    async def _get_kpis(self, filters: Dict[str, Any]) -> SalesKPI:
        """Calculate KPI metrics"""

        # Get current period data
        summary = await self.data_service.get_sales_summary(filters)

        # Calculate growth if date range provided
        revenue_growth = 0
        if filters.get('dateFrom') and filters.get('dateTo'):
            # Get previous period data for comparison
            prev_filters = self._get_previous_period_filters(filters)
            prev_summary = await self.data_service.get_sales_summary(prev_filters)

            if prev_summary['totalRevenue'] > 0:
                revenue_growth = ((summary['totalRevenue'] - prev_summary['totalRevenue'])
                                / prev_summary['totalRevenue'] * 100)

        # Calculate conversion rate (mock calculation - would need more data)
        conversion_rate = min(summary['uniqueCustomers'] / max(summary['totalUnits'], 1) * 100, 100)

        return SalesKPI(
            totalRevenue=summary['totalRevenue'],
            totalUnits=summary['totalUnits'],
            avgOrderValue=summary['avgOrderValue'],
            uniqueCustomers=summary['uniqueCustomers'],
            revenueGrowth=revenue_growth,
            conversionRate=conversion_rate
        )

    async def _get_product_performance(self, filters: Dict[str, Any]) -> List[ProductPerformance]:
        """Get product performance data"""

        products = await self.data_service.get_sales_by_product(filters, limit=10)

        # Calculate total revenue for market share
        total_revenue = sum(p['revenue'] for p in products)

        return [
            ProductPerformance(
                productName=p['productName'],
                category=p['category'],
                revenue=p['revenue'],
                unitsSold=p['unitsSold'],
                avgPrice=p['avgPrice'],
                marketShare=(p['revenue'] / total_revenue * 100) if total_revenue > 0 else 0
            )
            for p in products
        ]

    async def _get_region_performance(self, filters: Dict[str, Any]) -> List[RegionPerformance]:
        """Get regional performance data"""

        regions = await self.data_service.get_sales_by_region(filters)

        # Calculate growth rates if date range provided
        result = []

        # Get previous period data for growth calculation
        prev_regions_dict = {}
        if filters.get('dateFrom') and filters.get('dateTo'):
            prev_filters = self._get_previous_period_filters(filters)
            prev_regions = await self.data_service.get_sales_by_region(prev_filters)
            prev_regions_dict = {r['regionName']: r for r in prev_regions}

        for region in regions:
            # Calculate growth rate if previous period data exists
            growth_rate = 0.0
            region_name = region['regionName']
            if region_name in prev_regions_dict:
                prev_revenue = prev_regions_dict[region_name]['revenue']
                curr_revenue = region['revenue']
                if prev_revenue > 0:
                    growth_rate = ((curr_revenue - prev_revenue) / prev_revenue * 100)

            result.append(RegionPerformance(
                regionName=region['regionName'],
                customerCount=region['customerCount'],
                revenue=region['revenue'],
                units=region['units'],
                avgTransactionValue=region['avgTransactionValue'],
                growthRate=growth_rate
            ))

        return result

    async def _get_sales_trends(self, filters: Dict[str, Any]) -> List[SalesTrend]:
        """Get sales trends over time"""

        trends = await self.data_service.get_sales_trends(filters)

        return [
            SalesTrend(
                date=str(t['date']),
                revenue=t['revenue'],
                units=t['units'],
                customers=t['customers'],
                transactions=t['transactions']
            )
            for t in trends
        ]

    async def _get_category_performance(self, filters: Dict[str, Any]) -> List[CategoryPerformance]:
        """Get category performance data"""

        categories = await self.data_service.get_sales_by_category(filters)

        return [
            CategoryPerformance(
                category=c['category'],
                productCount=c['productCount'],
                revenue=c['revenue'],
                units=c['units'],
                avgPrice=c['avgPrice']
            )
            for c in categories
        ]

    async def _get_top_customers(self, filters: Dict[str, Any]) -> List[TopCustomer]:
        """Get top customers data"""

        customers = await self.data_service.get_top_customers(filters, limit=10)

        return [
            TopCustomer(
                customerName=c['customerName'],
                segment=c['segment'],
                purchaseDays=c['purchaseDays'],
                totalRevenue=c['totalRevenue'],
                totalUnits=c['totalUnits'],
                avgOrderValue=c['avgOrderValue']
            )
            for c in customers
        ]

    def _get_previous_period_filters(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get filters for previous period comparison"""

        prev_filters = filters.copy()

        # Handle new dateFrom/dateTo format
        if filters.get('dateFrom') and filters.get('dateTo'):
            # Parse dates
            start = datetime.fromisoformat(filters['dateFrom'])
            end = datetime.fromisoformat(filters['dateTo'])

            # Calculate period length
            period_days = (end - start).days

            # Set previous period
            prev_filters['dateFrom'] = (start - timedelta(days=period_days)).isoformat()
            prev_filters['dateTo'] = (end - timedelta(days=period_days)).isoformat()

        return prev_filters

    async def analyze_sales_performance(self, filters: Dict[str, Any] = {}) -> Dict:
        """Analyze sales performance with insights"""

        data = await self.get_dashboard_data(filters)

        # Generate insights
        insights = []

        # Revenue insights
        if data['kpis']['revenueGrowth'] > 10:
            insights.append({
                'type': 'positive',
                'message': f"Revenue growing strongly at {data['kpis']['revenueGrowth']:.1f}%"
            })
        elif data['kpis']['revenueGrowth'] < -5:
            insights.append({
                'type': 'warning',
                'message': f"Revenue declining by {abs(data['kpis']['revenueGrowth']):.1f}%"
            })

        # Product insights
        if data['productPerformance']:
            top_product = data['productPerformance'][0]
            insights.append({
                'type': 'info',
                'message': f"Top product: {top_product['productName']} with {top_product['marketShare']:.1f}% market share"
            })

        # Regional insights
        if data['regionPerformance']:
            top_region = max(data['regionPerformance'], key=lambda x: x['revenue'])
            insights.append({
                'type': 'info',
                'message': f"Best performing region: {top_region['regionName']}"
            })

        data['insights'] = insights
        return data