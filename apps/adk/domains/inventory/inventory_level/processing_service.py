"""Processing service for inventory level analysis with hybrid insights"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import asyncio
from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import InventoryLevelDataService
from .models import (
    InventoryKPI,
    StockLevel,
    InventoryMovement,
    InventoryLevelResponse
)

logger = logging.getLogger(__name__)


class InventoryLevelProcessingService:
    """Processing service for inventory level operations with hybrid insights"""

    def __init__(self):
        self.data_service = InventoryLevelDataService()
        logger.info("InventoryLevelService initialized")

    @cache_dashboard_endpoint("inventory_level.get_dashboard_data", ttl=300)
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete dashboard data with all metrics"""
        try:
            # Get all data components in parallel
            kpis_task = self.get_inventory_kpis(filters)
            stock_levels_task = self.get_stock_levels(filters)
            movements_task = self.get_inventory_movements(filters)
            alerts_task = self.get_alerts(filters)

            # Execute in parallel
            kpis, stock_levels, movements, alerts = await asyncio.gather(
                kpis_task,
                stock_levels_task,
                movements_task,
                alerts_task
            )

            # Generate rule-based insights (fast)
            rule_insights = self._generate_rule_insights(kpis, stock_levels, movements)

            # Get AI insights from separate cache (async, non-blocking)
            ai_insights = await self._get_cached_ai_insights(filters, kpis, stock_levels)

            # Combine insights into single unified array
            combined_insights = rule_insights + ai_insights

            # Build response
            response = InventoryLevelResponse(
                kpis=InventoryKPI(**kpis),
                stockLevels=[StockLevel(**sl) for sl in stock_levels],
                movements=[InventoryMovement(**mv) for mv in movements],
                alerts=alerts,
                insights=combined_insights,
                filters=filters
            )

            return response.model_dump()

        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return {
                'kpis': InventoryKPI().model_dump(),
                'stockLevels': [],
                'movements': [],
                'alerts': [],
                'insights': [],
                'filters': filters
            }

    @cache_dashboard_endpoint("inventory_level.get_inventory_kpis", ttl=300)
    async def get_inventory_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get inventory KPIs"""
        try:
            return await self.data_service.get_inventory_kpis(filters)
        except Exception as e:
            logger.error(f"Error getting inventory KPIs: {e}")
            return InventoryKPI().model_dump()

    @cache_dashboard_endpoint("inventory_level.get_stock_levels", ttl=300)
    async def get_stock_levels(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get stock level details"""
        try:
            return await self.data_service.get_stock_levels(filters)
        except Exception as e:
            logger.error(f"Error getting stock levels: {e}")
            return []

    @cache_dashboard_endpoint("inventory_level.get_inventory_movements", ttl=300)
    async def get_inventory_movements(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get inventory movement trends"""
        try:
            return await self.data_service.get_inventory_movements(filters)
        except Exception as e:
            logger.error(f"Error getting inventory movements: {e}")
            return []

    async def get_alerts(self, filters: Dict[str, Any] = {}) -> List[str]:
        """Generate inventory alerts"""
        try:
            alerts = []

            # Get low stock items
            low_stock = await self.data_service.get_low_stock_items(filters)
            if low_stock:
                alerts.append(f"⚠️ CRITICAL: {len(low_stock)} items below minimum stock level requiring immediate reorder")

            # Get KPIs for additional alerts
            kpis = await self.data_service.get_inventory_kpis(filters)

            # Check turnover rate
            turnover = kpis.get('stockTurnover', 0)
            if turnover < 4:
                alerts.append(f"📊 INFO: Low stock turnover rate ({turnover:.1f}x/year) indicates slow-moving inventory")
            elif turnover > 12:
                alerts.append(f"✅ SUCCESS: Excellent turnover rate ({turnover:.1f}x/year) indicates healthy inventory flow")

            # Check days on hand
            days_on_hand = kpis.get('averageDaysOnHand', 0)
            if days_on_hand > 60:
                alerts.append(f"⏰ WARNING: High average days on hand ({days_on_hand:.0f} days) - review slow-moving items")

            # Check excess stock value
            excess_stock = kpis.get('excessStock', 0)
            if excess_stock > 50000:
                alerts.append(f"💰 HIGH: ${excess_stock:,.0f} in excess stock - consider liquidation strategies")

            return alerts[:5]  # Limit to 5 alerts

        except Exception as e:
            logger.error(f"Error generating alerts: {e}")
            return []

    def _generate_rule_insights(self, kpis: Dict, stock_levels: List[Dict], movements: List[Dict]) -> List[str]:
        """Generate rule-based insights (fast, deterministic)

        These insights are always present and provide immediate value without API calls.
        Focus on data-driven observations with actionable recommendations.

        Returns:
            List of formatted insight strings with priority indicators
        """
        insights = []

        # Turnover analysis
        turnover = kpis.get('stockTurnover', 0)
        if turnover >= 12:
            insights.append(
                f"🎯 HIGH-PERFORMANCE: Excellent inventory turnover rate of {turnover:.1f}x per year "
                f"indicates optimal stock management. **Action:** Maintain current ordering patterns and "
                f"consider expanding fast-moving categories. Expected: Continued efficient capital utilization."
            )
        elif turnover < 4:
            insights.append(
                f"⚠️ CRITICAL: Low turnover rate ({turnover:.1f}x/year) indicates overstocking or slow-moving inventory. "
                f"**Action:** Conduct immediate review of bottom 20% SKUs, implement promotional campaigns within 2 weeks, "
                f"and revise safety stock levels. Expected: 30-40% improvement in turnover, ${kpis.get('totalInventoryValue', 0) * 0.2:,.0f} capital freed."
            )

        # Days on hand analysis
        days_on_hand = kpis.get('averageDaysOnHand', 0)
        if days_on_hand > 90:
            insights.append(
                f"📅 CRITICAL: {days_on_hand:.0f} average days on hand indicates severe overstocking. "
                f"**Action:** Implement immediate 'Days of Inventory Outstanding' (DIO) reduction program, "
                f"targeting 60-day benchmark within 90 days through demand-driven replenishment. "
                f"Expected: ${kpis.get('totalInventoryValue', 0) * 0.25:,.0f} working capital release."
            )
        elif days_on_hand <= 30:
            insights.append(
                f"✅ OPTIMAL: {days_on_hand:.0f} days on hand reflects lean inventory practices. "
                f"**Action:** Monitor for stockout risks and maintain current reorder policies."
            )

        # Stock level status distribution
        if stock_levels:
            low_stock_count = sum(1 for sl in stock_levels if sl.get('status') == 'low')
            excess_count = sum(1 for sl in stock_levels if sl.get('status') == 'excess')
            normal_count = sum(1 for sl in stock_levels if sl.get('status') == 'normal')

            if low_stock_count > len(stock_levels) * 0.15:
                insights.append(
                    f"🔴 HIGH: {low_stock_count} items ({low_stock_count/len(stock_levels)*100:.0f}%) at critically low stock levels. "
                    f"**Action:** Expedite purchase orders for top 10 revenue-critical items within 24 hours, "
                    f"implement automated reorder point alerts. Expected: 90% reduction in stockout incidents."
                )
            elif normal_count > len(stock_levels) * 0.7:
                insights.append(
                    f"✅ STOCK HEALTH: {normal_count}/{len(stock_levels)} items ({normal_count/len(stock_levels)*100:.0f}%) at optimal stock levels, "
                    f"demonstrating effective inventory control."
                )

        # Movement analysis
        if movements and len(movements) >= 7:
            recent_movements = movements[:7]
            avg_net = sum(m.get('netMovement', 0) for m in recent_movements) / 7

            if avg_net < -50:
                insights.append(
                    f"📉 INFO: Negative net movement trend (avg {avg_net:.0f} units/day) over past week. "
                    f"**Action:** Review demand forecasts and adjust replenishment schedules to prevent stockouts. "
                    f"Expected: Balanced inventory levels within 2 weeks."
                )
            elif avg_net > 100:
                insights.append(
                    f"📈 GROWTH: Strong positive net movement (+{avg_net:.0f} units/day) indicates inventory buildup. "
                    f"**Action:** Verify demand forecasts align with inventory accumulation to avoid excess stock."
                )

        # Inventory value insights
        total_value = kpis.get('totalInventoryValue', 0)
        if total_value > 1000000:
            insights.append(
                f"💼 STRATEGIC: High inventory value (${total_value:,.0f}) presents working capital optimization opportunity. "
                f"**Action:** Implement ABC analysis to categorize items, negotiate consignment arrangements for slow-movers, "
                f"target 10-15% inventory reduction. Expected: ${total_value * 0.12:,.0f} capital release for strategic investments."
            )

        # Always provide fallback insights if nothing specific was generated
        if not insights:
            insights = [
                f"📊 INFO: Inventory analysis completed for {len(stock_levels)} items valued at ${total_value:,.0f}",
                "🔍 REVIEW: Regular monitoring of stock levels, turnover rates, and movement patterns recommended for optimization opportunities"
            ]

        return insights[:5]  # Limit to 5 insights

    @cache_dashboard_endpoint("inventory_level.ai_insights", ttl=1800)
    async def _get_cached_ai_insights(
        self,
        filters: Dict,
        kpis: Dict,
        stock_levels: List[Dict]
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
                stock_levels,
                filters
            )
            return ai_insights
        except Exception as e:
            logger.error(f"[InventoryLevelProcessingService] Error in _get_cached_ai_insights: {e}")
            return []  # Graceful fallback

    def _generate_ai_insights(self, kpis: Dict, stock_levels: List[Dict], filters: Dict) -> List[str]:
        """Generate AI-powered strategic insights using Gemini

        This complements rule-based insights with creative, strategic analysis.
        Uses dashboard-specific prompts for consistent, actionable recommendations.

        Args:
            kpis: KPI metrics from dashboard
            stock_levels: Stock level data
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            # Import at method level for error isolation
            from lib.ai_insights_generator import generate_ai_insights

            # Calculate additional metrics for AI context
            total_items = len(stock_levels)
            low_stock_count = sum(1 for sl in stock_levels if sl.get('status') == 'low')
            excess_count = sum(1 for sl in stock_levels if sl.get('status') == 'excess')
            total_value = kpis.get('totalInventoryValue', 0)
            turnover = kpis.get('stockTurnover', 0)
            days_on_hand = kpis.get('averageDaysOnHand', 0)

            # Build context for AI
            kpis_dict = {
                'total_items': total_items,
                'low_stock_count': low_stock_count,
                'excess_stock_count': excess_count,
                'total_inventory_value': total_value,
                'stock_turnover': turnover,
                'average_days_on_hand': days_on_hand,
                'stockout_risk': kpis.get('stockoutRisk', 0),
                'excess_stock_value': kpis.get('excessStock', 0)
            }

            # Top performing items
            top_items = sorted(
                stock_levels[:10],
                key=lambda x: x.get('stockValue', 0),
                reverse=True
            )[:3] if stock_levels else []

            # Categories with issues
            categories_with_low_stock = {}
            for item in stock_levels:
                if item.get('status') == 'low':
                    cat = item.get('category', 'Unknown')
                    categories_with_low_stock[cat] = categories_with_low_stock.get(cat, 0) + 1

            data_summary = {
                'top_value_items': [item.get('itemName', 'Unknown') for item in top_items],
                'categories_at_risk': list(categories_with_low_stock.keys())[:3],
                'low_stock_by_category': dict(list(categories_with_low_stock.items())[:3])
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='inventory_level',
                kpis=kpis_dict,
                data_summary=data_summary,
                filters=filters
            )

            return ai_insights

        except ImportError:
            logger.info("[InventoryLevelProcessingService] AI insights module not available, skipping AI insights")
            return []
        except Exception as e:
            logger.error(f"[InventoryLevelProcessingService] Error generating AI insights: {e}")
            return []  # Graceful fallback

    async def analyze_inventory_health(self, filters: Dict[str, Any] = {}) -> Dict:
        """Analyze overall inventory health"""
        try:
            data = await self.get_dashboard_data(filters)
            kpis = data.get('kpis', {})

            health_score = 0
            health_factors = []

            # Evaluate turnover rate (0-25 points)
            turnover = kpis.get('stockTurnover', 0)
            if turnover >= 12:
                health_score += 25
                health_factors.append("✅ Excellent turnover rate")
            elif turnover >= 6:
                health_score += 15
                health_factors.append("🟢 Good turnover rate")
            else:
                health_score += 5
                health_factors.append("🔴 Low turnover rate needs attention")

            # Evaluate stockout risk (0-25 points)
            stockout_risk = kpis.get('stockoutRisk', 0)
            if stockout_risk < 5:
                health_score += 25
                health_factors.append("✅ Low stockout risk")
            elif stockout_risk < 10:
                health_score += 15
                health_factors.append("🟡 Moderate stockout risk")
            else:
                health_score += 5
                health_factors.append("🔴 High stockout risk")

            # Evaluate days on hand (0-25 points)
            days_on_hand = kpis.get('averageDaysOnHand', 0)
            if days_on_hand <= 30:
                health_score += 25
                health_factors.append("✅ Optimal days on hand")
            elif days_on_hand <= 60:
                health_score += 15
                health_factors.append("🟢 Acceptable days on hand")
            else:
                health_score += 5
                health_factors.append("🔴 Excessive days on hand")

            # Evaluate accuracy (0-25 points)
            accuracy = kpis.get('inventoryAccuracy', 0)
            if accuracy >= 95:
                health_score += 25
                health_factors.append("✅ High inventory accuracy")
            elif accuracy >= 90:
                health_score += 15
                health_factors.append("🟢 Good inventory accuracy")
            else:
                health_score += 5
                health_factors.append("🔴 Inventory accuracy needs improvement")

            return {
                'healthScore': health_score,
                'healthStatus': self._get_health_status(health_score),
                'factors': health_factors,
                'recommendations': self._get_recommendations(health_score, health_factors, kpis)
            }

        except Exception as e:
            logger.error(f"Error analyzing inventory health: {e}")
            return {
                'healthScore': 0,
                'healthStatus': 'Unknown',
                'factors': [],
                'recommendations': []
            }

    def _get_health_status(self, score: float) -> str:
        """Get health status based on score"""
        if score >= 80:
            return "Excellent"
        elif score >= 60:
            return "Good"
        elif score >= 40:
            return "Fair"
        else:
            return "Poor"

    def _get_recommendations(self, score: float, factors: List[str], kpis: Dict) -> List[str]:
        """Generate actionable recommendations based on health analysis"""
        recommendations = []

        if score < 80:
            if "Low turnover rate" in str(factors):
                recommendations.append("📊 **Review slow-moving inventory items** - Identify bottom 20% SKUs and implement targeted promotions within 14 days")
                recommendations.append("💡 **Consider promotional activities** - Launch clearance sales to increase turnover rate by 25-30%")

            if "stockout risk" in str(factors).lower():
                recommendations.append("🎯 **Adjust reorder points for high-demand items** - Review top 10 revenue-generating SKUs and lower trigger points by 15%")
                recommendations.append("🛡️ **Implement safety stock for critical items** - Establish buffer stock equal to 7 days demand for A-class items")

            if "Excessive days on hand" in str(factors):
                total_value = kpis.get('totalInventoryValue', 0)
                recommendations.append(f"🔄 **Identify and liquidate obsolete inventory** - Target ${total_value * 0.15:,.0f} in slow-moving stock reduction")
                recommendations.append("📉 **Optimize ordering quantities** - Implement EOQ (Economic Order Quantity) model to reduce holding costs by 20%")

            if "accuracy needs improvement" in str(factors).lower():
                recommendations.append("✅ **Implement cycle counting program** - Count 20% of items monthly to improve accuracy to 95%+")
                recommendations.append("🔍 **Conduct root cause analysis** - Investigate top 5 variance categories and implement corrective actions within 30 days")

        return recommendations
