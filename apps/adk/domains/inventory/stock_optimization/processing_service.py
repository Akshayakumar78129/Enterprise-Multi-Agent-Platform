"""Processing service for stock optimization analysis"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import math
import asyncio
from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import StockOptimizationDataService
from .models import *

logger = logging.getLogger(__name__)


class StockOptimizationProcessingService:
    """Processing service for stock optimization operations"""

    def __init__(self):
        self.data_service = StockOptimizationDataService()
        self.default_lead_time_days = 7  # Default lead time
        self.default_service_level = 0.95  # 95% service level
        self.default_holding_cost_rate = 0.25  # 25% annual holding cost
        self.default_ordering_cost = 50.0  # $50 per order
        self.z_score_95 = 1.65  # Z-score for 95% service level
        logger.info("StockOptimizationService initialized")

    @cache_dashboard_endpoint(dashboard_type='stock_optimization', ttl=300)
    async def get_dashboard_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete dashboard summary with all components"""
        try:
            # Set default date range
            filters.setdefault('dateFrom', '2017-01-01')
            filters.setdefault('dateTo', '2021-12-31')

            # Get detailed sales data for calculations
            detailed_data = await self.data_service.get_detailed_data(filters, limit=1000)

            # Calculate optimization metrics
            recommendations = self._calculate_stock_recommendations(detailed_data, filters)
            kpis = self._calculate_kpis(recommendations, detailed_data)
            metrics = self._calculate_optimization_metrics(recommendations)
            reorder_analysis = self._calculate_reorder_analysis(recommendations[:20])

            # Generate insights
            rule_based_insights = self._generate_rule_based_insights(kpis, recommendations)
            ai_insights = await self._get_cached_ai_insights(kpis, recommendations, filters)
            combined_insights = rule_based_insights + ai_insights

            return {
                'kpiMetrics': kpis,
                'recommendations': recommendations[:50],  # Top 50 items
                'metrics': metrics,
                'reorderAnalysis': reorder_analysis,
                'insights': combined_insights,
                'filters': filters
            }

        except Exception as e:
            logger.error(f"Error getting dashboard summary: {e}", exc_info=True)
            return {
                'kpiMetrics': self._get_default_kpis(),
                'recommendations': [],
                'metrics': [],
                'reorderAnalysis': [],
                'insights': ["Unable to load stock optimization data. Please try again."],
                'filters': filters
            }

    def _calculate_stock_recommendations(
        self,
        sales_data: List[Dict],
        filters: Dict
    ) -> List[Dict]:
        """Calculate stock optimization recommendations for each item"""
        recommendations = []

        for item_data in sales_data:
            try:
                # Extract item metrics
                item = item_data.get('item', 'Unknown')
                category = item_data.get('category', 'Unknown')
                total_quantity = item_data.get('quantity', 0) or 0
                total_value = item_data.get('value', 0) or 0
                transactions = item_data.get('transactions', 0) or 0

                if total_quantity <= 0:
                    continue

                # Calculate demand metrics
                # Assume date range is approximately 5 years (2017-2021)
                days_in_period = 365 * 5
                daily_demand = total_quantity / days_in_period
                annual_demand = daily_demand * 365

                # Calculate demand variability (coefficient of variation estimate)
                # Simplified: assume variability based on transaction frequency
                avg_quantity_per_transaction = total_quantity / transactions if transactions > 0 else total_quantity
                demand_variability = math.sqrt(avg_quantity_per_transaction) if avg_quantity_per_transaction > 0 else 1

                # Calculate EOQ (Economic Order Quantity)
                unit_cost = total_value / total_quantity if total_quantity > 0 else 10
                holding_cost_per_unit = unit_cost * self.default_holding_cost_rate

                if holding_cost_per_unit > 0 and annual_demand > 0:
                    eoq = math.sqrt((2 * annual_demand * self.default_ordering_cost) / holding_cost_per_unit)
                else:
                    eoq = 100  # Default EOQ

                # Calculate safety stock
                lead_time_demand = daily_demand * self.default_lead_time_days
                lead_time_demand_std = demand_variability * math.sqrt(self.default_lead_time_days)
                safety_stock = self.z_score_95 * lead_time_demand_std

                # Calculate reorder point
                reorder_point = lead_time_demand + safety_stock

                # Estimate current stock level (assume 30 days of inventory)
                current_level = daily_demand * 30

                # Recommended level = safety stock + EOQ/2 (average cycle stock)
                recommended_level = safety_stock + (eoq / 2)

                # Calculate potential savings
                current_holding_cost = current_level * holding_cost_per_unit
                optimized_holding_cost = recommended_level * holding_cost_per_unit
                savings = max(0, current_holding_cost - optimized_holding_cost)

                # Order frequency (times per year)
                order_frequency = annual_demand / eoq if eoq > 0 else 12

                recommendations.append({
                    'itemName': item,
                    'category': category,
                    'currentLevel': int(current_level),
                    'recommendedLevel': int(recommended_level),
                    'reorderPoint': int(reorder_point),
                    'safetyStock': int(safety_stock),
                    'orderQuantity': int(eoq),
                    'savings': round(savings, 2),
                    'dailyDemand': round(daily_demand, 2),
                    'annualDemand': round(annual_demand, 2),
                    'leadTime': self.default_lead_time_days,
                    'demandVariability': round(demand_variability, 2),
                    'serviceLevel': self.default_service_level,
                    'orderFrequency': round(order_frequency, 2),
                    'unitCost': round(unit_cost, 2),
                    'stockDifference': int(recommended_level - current_level)
                })

            except Exception as e:
                logger.warning(f"Error calculating recommendation for item: {e}")
                continue

        # Sort by potential savings descending
        recommendations.sort(key=lambda x: x.get('savings', 0), reverse=True)
        return recommendations

    def _calculate_kpis(
        self,
        recommendations: List[Dict],
        sales_data: List[Dict]
    ) -> Dict:
        """Calculate KPI metrics"""
        if not recommendations:
            return self._get_default_kpis()

        total_optimized_value = sum(
            r.get('recommendedLevel', 0) * r.get('unitCost', 0)
            for r in recommendations
        )

        items_needing_reorder = sum(
            1 for r in recommendations
            if r.get('currentLevel', 0) < r.get('reorderPoint', 0)
        )

        avg_safety_stock = sum(r.get('safetyStock', 0) for r in recommendations) / len(recommendations)
        total_current_stock = sum(r.get('currentLevel', 0) for r in recommendations)
        safety_stock_coverage = (avg_safety_stock / (total_current_stock / len(recommendations))) * 100 if total_current_stock > 0 else 0

        avg_order_frequency = sum(r.get('orderFrequency', 0) for r in recommendations) / len(recommendations)

        total_savings = sum(r.get('savings', 0) for r in recommendations)

        avg_service_level = self.default_service_level * 100

        return {
            'total_optimized_value': round(total_optimized_value, 2),
            'items_needing_reorder': items_needing_reorder,
            'safety_stock_coverage': round(safety_stock_coverage, 2),
            'avg_order_frequency': round(avg_order_frequency, 2),
            'total_cost_savings': round(total_savings, 2),
            'service_level': round(avg_service_level, 2),
            'total_items': len(recommendations),
            'items_overstock': sum(1 for r in recommendations if r.get('stockDifference', 0) < -10),
            'items_understock': sum(1 for r in recommendations if r.get('stockDifference', 0) > 10)
        }

    def _get_default_kpis(self) -> Dict:
        """Return default KPI structure"""
        return {
            'total_optimized_value': 0,
            'items_needing_reorder': 0,
            'safety_stock_coverage': 0,
            'avg_order_frequency': 0,
            'total_cost_savings': 0,
            'service_level': 0,
            'total_items': 0,
            'items_overstock': 0,
            'items_understock': 0
        }

    def _calculate_optimization_metrics(self, recommendations: List[Dict]) -> List[Dict]:
        """Calculate before/after optimization metrics"""
        if not recommendations:
            return []

        total_current_stock = sum(r.get('currentLevel', 0) for r in recommendations)
        total_recommended_stock = sum(r.get('recommendedLevel', 0) for r in recommendations)

        current_holding_cost = sum(
            r.get('currentLevel', 0) * r.get('unitCost', 0) * self.default_holding_cost_rate
            for r in recommendations
        )

        optimized_holding_cost = sum(
            r.get('recommendedLevel', 0) * r.get('unitCost', 0) * self.default_holding_cost_rate
            for r in recommendations
        )

        stock_improvement = ((total_recommended_stock - total_current_stock) / total_current_stock * 100) if total_current_stock > 0 else 0
        cost_improvement = ((current_holding_cost - optimized_holding_cost) / current_holding_cost * 100) if current_holding_cost > 0 else 0

        return [
            {
                'metric': 'Total Stock Level',
                'current': round(total_current_stock, 2),
                'optimized': round(total_recommended_stock, 2),
                'improvement': round(stock_improvement, 2)
            },
            {
                'metric': 'Annual Holding Cost',
                'current': round(current_holding_cost, 2),
                'optimized': round(optimized_holding_cost, 2),
                'improvement': round(cost_improvement, 2)
            },
            {
                'metric': 'Service Level',
                'current': 90.0,  # Assumed current
                'optimized': self.default_service_level * 100,
                'improvement': round((self.default_service_level * 100 - 90) / 90 * 100, 2)
            }
        ]

    def _calculate_reorder_analysis(self, recommendations: List[Dict]) -> List[Dict]:
        """Generate reorder analysis for top items"""
        return [
            {
                'itemName': r.get('itemName', 'Unknown'),
                'leadTime': r.get('leadTime', 7),
                'demandVariability': r.get('demandVariability', 0),
                'serviceLevel': r.get('serviceLevel', 0.95) * 100,
                'reorderPoint': r.get('reorderPoint', 0),
                'safetyStock': r.get('safetyStock', 0),
                'dailyDemand': r.get('dailyDemand', 0)
            }
            for r in recommendations[:20]
        ]

    def _generate_rule_based_insights(
        self,
        kpis: Dict,
        recommendations: List[Dict]
    ) -> List[str]:
        """Generate rule-based insights"""
        insights = []

        try:
            total_items = kpis.get('total_items', 0)
            items_needing_reorder = kpis.get('items_needing_reorder', 0)
            total_savings = kpis.get('total_cost_savings', 0)
            items_overstock = kpis.get('items_overstock', 0)
            items_understock = kpis.get('items_understock', 0)

            # Reorder urgency insight
            if items_needing_reorder > 0:
                reorder_pct = (items_needing_reorder / total_items * 100) if total_items > 0 else 0
                insights.append(
                    f"⚠️ {items_needing_reorder} items ({reorder_pct:.1f}%) are below their reorder point and need immediate restocking."
                )

            # Cost savings insight
            if total_savings > 1000:
                insights.append(
                    f"💰 Implementing these optimization recommendations could save ${total_savings:,.2f} annually in holding costs."
                )

            # Overstock insight
            if items_overstock > 0:
                overstock_pct = (items_overstock / total_items * 100) if total_items > 0 else 0
                insights.append(
                    f"📦 {items_overstock} items ({overstock_pct:.1f}%) are overstocked, tying up capital unnecessarily."
                )

            # Understock insight
            if items_understock > 0:
                understock_pct = (items_understock / total_items * 100) if total_items > 0 else 0
                insights.append(
                    f"📉 {items_understock} items ({understock_pct:.1f}%) are understocked, risking stockouts and lost sales."
                )

            # Top items insight
            if recommendations:
                top_item = recommendations[0]
                insights.append(
                    f"🎯 Top optimization opportunity: {top_item.get('itemName')} could save ${top_item.get('savings', 0):,.2f} annually."
                )

        except Exception as e:
            logger.error(f"Error generating rule-based insights: {e}")

        return insights[:5]

    @cache_dashboard_endpoint(dashboard_type='stock_optimization_ai_insights', ttl=1800)
    async def _get_cached_ai_insights(
        self,
        kpis: Dict,
        recommendations: List[Dict],
        filters: Dict
    ) -> List[str]:
        """Get AI-generated insights with caching"""
        try:
            # Run AI generation in thread to avoid blocking
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                kpis,
                recommendations,
                filters
            )
            return ai_insights
        except Exception as e:
            logger.error(f"Error getting AI insights: {e}")
            return []

    def _generate_ai_insights(
        self,
        kpis: Dict,
        recommendations: List[Dict],
        filters: Dict
    ) -> List[str]:
        """Generate AI-powered strategic insights using Gemini"""
        try:
            import google.generativeai as genai
            import os

            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                logger.warning("GEMINI_API_KEY not found, skipping AI insights")
                return []

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash-exp')

            # Prepare context for AI
            top_recommendations = recommendations[:10] if len(recommendations) > 10 else recommendations

            prompt = f"""You are an inventory optimization expert. Analyze the following stock optimization data and provide 2-3 strategic insights.

KPI Metrics:
- Total Items: {kpis.get('total_items', 0)}
- Items Needing Reorder: {kpis.get('items_needing_reorder', 0)}
- Potential Cost Savings: ${kpis.get('total_cost_savings', 0):,.2f}
- Service Level: {kpis.get('service_level', 0):.1f}%
- Items Overstocked: {kpis.get('items_overstock', 0)}
- Items Understocked: {kpis.get('items_understock', 0)}

Top Optimization Opportunities:
{chr(10).join([f"- {r.get('itemName')}: Current={r.get('currentLevel')}, Recommended={r.get('recommendedLevel')}, Savings=${r.get('savings', 0):,.2f}" for r in top_recommendations[:5]])}

Provide strategic insights about:
1. Overall inventory health and optimization priorities
2. Category-specific patterns or concerns
3. Actionable recommendations for improvement

Keep each insight to 1-2 sentences. Be specific and actionable."""

            response = model.generate_content(prompt)
            insights_text = response.text.strip()

            # Parse insights (split by newlines, filter empty)
            insights = [
                line.strip()
                for line in insights_text.split('\n')
                if line.strip() and not line.strip().startswith('#')
            ]

            return insights[:3]

        except Exception as e:
            logger.error(f"Error generating AI insights: {e}", exc_info=True)
            return []
