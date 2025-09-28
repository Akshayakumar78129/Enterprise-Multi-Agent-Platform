"""Processing service for revenue analysis"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import RevenueAnalysisDataService
from .models import RevenueKPI, RevenueBreakdown, RevenueStream, RevenueAnalysisResponse
import logging

logger = logging.getLogger(__name__)

class RevenueAnalysisProcessingService:
    """Processing service for revenue analysis"""

    def __init__(self):
        self.data_service = RevenueAnalysisDataService()

    @cache_dashboard_endpoint("revenue_analysis")
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete revenue analysis dashboard data"""
        try:
            # Get revenue summary
            summary = await self.data_service.get_revenue_summary(filters)
            
            # Get revenue breakdown
            breakdown_data = await self.data_service.get_revenue_breakdown(filters)
            
            # Calculate KPIs
            kpis = self._calculate_kpis(summary, breakdown_data)
            
            # Generate breakdown
            breakdown = self._generate_breakdown(breakdown_data)
            
            # Generate revenue streams
            streams = self._generate_streams(breakdown_data)
            
            # Generate insights
            insights = self._generate_insights(kpis, breakdown)
            
            response = RevenueAnalysisResponse(
                kpis=kpis,
                breakdown=breakdown,
                streams=streams,
                insights=insights,
                filters=filters
            )
            
            return response.dict()
            
        except Exception as e:
            logger.error(f"Error generating revenue analysis dashboard: {str(e)}")
            raise

    def _calculate_kpis(self, summary: Dict[str, Any], breakdown_data: List[Dict[str, Any]]) -> RevenueKPI:
        """Calculate revenue KPIs"""
        total_revenue = summary.get('total_revenue', 0)
        total_transactions = summary.get('total_transactions', 0)
        unique_customers = summary.get('unique_customers', 0)
        
        # Calculate derived metrics
        avg_order_value = total_revenue / total_transactions if total_transactions > 0 else 0
        revenue_per_customer = total_revenue / unique_customers if unique_customers > 0 else 0
        
        # Mock calculations for gross margin and growth (would need cost data)
        gross_margin = 35.0  # 35% default
        revenue_growth = 8.5  # 8.5% default
        profitability = gross_margin * 0.8  # Simplified calculation
        
        return RevenueKPI(
            totalRevenue=total_revenue,
            grossMargin=gross_margin,
            revenueGrowth=revenue_growth,
            profitability=profitability,
            avgOrderValue=avg_order_value,
            revenuePerCustomer=revenue_per_customer
        )

    def _generate_breakdown(self, breakdown_data: List[Dict[str, Any]]) -> List[RevenueBreakdown]:
        """Generate revenue breakdown"""
        if not breakdown_data:
            return []
        
        total_revenue = sum(item['revenue'] for item in breakdown_data)
        breakdown = []
        
        # Group by category
        category_totals = {}
        for item in breakdown_data:
            category = item['category']
            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += item['revenue']
        
        for category, revenue in category_totals.items():
            percentage = (revenue / total_revenue * 100) if total_revenue > 0 else 0
            breakdown.append(RevenueBreakdown(
                category=category,
                revenue=revenue,
                percentage=percentage,
                growth=5.0,  # Mock growth rate
                margin=30.0  # Mock margin
            ))
        
        return sorted(breakdown, key=lambda x: x.revenue, reverse=True)

    def _generate_streams(self, breakdown_data: List[Dict[str, Any]]) -> List[RevenueStream]:
        """Generate revenue streams"""
        streams = [
            RevenueStream(stream="Product Sales", amount=800000, contribution=65.0, trend="growing"),
            RevenueStream(stream="Service Revenue", amount=300000, contribution=25.0, trend="stable"),
            RevenueStream(stream="Subscription", amount=120000, contribution=10.0, trend="growing")
        ]
        return streams

    def _generate_insights(self, kpis: RevenueKPI, breakdown: List[RevenueBreakdown]) -> List[str]:
        """Generate revenue insights"""
        insights = []
        
        if kpis.revenueGrowth > 10:
            insights.append(f"Strong revenue growth of {kpis.revenueGrowth:.1f}%")
        elif kpis.revenueGrowth < 0:
            insights.append(f"Revenue declining by {abs(kpis.revenueGrowth):.1f}%")
        
        if kpis.grossMargin > 40:
            insights.append(f"Excellent gross margin of {kpis.grossMargin:.1f}%")
        elif kpis.grossMargin < 20:
            insights.append(f"Low gross margin of {kpis.grossMargin:.1f}% needs attention")
        
        if breakdown:
            top_category = breakdown[0]
            insights.append(f"Top revenue category: {top_category.category} ({top_category.percentage:.1f}%)")
        
        return insights
