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
            # Set default date range if not provided
            filters.setdefault('dateFrom', '2017-01-01')
            filters.setdefault('dateTo', '2021-12-31')

            # Calculate actual date range for period calculations
            date_from = datetime.strptime(filters['dateFrom'], '%Y-%m-%d')
            date_to = datetime.strptime(filters['dateTo'], '%Y-%m-%d')
            days_in_period = (date_to - date_from).days + 1

            # Store calculated period in filters for use by other methods
            filters['_calculated_days'] = days_in_period

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

            # Calculate new visualizations
            logger.info(f"Calculating new visualizations with {len(recommendations)} recommendations")

            heatmap_data = self._calculate_inventory_health_heatmap(recommendations, detailed_data)
            logger.info(f"Heatmap data: {len(heatmap_data.get('cells', []))} cells")

            optimization_matrix = self._calculate_optimization_matrix(recommendations)
            logger.info(f"Optimization matrix: {len(optimization_matrix)} items")

            service_level_impact = self._calculate_service_level_impact(recommendations, detailed_data, filters)
            logger.info(f"Service level impact: {len(service_level_impact.get('impactData', []))} data points")

            value_treemap = self._calculate_value_treemap(recommendations)
            logger.info(f"Value treemap: {len(value_treemap)} categories")

            performance_gauge = self._calculate_performance_gauge(kpis, recommendations)
            logger.info(f"Performance gauge: score={performance_gauge.get('score', 0)}")

            return {
                'kpiMetrics': kpis,
                'recommendations': recommendations[:50],  # Top 50 items
                'metrics': metrics,
                'reorderAnalysis': reorder_analysis,
                'insights': combined_insights,
                'heatmapData': heatmap_data,
                'optimizationMatrix': optimization_matrix,
                'serviceLevelImpact': service_level_impact,
                'valueTreemap': value_treemap,
                'performanceGauge': performance_gauge,
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
                'heatmapData': {'cells': [], 'categories': [], 'warehouses': []},
                'optimizationMatrix': [],
                'serviceLevelImpact': {'impactData': [], 'currentServiceLevel': 95, 'optimalServiceLevel': 95},
                'valueTreemap': [],
                'performanceGauge': {'score': 0, 'status': 'unknown', 'serviceScore': 0, 'stockScore': 0, 'costScore': 0, 'breakdown': {}},
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

                # Calculate demand metrics using actual date range
                days_in_period = filters.get('_calculated_days', 365 * 5)  # Fallback to 5 years if not calculated
                daily_demand = total_quantity / days_in_period if days_in_period > 0 else 0
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

                # Apply optimization level to adjust safety stock
                optimization_level = filters.get('optimizationLevel', 'balanced')
                if optimization_level == 'conservative':
                    z_score = 2.33  # 99% service level (higher safety stock)
                    service_level = 0.99
                elif optimization_level == 'aggressive':
                    z_score = 1.28  # 90% service level (lower safety stock)
                    service_level = 0.90
                else:  # balanced
                    z_score = self.z_score_95  # 95% service level
                    service_level = self.default_service_level

                # Calculate safety stock
                lead_time_demand = daily_demand * self.default_lead_time_days
                lead_time_demand_std = demand_variability * math.sqrt(self.default_lead_time_days)
                safety_stock = z_score * lead_time_demand_std

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
                    'serviceLevel': service_level,
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

    def _calculate_inventory_health_heatmap(
        self,
        recommendations: List[Dict],
        sales_data: List[Dict]
    ) -> Dict:
        """Calculate inventory health heatmap data (Category x Warehouse)"""
        try:
            if not recommendations or len(recommendations) == 0:
                logger.warning("No recommendations for heatmap calculation")
                return {'cells': [], 'categories': [], 'warehouses': []}

            # Group recommendations by category and warehouse
            # Since we don't have warehouse data, create multiple virtual warehouses based on categories
            heatmap_cells = {}

            # Create warehouse assignments (distribute categories across warehouses)
            warehouses = ['Warehouse A', 'Warehouse B', 'Warehouse C']

            for rec in recommendations:
                category = rec.get('category', 'Unknown')
                # Assign warehouse based on category hash for consistent distribution
                warehouse_idx = hash(category) % len(warehouses)
                warehouse = warehouses[warehouse_idx]

                # Create unique key for category-warehouse combination
                key = f"{category}|{warehouse}"

                if key not in heatmap_cells:
                    heatmap_cells[key] = {
                        'category': category,
                        'warehouse': warehouse,
                        'items': [],
                        'total_current': 0,
                        'total_recommended': 0,
                        'total_savings': 0,
                        'avg_service_level': 0
                    }

                heatmap_cells[key]['items'].append(rec)
                heatmap_cells[key]['total_current'] += rec.get('currentLevel', 0)
                heatmap_cells[key]['total_recommended'] += rec.get('recommendedLevel', 0)
                heatmap_cells[key]['total_savings'] += rec.get('savings', 0)
                heatmap_cells[key]['avg_service_level'] += rec.get('serviceLevel', 0.95)

            # Calculate health scores for each cell
            heatmap_data = []
            for key, cell in heatmap_cells.items():
                item_count = len(cell['items'])

                # Calculate health score (0-100)
                # Based on: service level achievement, stock optimization ratio, savings potential
                current = cell['total_current']
                recommended = cell['total_recommended']

                # Stock optimization ratio (closer to 1.0 is better)
                if recommended > 0:
                    stock_ratio = current / recommended
                    # Score: 100 when ratio is 0.9-1.1 (optimal range)
                    if 0.9 <= stock_ratio <= 1.1:
                        stock_score = 100
                    elif stock_ratio < 0.9:
                        # Understocked: score decreases
                        stock_score = max(0, 100 - (0.9 - stock_ratio) * 200)
                    else:
                        # Overstocked: score decreases
                        stock_score = max(0, 100 - (stock_ratio - 1.1) * 100)
                else:
                    stock_score = 50

                # Service level score
                avg_service = (cell['avg_service_level'] / item_count) if item_count > 0 else 0.95
                service_score = avg_service * 100

                # Savings opportunity score (inverted - lower savings is better health)
                avg_savings = cell['total_savings'] / item_count if item_count > 0 else 0
                if avg_savings > 1000:
                    savings_score = max(0, 100 - (avg_savings / 100))
                else:
                    savings_score = 100 - (avg_savings / 10)
                savings_score = max(0, min(100, savings_score))

                # Overall health score (weighted average)
                health_score = (stock_score * 0.4 + service_score * 0.3 + savings_score * 0.3)

                heatmap_data.append({
                    'category': cell['category'],
                    'warehouse': cell['warehouse'],
                    'healthScore': round(health_score, 1),
                    'itemCount': item_count,
                    'totalCurrent': round(cell['total_current'], 2),
                    'totalRecommended': round(cell['total_recommended'], 2),
                    'totalSavings': round(cell['total_savings'], 2),
                    'avgServiceLevel': round(avg_service * 100, 1)
                })

            # Get unique categories and warehouses for axes
            categories = sorted(list(set([cell['category'] for cell in heatmap_data])))
            warehouses = sorted(list(set([cell['warehouse'] for cell in heatmap_data])))

            return {
                'cells': heatmap_data,
                'categories': categories,
                'warehouses': warehouses
            }

        except Exception as e:
            logger.error(f"Error calculating heatmap: {e}")
            return {'cells': [], 'categories': [], 'warehouses': []}

    def _calculate_optimization_matrix(self, recommendations: List[Dict]) -> List[Dict]:
        """Calculate optimization matrix data (Effort vs Impact quadrants)"""
        try:
            if not recommendations or len(recommendations) == 0:
                logger.warning("No recommendations for optimization matrix")
                return []

            matrix_data = []

            for rec in recommendations:
                # Calculate implementation effort (0-100)
                # Based on: stock difference magnitude, order quantity changes
                stock_diff = abs(rec.get('stockDifference', 0))
                order_qty = rec.get('orderQuantity', 0)

                # Effort increases with larger stock adjustments
                if stock_diff > 100:
                    effort = min(100, 50 + (stock_diff - 100) / 10)
                else:
                    effort = stock_diff / 2

                # Calculate financial impact (0-100)
                # Based on: savings potential, inventory value
                savings = rec.get('savings', 0)
                current_value = rec.get('currentLevel', 0) * rec.get('unitCost', 0)

                # Impact based on savings amount
                if savings > 1000:
                    impact = min(100, 50 + savings / 100)
                else:
                    impact = savings / 20

                # Determine quadrant
                if impact >= 50 and effort < 50:
                    quadrant = 'Quick Wins'
                    priority = 1
                elif impact >= 50 and effort >= 50:
                    quadrant = 'Major Projects'
                    priority = 2
                elif impact < 50 and effort < 50:
                    quadrant = 'Fill-Ins'
                    priority = 3
                else:
                    quadrant = 'Avoid'
                    priority = 4

                matrix_data.append({
                    'itemName': rec.get('itemName'),
                    'category': rec.get('category'),
                    'effort': round(effort, 1),
                    'impact': round(impact, 1),
                    'savings': round(savings, 2),
                    'itemCount': 1,
                    'quadrant': quadrant,
                    'priority': priority
                })

            # Sort by priority then impact
            matrix_data.sort(key=lambda x: (x['priority'], -x['impact']))

            return matrix_data[:50]  # Top 50 opportunities

        except Exception as e:
            logger.error(f"Error calculating optimization matrix: {e}")
            return []

    def _calculate_service_level_impact(
        self,
        recommendations: List[Dict],
        sales_data: List[Dict],
        filters: Dict
    ) -> Dict:
        """Calculate service level impact simulation data"""
        try:
            if not recommendations or len(recommendations) == 0:
                logger.warning("No recommendations for service level impact")
                return {'impactData': [], 'currentServiceLevel': 95, 'optimalServiceLevel': 95}

            # Service level range: 80% to 99.9%
            service_levels = [0.80, 0.85, 0.90, 0.95, 0.97, 0.99, 0.999]
            z_scores = {
                0.80: 0.84,
                0.85: 1.04,
                0.90: 1.28,
                0.95: 1.65,
                0.97: 1.88,
                0.99: 2.33,
                0.999: 3.09
            }

            impact_data = []

            for sl in service_levels:
                z_score = z_scores[sl]

                # Calculate total inventory value at this service level
                total_inventory = 0
                total_holding_cost = 0
                stockout_probability = (1 - sl) * 100

                for rec in recommendations:
                    # Recalculate safety stock with new service level
                    demand_var = rec.get('demandVariability', 1)
                    lead_time = rec.get('leadTime', 7)
                    safety_stock = z_score * demand_var * math.sqrt(lead_time)

                    # Recalculate recommended level
                    eoq = rec.get('orderQuantity', 100)
                    recommended_level = safety_stock + (eoq / 2)

                    # Calculate inventory value
                    unit_cost = rec.get('unitCost', 10)
                    inventory_value = recommended_level * unit_cost
                    holding_cost = inventory_value * self.default_holding_cost_rate

                    total_inventory += inventory_value
                    total_holding_cost += holding_cost

                impact_data.append({
                    'serviceLevel': sl * 100,
                    'inventoryValue': round(total_inventory, 2),
                    'holdingCost': round(total_holding_cost, 2),
                    'stockoutProbability': round(stockout_probability, 2)
                })

            # Current service level from filters
            current_sl = filters.get('optimizationLevel', 'balanced')
            if current_sl == 'conservative':
                current_service_level = 99
            elif current_sl == 'aggressive':
                current_service_level = 90
            else:
                current_service_level = 95

            return {
                'impactData': impact_data,
                'currentServiceLevel': current_service_level,
                'optimalServiceLevel': 95  # Recommended optimal
            }

        except Exception as e:
            logger.error(f"Error calculating service level impact: {e}")
            return {'impactData': [], 'currentServiceLevel': 95, 'optimalServiceLevel': 95}

    def _calculate_value_treemap(self, recommendations: List[Dict]) -> List[Dict]:
        """Calculate inventory value treemap data (hierarchical by category)"""
        try:
            if not recommendations or len(recommendations) == 0:
                logger.warning("No recommendations for value treemap")
                return []

            # Group by category
            category_groups = {}

            for rec in recommendations:
                category = rec.get('category', 'Unknown')

                if category not in category_groups:
                    category_groups[category] = {
                        'name': category,
                        'children': [],
                        'value': 0,
                        'savings': 0
                    }

                # Calculate item value
                item_value = rec.get('currentLevel', 0) * rec.get('unitCost', 0)
                savings = rec.get('savings', 0)

                # Determine optimization status
                stock_diff = rec.get('stockDifference', 0)
                if stock_diff > 10:
                    status = 'understock'
                elif stock_diff < -10:
                    status = 'overstock'
                else:
                    status = 'optimal'

                category_groups[category]['children'].append({
                    'name': rec.get('itemName'),
                    'value': round(item_value, 2),
                    'savings': round(savings, 2),
                    'status': status
                })

                category_groups[category]['value'] += item_value
                category_groups[category]['savings'] += savings

            # Convert to treemap format
            treemap_data = []
            for category, data in category_groups.items():
                # Determine category color based on overall optimization opportunity
                avg_savings = data['savings'] / len(data['children']) if len(data['children']) > 0 else 0

                if avg_savings > 500:
                    color = 'high'
                elif avg_savings > 200:
                    color = 'medium'
                else:
                    color = 'low'

                treemap_data.append({
                    'name': category,
                    'value': round(data['value'], 2),
                    'savings': round(data['savings'], 2),
                    'itemCount': len(data['children']),
                    'color': color,
                    'children': data['children'][:20]  # Limit to top 20 items per category
                })

            # Sort by value descending
            treemap_data.sort(key=lambda x: x['value'], reverse=True)

            return treemap_data

        except Exception as e:
            logger.error(f"Error calculating value treemap: {e}")
            return []

    def _calculate_performance_gauge(
        self,
        kpis: Dict,
        recommendations: List[Dict]
    ) -> Dict:
        """Calculate overall inventory efficiency performance gauge (0-100)"""
        try:
            # Calculate efficiency score based on multiple factors

            # 1. Service level score (30% weight)
            service_level = kpis.get('service_level', 95)
            service_score = service_level  # Already 0-100

            # 2. Stock optimization score (40% weight)
            # Based on items needing reorder vs total items
            total_items = kpis.get('total_items', 1)
            items_needing_reorder = kpis.get('items_needing_reorder', 0)
            items_overstock = kpis.get('items_overstock', 0)
            items_understock = kpis.get('items_understock', 0)

            # Penalty for items needing attention
            items_optimal = total_items - items_needing_reorder - items_overstock - items_understock
            stock_score = (items_optimal / total_items * 100) if total_items > 0 else 50

            # 3. Cost efficiency score (30% weight)
            # Based on savings potential vs current value
            total_savings = kpis.get('total_cost_savings', 0)
            total_value = kpis.get('total_optimized_value', 1)

            # Lower savings opportunity = higher efficiency
            savings_ratio = total_savings / total_value if total_value > 0 else 0
            if savings_ratio < 0.05:  # Less than 5% savings opportunity
                cost_score = 100
            elif savings_ratio < 0.10:
                cost_score = 90
            elif savings_ratio < 0.20:
                cost_score = 70
            else:
                cost_score = max(40, 100 - (savings_ratio * 200))

            # Overall efficiency score (weighted average)
            efficiency_score = (
                service_score * 0.30 +
                stock_score * 0.40 +
                cost_score * 0.30
            )

            # Determine status
            if efficiency_score >= 80:
                status = 'excellent'
            elif efficiency_score >= 60:
                status = 'good'
            elif efficiency_score >= 40:
                status = 'fair'
            else:
                status = 'poor'

            return {
                'score': round(efficiency_score, 1),
                'status': status,
                'serviceScore': round(service_score, 1),
                'stockScore': round(stock_score, 1),
                'costScore': round(cost_score, 1),
                'breakdown': {
                    'optimal_items': items_optimal,
                    'attention_needed': items_needing_reorder + items_overstock + items_understock,
                    'service_level': service_level,
                    'savings_opportunity': round(total_savings, 2)
                }
            }

        except Exception as e:
            logger.error(f"Error calculating performance gauge: {e}")
            return {
                'score': 0,
                'status': 'unknown',
                'serviceScore': 0,
                'stockScore': 0,
                'costScore': 0,
                'breakdown': {}
            }
