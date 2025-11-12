"""Processing service for slow moving stock - Business logic layer"""

import logging
from typing import Dict, Any, List
from .data_service import SlowMovingStockDataService

logger = logging.getLogger(__name__)


class SlowMovingStockProcessingService:
    """Processing service for slow moving stock analysis"""

    def __init__(self):
        self.data_service = SlowMovingStockDataService()
        logger.info("SlowMovingStockService initialized")

    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Get all dashboard data"""

        try:
            # Fetch all data in parallel
            kpis = await self.data_service.get_kpis(filters)
            slow_moving_items = await self.data_service.get_slow_moving_items(filters)
            turnover_distribution = await self.data_service.get_turnover_distribution(filters)
            aging_analysis = await self.data_service.get_aging_analysis(filters)
            category_analysis = await self.data_service.get_category_analysis(filters)

            # Generate insights
            insights = self._generate_insights(kpis, slow_moving_items, turnover_distribution, aging_analysis)

            return {
                'kpis': kpis,
                'slowMovingItems': slow_moving_items,
                'turnoverDistribution': turnover_distribution,
                'agingAnalysis': aging_analysis,
                'categoryAnalysis': category_analysis,
                'insights': insights
            }

        except Exception as e:
            logger.error(f"Error in get_dashboard_data: {str(e)}", exc_info=True)
            raise

    def _generate_insights(
        self,
        kpis: Dict,
        slow_moving_items: List[Dict],
        turnover_distribution: List[Dict],
        aging_analysis: List[Dict]
    ) -> List[str]:
        """Generate actionable insights for slow moving stock"""
        insights = []

        # Analyze slow moving items percentage
        total_items = kpis.get('totalItems', 0)
        slow_count = kpis.get('slowMovingItems', 0)
        if total_items > 0:
            slow_percentage = (slow_count / total_items) * 100
            if slow_percentage > 30:
                insights.append(
                    f"⚠️ CRITICAL: {slow_percentage:.0f}% ({slow_count}) of inventory is slow-moving. "
                    f"**Action:** Implement immediate clearance strategy within 30 days, focusing on items "
                    f"with lowest turnover. Expected: ${kpis.get('carryingCost', 0):,.0f} reduction in carrying costs."
                )
            elif slow_percentage < 10:
                insights.append(
                    f"✅ OPTIMAL: Only {slow_percentage:.0f}% of inventory is slow-moving, indicating excellent "
                    f"stock management. **Action:** Maintain current purchasing and inventory practices."
                )

        # Analyze average turnover rate
        avg_turnover = kpis.get('avgTurnoverRate', 0)
        if avg_turnover < 30:
            insights.append(
                f"📊 LOW TURNOVER: Average turnover rate of {avg_turnover:.1f} turns/year is below industry standards. "
                f"**Action:** Review demand forecasting models, implement dynamic pricing strategies, "
                f"and reduce order quantities for bottom 20% performers. Expected: 50% improvement within 6 months."
            )
        elif avg_turnover > 80:
            insights.append(
                f"🎯 HIGH EFFICIENCY: Average turnover rate of {avg_turnover:.1f} turns/year demonstrates "
                f"excellent inventory velocity. **Action:** Continue current strategies and explore expansion opportunities."
            )

        # Analyze aging
        if aging_analysis:
            aged_180_plus = next((item for item in aging_analysis if '180+' in item.get('agingPeriod', '')), None)
            if aged_180_plus:
                aged_count = aged_180_plus.get('itemCount', 0)
                aged_value = aged_180_plus.get('totalValue', 0)
                if aged_count > 0:
                    insights.append(
                        f"⏰ AGING RISK: {aged_count} items (${aged_value:,.0f}) haven't sold in 180+ days. "
                        f"**Action:** Implement liquidation plan with 30-50% discounts, bundle deals, or "
                        f"consider donation for tax benefits. Expected: Recovery of ${aged_value * 0.3:,.0f}."
                    )

        # Analyze turnover distribution
        if turnover_distribution:
            very_slow = next((item for item in turnover_distribution if 'Very Slow' in item.get('category', '')), None)
            if very_slow:
                vs_count = very_slow.get('itemCount', 0)
                vs_value = very_slow.get('totalValue', 0)
                if vs_count > 0:
                    insights.append(
                        f"🐌 VERY SLOW MOVERS: {vs_count} items with <2 turns/year tie up ${vs_value:,.0f} in capital. "
                        f"**Action:** Halt replenishment immediately, launch aggressive promotion campaigns, "
                        f"negotiate return-to-vendor agreements. Expected: Free up 40% of tied capital."
                    )

        # Analyze carrying costs
        carrying_cost = kpis.get('carryingCost', 0)
        total_value = kpis.get('totalInventoryValue', 0)
        if total_value > 0:
            cost_percentage = (carrying_cost / total_value) * 100
            if cost_percentage > 20:
                insights.append(
                    f"💰 HIGH CARRYING COST: ${carrying_cost:,.0f} ({cost_percentage:.0f}% of inventory value) "
                    f"in carrying costs for aged stock. **Action:** Prioritize aged inventory reduction, "
                    f"implement ABC analysis, focus resources on high-value slow movers. Expected: 30% cost reduction."
                )

        # General recommendation if few insights
        if len(insights) < 2:
            insights.append(
                f"📈 MONITORING: Inventory health is stable. Continue monitoring turnover rates, "
                f"review slow-moving items monthly, and adjust reorder points based on seasonal demand patterns."
            )

        return insights[:5]  # Limit to top 5 insights
