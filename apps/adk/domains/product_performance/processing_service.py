"""Processing service for product performance analysis"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from .data_service import ProductPerformanceDataService


class ProductPerformanceProcessingService:
    """Business logic for product performance analysis"""

    def __init__(self):
        self.data_service = ProductPerformanceDataService()

    async def get_dashboard_summary(self, filters: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Get complete dashboard summary data"""

        # Set default date range if not provided
        if not filters.get('dateFrom') or not filters.get('dateTo'):
            end_date = datetime.now()
            start_date = end_date - timedelta(days=90)
            filters['dateFrom'] = start_date.strftime('%Y-%m-%d')
            filters['dateTo'] = end_date.strftime('%Y-%m-%d')

        # Get all required data in parallel
        kpis = await self.data_service.get_product_kpis(filters)
        top_products = await self.data_service.get_top_products(filters, limit=10)
        category_performance = await self.data_service.get_category_performance(filters)
        margin_analysis = await self.data_service.get_margin_analysis(filters)

        # Calculate total margin from products
        total_margin = sum(p.get('margin', 0) for p in top_products)
        total_revenue = kpis.get('totalRevenue', 0)
        avg_margin_pct = (total_margin / total_revenue * 100) if total_revenue > 0 else 0

        # Calculate top category
        top_category = category_performance[0] if category_performance else {'category': 'N/A', 'revenue': 0}

        # Build KPI metrics
        kpi_metrics = {
            'totalRevenue': kpis.get('totalRevenue', 0),
            'totalUnits': kpis.get('totalUnits', 0),
            'avgPrice': kpis.get('avgPrice', 0),
            'avgMargin': avg_margin_pct,
            'topCategory': {
                'name': top_category.get('category', 'N/A'),
                'revenue': top_category.get('revenue', 0)
            },
            'totalProducts': kpis.get('totalProducts', 0)
        }

        # Build main data
        main_data = {
            'topProducts': top_products,
            'categoryPerformance': category_performance,
            'marginAnalysis': margin_analysis[:20],  # Top 20 by margin
            'priceBandDistribution': self._calculate_price_bands(top_products)
        }

        # Generate insights
        insights = self._generate_insights(kpi_metrics, top_products, category_performance, margin_analysis)

        # Metadata
        metadata = {
            'dateFrom': filters.get('dateFrom'),
            'dateTo': filters.get('dateTo'),
            'filtersApplied': filters,
            'timestamp': datetime.now().isoformat()
        }

        return {
            'kpiMetrics': kpi_metrics,
            'mainData': main_data,
            'insights': insights,
            'metadata': metadata
        }

    def _calculate_price_bands(self, products: List[Dict]) -> List[Dict]:
        """Calculate price band distribution"""
        if not products:
            return []

        # Define price bands
        bands = [
            {'name': '$0-$50', 'min': 0, 'max': 50, 'count': 0, 'revenue': 0},
            {'name': '$50-$100', 'min': 50, 'max': 100, 'count': 0, 'revenue': 0},
            {'name': '$100-$500', 'min': 100, 'max': 500, 'count': 0, 'revenue': 0},
            {'name': '$500+', 'min': 500, 'max': float('inf'), 'count': 0, 'revenue': 0}
        ]

        # Categorize products into bands
        for product in products:
            avg_price = product.get('avgPrice', 0)
            revenue = product.get('revenue', 0)

            for band in bands:
                if band['min'] <= avg_price < band['max']:
                    band['count'] += 1
                    band['revenue'] += revenue
                    break

        return bands

    def _generate_insights(self, kpis: Dict, top_products: List[Dict],
                           categories: List[Dict], margins: List[Dict]) -> List[str]:
        """Generate actionable insights"""
        insights = []

        # Top product insight
        if top_products:
            top = top_products[0]
            insights.append(
                f"Top performing product: {top['productName']} generating "
                f"${top['revenue']:,.0f} in revenue ({top['marginPercent']:.1f}% margin)"
            )

        # Category insight
        if categories:
            top_cat = categories[0]
            total_revenue = kpis.get('totalRevenue', 0)
            cat_share = (top_cat['revenue'] / total_revenue * 100) if total_revenue > 0 else 0
            insights.append(
                f"{top_cat['category']} is the top category with {cat_share:.1f}% "
                f"of total revenue (${top_cat['revenue']:,.0f})"
            )

        # Margin insight
        avg_margin = kpis.get('avgMargin', 0)
        if avg_margin > 0:
            high_margin_products = [m for m in margins if m.get('marginPercent', 0) > avg_margin]
            insights.append(
                f"{len(high_margin_products)} products have above-average margin "
                f"(>{avg_margin:.1f}%). Focus on promoting these items."
            )

        # Low margin warning
        low_margin = [m for m in margins if m.get('marginPercent', 0) < 20]
        if low_margin:
            insights.append(
                f"Warning: {len(low_margin)} products have margins below 20%. "
                f"Review pricing or cost structure."
            )

        # Price band insight
        if top_products:
            avg_price = kpis.get('avgPrice', 0)
            insights.append(
                f"Average product price is ${avg_price:.2f}. "
                f"Consider upselling strategies for higher-priced items."
            )

        return insights
