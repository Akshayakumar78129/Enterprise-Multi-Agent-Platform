"""Processing service for inventory level analysis"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
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
    """Processing service for inventory level operations"""

    def __init__(self):
        self.data_service = InventoryLevelDataService()
        logger.info("InventoryLevelService initialized")

    @cache_dashboard_endpoint("inventory_level.get_dashboard_data")
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete dashboard data with all metrics"""
        try:
            # Get all data components
            kpis = await self.get_inventory_kpis(filters)
            stock_levels = await self.get_stock_levels(filters)
            movements = await self.get_inventory_movements(filters)
            alerts = await self.get_alerts(filters)
            insights = await self.get_insights(filters)

            # Build response
            response = InventoryLevelResponse(
                kpis=InventoryKPI(**kpis),
                stockLevels=[StockLevel(**sl) for sl in stock_levels],
                movements=[InventoryMovement(**mv) for mv in movements],
                alerts=alerts,
                insights=insights,
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

    @cache_dashboard_endpoint("inventory_level.get_inventory_kpis")
    async def get_inventory_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get inventory KPIs"""
        try:
            return await self.data_service.get_inventory_kpis(filters)
        except Exception as e:
            logger.error(f"Error getting inventory KPIs: {e}")
            return InventoryKPI().model_dump()

    @cache_dashboard_endpoint("inventory_level.get_stock_levels")
    async def get_stock_levels(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get stock level details"""
        try:
            return await self.data_service.get_stock_levels(filters)
        except Exception as e:
            logger.error(f"Error getting stock levels: {e}")
            return []

    @cache_dashboard_endpoint("inventory_level.get_inventory_movements")
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
                alerts.append(f"ALERT: {len(low_stock)} items below minimum stock level")

            # Get KPIs for additional alerts
            kpis = await self.data_service.get_inventory_kpis(filters)

            # Check turnover rate
            if kpis.get('stockTurnover', 0) < 4:
                alerts.append("INFO: Low stock turnover rate detected")

            # Check days on hand
            if kpis.get('averageDaysOnHand', 0) > 60:
                alerts.append("WARNING: High average days on hand - review slow-moving items")

            return alerts[:5]  # Limit to 5 alerts

        except Exception as e:
            logger.error(f"Error generating alerts: {e}")
            return []

    async def get_insights(self, filters: Dict[str, Any] = {}) -> List[str]:
        """Generate inventory insights"""
        try:
            insights = []

            # Get data for insights
            kpis = await self.data_service.get_inventory_kpis(filters)
            stock_levels = await self.data_service.get_stock_levels(filters, limit=5)

            # Generate insights based on data
            if kpis.get('stockTurnover', 0) > 12:
                insights.append("SUCCESS: Excellent inventory turnover indicates efficient stock management")

            if kpis.get('totalInventoryValue', 0) > 0:
                insights.append(f"INVENTORY VALUE: Total inventory value: ${kpis['totalInventoryValue']:,.2f}")

            # Top performing items
            if stock_levels:
                top_item = stock_levels[0]
                insights.append(f"TOP PERFORMER: Top item: {top_item['itemName']} with ${top_item['stockValue']:,.2f} in stock")

            # Stock status distribution
            normal_count = sum(1 for sl in stock_levels if sl['status'] == 'normal')
            if normal_count > len(stock_levels) * 0.7:
                insights.append(f"STOCK HEALTH: {normal_count}/{len(stock_levels)} items at optimal stock levels")

            return insights[:5]  # Limit to 5 insights

        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return []

    async def analyze_inventory_health(self, filters: Dict[str, Any] = {}) -> Dict:
        """Analyze overall inventory health"""
        try:
            data = await self.get_dashboard_data(filters)
            kpis = data.get('kpis', {})

            health_score = 0
            health_factors = []

            # Evaluate turnover rate
            turnover = kpis.get('stockTurnover', 0)
            if turnover >= 12:
                health_score += 25
                health_factors.append("Excellent turnover rate")
            elif turnover >= 6:
                health_score += 15
                health_factors.append("Good turnover rate")
            else:
                health_score += 5
                health_factors.append("Low turnover rate needs attention")

            # Evaluate stockout risk
            stockout_risk = kpis.get('stockoutRisk', 0)
            if stockout_risk < 5:
                health_score += 25
                health_factors.append("Low stockout risk")
            elif stockout_risk < 10:
                health_score += 15
                health_factors.append("Moderate stockout risk")
            else:
                health_score += 5
                health_factors.append("High stockout risk")

            # Evaluate days on hand
            days_on_hand = kpis.get('averageDaysOnHand', 0)
            if days_on_hand <= 30:
                health_score += 25
                health_factors.append("Optimal days on hand")
            elif days_on_hand <= 60:
                health_score += 15
                health_factors.append("Acceptable days on hand")
            else:
                health_score += 5
                health_factors.append("Excessive days on hand")

            # Evaluate accuracy
            accuracy = kpis.get('inventoryAccuracy', 0)
            if accuracy >= 95:
                health_score += 25
                health_factors.append("High inventory accuracy")
            elif accuracy >= 90:
                health_score += 15
                health_factors.append("Good inventory accuracy")
            else:
                health_score += 5
                health_factors.append("Inventory accuracy needs improvement")

            return {
                'healthScore': health_score,
                'healthStatus': self._get_health_status(health_score),
                'factors': health_factors,
                'recommendations': self._get_recommendations(health_score, health_factors)
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

    def _get_recommendations(self, score: float, factors: List[str]) -> List[str]:
        """Generate recommendations based on health analysis"""
        recommendations = []

        if score < 80:
            if "Low turnover rate" in str(factors):
                recommendations.append("Review slow-moving inventory items")
                recommendations.append("Consider promotional activities to increase turnover")

            if "stockout risk" in str(factors).lower():
                recommendations.append("Adjust reorder points for high-demand items")
                recommendations.append("Implement safety stock for critical items")

            if "Excessive days on hand" in str(factors):
                recommendations.append("Identify and liquidate obsolete inventory")
                recommendations.append("Optimize ordering quantities")

        return recommendations