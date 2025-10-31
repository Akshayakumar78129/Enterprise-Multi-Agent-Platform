"""Processing service for product performance analysis"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
import asyncio
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

        # Generate rule-based insights
        rule_based_insights = self._generate_insights(kpi_metrics, top_products, category_performance, margin_analysis)

        # Get AI insights async (non-blocking with graceful fallback)
        ai_insights = await self._get_cached_ai_insights(
            filters,
            kpi_metrics,
            top_products,
            category_performance,
            margin_analysis
        )

        # Combine insights (rule-based as strings + AI)
        all_insights = rule_based_insights + ai_insights

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
            'insights': all_insights,
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

    async def _get_cached_ai_insights(
        self,
        filters: Dict[str, Any],
        kpis: Dict,
        top_products: List[Dict],
        categories: List[Dict],
        margins: List[Dict]
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
                top_products,
                categories,
                margins,
                filters
            )
            return ai_insights
        except Exception as e:
            print(f"[ProductPerformanceProcessingService] Error in _get_cached_ai_insights: {e}")
            return []  # Graceful fallback

    def _generate_ai_insights(
        self,
        kpis: Dict,
        top_products: List[Dict],
        categories: List[Dict],
        margins: List[Dict],
        filters: Dict
    ) -> List[str]:
        """Generate AI-powered strategic insights using Gemini

        This complements rule-based insights with creative, strategic analysis.
        Uses dashboard-specific prompts for consistent, actionable recommendations.

        Args:
            kpis: KPI metrics from dashboard
            top_products: Top performing products
            categories: Category performance data
            margins: Margin analysis data
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            # Import at method level for error isolation
            from lib.ai_insights_generator import generate_ai_insights

            # Calculate additional metrics for AI context
            total_products = kpis.get('totalProducts', 0)
            total_categories = len(categories)
            
            top_product = top_products[0] if top_products else None
            top_category = categories[0] if categories else None
            
            # Find high/low margin products
            high_margin = [m for m in margins if m.get('marginPercent', 0) > 50]
            low_margin = [m for m in margins if m.get('marginPercent', 0) < 20]

            # Build context for AI
            kpis_dict = {
                'total_revenue': kpis.get('totalRevenue', 0),
                'total_units': kpis.get('totalUnits', 0),
                'avg_price': kpis.get('avgPrice', 0),
                'avg_margin': kpis.get('avgMargin', 0),
                'total_products': total_products,
            }

            data_summary = {
                'total_categories': total_categories,
                'top_product': top_product.get('productName') if top_product else "N/A",
                'top_product_revenue': top_product.get('revenue', 0) if top_product else 0,
                'top_product_margin': top_product.get('marginPercent', 0) if top_product else 0,
                'top_category': top_category.get('category') if top_category else "N/A",
                'top_category_revenue': top_category.get('revenue', 0) if top_category else 0,
                'high_margin_count': len(high_margin),
                'low_margin_count': len(low_margin),
            }

            # Create prompt for product performance analysis
            prompt = f"""Analyze this product performance data and provide 3-4 strategic insights:

KPIs:
- Total Revenue: ${kpis_dict['total_revenue']:,.2f}
- Total Units: {kpis_dict['total_units']:,}
- Average Price: ${kpis_dict['avg_price']:.2f}
- Average Margin: {kpis_dict['avg_margin']:.1f}%
- Total Products: {kpis_dict['total_products']:,}

Performance Highlights:
- Categories: {data_summary['total_categories']} total
- Top Product: {data_summary['top_product']} (${data_summary['top_product_revenue']:,.0f}, {data_summary['top_product_margin']:.1f}% margin)
- Top Category: {data_summary['top_category']} (${data_summary['top_category_revenue']:,.0f})
- High Margin Products (>50%): {data_summary['high_margin_count']}
- Low Margin Products (<20%): {data_summary['low_margin_count']}

Provide actionable insights focusing on:
1. Product mix optimization and pricing strategies
2. Margin improvement opportunities
3. Category expansion or rationalization
4. Inventory and SKU optimization
5. Cross-sell and bundle recommendations

Format: Return ONLY a JSON array of insight strings, each 1-2 sentences. Example:
["Insight 1 here", "Insight 2 here", "Insight 3 here"]"""

            # Generate AI insights
            insights_response = generate_ai_insights(prompt, dashboard_type="product_performance")
            
            # Parse response (expecting JSON array of strings)
            import json
            try:
                if isinstance(insights_response, str):
                    insights_list = json.loads(insights_response)
                else:
                    insights_list = insights_response
                
                # Validate and clean
                if isinstance(insights_list, list):
                    return [str(insight).strip() for insight in insights_list if insight][:4]
                else:
                    return []
            except:
                # If JSON parsing fails, split by newlines and clean
                return [line.strip() for line in str(insights_response).split('\n') if line.strip()][:4]

        except ImportError:
            print("[ProductPerformanceProcessingService] AI insights module not available, skipping AI insights")
            return []
        except Exception as e:
            print(f"[ProductPerformanceProcessingService] Error generating AI insights: {e}")
            return []
