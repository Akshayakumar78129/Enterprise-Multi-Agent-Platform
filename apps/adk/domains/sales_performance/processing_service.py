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

        # Fetch all data components
        kpis = await self._get_kpis(filters)
        product_performance = await self._get_product_performance(filters)
        region_performance = await self._get_region_performance(filters)
        sales_trends = await self._get_sales_trends(filters)
        category_performance = await self._get_category_performance(filters)
        top_customers = await self._get_top_customers(filters)

        # Create response
        response = SalesPerformanceResponse(
            kpis=kpis,
            productPerformance=product_performance,
            regionPerformance=region_performance,
            salesTrends=sales_trends,
            categoryPerformance=category_performance,
            topCustomers=top_customers,
            filters=filters
        )

        return response.dict()

    async def _get_kpis(self, filters: Dict[str, Any]) -> SalesKPI:
        """Calculate KPI metrics"""

        # Get current period data
        summary = await self.data_service.get_sales_summary(filters)

        # Calculate growth if date range provided
        revenue_growth = 0
        if filters.get('dateRange'):
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

        # Calculate growth rates (would need historical data)
        result = []
        for region in regions:
            # Mock growth calculation
            growth_rate = 5.0  # Would calculate from historical data

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

        if 'dateRange' in filters and filters['dateRange']:
            date_range = filters['dateRange']
            if 'startDate' in date_range and 'endDate' in date_range:
                # Parse dates
                start = datetime.fromisoformat(date_range['startDate'])
                end = datetime.fromisoformat(date_range['endDate'])

                # Calculate period length
                period_days = (end - start).days

                # Set previous period
                prev_filters['dateRange'] = {
                    'startDate': (start - timedelta(days=period_days)).isoformat(),
                    'endDate': (end - timedelta(days=period_days)).isoformat()
                }

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