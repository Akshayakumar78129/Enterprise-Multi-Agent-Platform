"""Holding cost processing service - Business logic and ML integration"""

import asyncio
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict

from .data_service import HoldingCostDataService
from database.filter_engine import FilterEngine
from domains.common.dashboard_cache import cache_dashboard_endpoint


class HoldingCostProcessingService:
    """Processing service for inventory holding cost analysis

    Combines data fetching, cost calculations, and insights generation
    with proper caching and PostgreSQL compatibility.
    """

    def __init__(self):
        self.data_service = HoldingCostDataService()
        self.filter_engine = FilterEngine()

    @cache_dashboard_endpoint(dashboard_type='holding_cost', ttl=300)
    async def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Main dashboard endpoint with caching (5 min TTL)

        Args:
            filters: Filter dictionary (dateFrom, dateTo, category, etc.)

        Returns:
            Complete dashboard summary with KPIs, analysis, and insights
        """
        try:
            # Set default date range: 2017-01-01 to 2021-12-31
            filters.setdefault('dateFrom', '2017-01-01')
            filters.setdefault('dateTo', '2021-12-31')

            # Get cost parameters from filters
            annual_holding_rate = filters.get('annualHoldingCostRate', 0.25)
            opportunity_rate = filters.get('opportunityCostRate', 0.08)

            # Fetch all data in parallel
            inventory_data, category_summary, warehouse_summary = await asyncio.gather(
                self.data_service.get_inventory_data(filters),
                self.data_service.get_category_summary(filters),
                self.data_service.get_warehouse_summary(filters)
            )

            # Calculate holding costs for all inventory items
            inventory_with_costs = self._calculate_holding_costs(
                inventory_data,
                annual_holding_rate,
                opportunity_rate
            )

            # Calculate KPI metrics
            kpi_metrics = self._calculate_kpi_metrics(inventory_with_costs)

            # Generate category analysis
            category_analysis = self._generate_category_analysis(
                inventory_with_costs,
                category_summary
            )

            # Generate warehouse analysis
            warehouse_analysis = self._generate_warehouse_analysis(
                inventory_with_costs,
                warehouse_summary
            )

            # Get high-cost items
            high_cost_items = self._get_high_cost_items(inventory_with_costs)

            # Generate cost breakdown
            cost_breakdown = self._generate_cost_breakdown(kpi_metrics)

            # Generate rule-based insights (fast, < 50ms)
            rule_based_insights = self._generate_insights(
                kpi_metrics,
                category_analysis,
                warehouse_analysis,
                high_cost_items
            )

            # Get AI insights from separate cache (non-blocking, async)
            ai_insights = await self._get_cached_ai_insights(
                filters,
                kpi_metrics,
                category_analysis,
                warehouse_analysis
            )

            # ✅ COMBINE into single unified insights array
            combined_insights = rule_based_insights + ai_insights

            # Generate additional datasets for visualizations
            trend_data = self._generate_trend_data(inventory_with_costs)
            saving_opportunities = self._generate_saving_opportunities(inventory_with_costs)
            excessive_cost_items = self._get_excessive_cost_items(inventory_with_costs)

            # Return unified response
            return {
                "kpiMetrics": kpi_metrics,
                "categoryAnalysis": category_analysis,
                "warehouseAnalysis": warehouse_analysis,
                "highCostItems": high_cost_items,
                "costBreakdown": cost_breakdown,
                "insights": combined_insights,  # UNIFIED: rule-based + AI
                "trendData": trend_data,  # NEW: Time series data
                "savingOpportunities": saving_opportunities,  # NEW: Opportunity analysis
                "excessiveCostItems": excessive_cost_items,  # NEW: Excessive cost items
                "insights_metadata": {
                    "total_count": len(combined_insights),
                    "rule_based_count": len(rule_based_insights),
                    "ai_count": len(ai_insights),
                    "insights_version": "unified_v2"
                },
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "filters_applied": filters,
                    "annual_holding_rate": annual_holding_rate,
                    "opportunity_rate": opportunity_rate
                }
            }

        except Exception as e:
            import traceback
            print(f"[HoldingCostProcessingService] Error in get_dashboard_summary: {e}")
            print(f"[HoldingCostProcessingService] Full traceback: {traceback.format_exc()}")
            return {
                "kpiMetrics": self._get_empty_kpis(),
                "categoryAnalysis": [],
                "warehouseAnalysis": [],
                "highCostItems": [],
                "costBreakdown": [],
                "insights": [],
                "insights_metadata": {
                    "total_count": 0,
                    "rule_based_count": 0,
                    "ai_count": 0,
                    "insights_version": "unified_v2"
                },
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "error": str(e)
                }
            }

    @cache_dashboard_endpoint(dashboard_type='holding_cost_ai_insights', ttl=1800)
    async def _get_cached_ai_insights(
        self,
        filters: Dict,
        kpi_metrics: Dict,
        category_analysis: List[Dict],
        warehouse_analysis: List[Dict]
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
                kpi_metrics,
                category_analysis,
                warehouse_analysis,
                filters
            )
            return ai_insights
        except Exception as e:
            print(f"[HoldingCostProcessingService] Error in _get_cached_ai_insights: {e}")
            return []  # Graceful fallback

    def _calculate_holding_costs(
        self,
        inventory_data: List[Dict],
        annual_holding_rate: float,
        opportunity_rate: float
    ) -> List[Dict]:
        """Calculate holding costs for all inventory items

        Args:
            inventory_data: Raw inventory data from database
            annual_holding_rate: Annual holding cost percentage (e.g., 0.25 = 25%)
            opportunity_rate: Opportunity cost rate (e.g., 0.08 = 8%)

        Returns:
            Inventory data with calculated holding costs
        """
        results = []

        for item in inventory_data:
            # Calculate inventory value
            avg_stock = float(item.get('average_stock_level', 0))
            unit_cost = float(item.get('unit_cost', 0))
            inventory_value = avg_stock * unit_cost

            # Calculate cost components
            annual_holding_cost = inventory_value * annual_holding_rate
            annual_opportunity_cost = inventory_value * opportunity_rate
            # storage_cost_per_unit is already annual cost, no need to multiply by 365
            annual_storage_cost = avg_stock * float(item.get('storage_cost_per_unit', 0))
            annual_risk_cost = inventory_value * float(item.get('obsolescence_risk', 0))

            # Total holding cost
            total_holding_cost = (
                annual_holding_cost +
                annual_opportunity_cost +
                annual_storage_cost +
                annual_risk_cost
            )

            # Holding cost percentage
            holding_cost_pct = (total_holding_cost / inventory_value) if inventory_value > 0 else 0

            # Flag excessive holding costs (>30%)
            excessive = holding_cost_pct > 0.3

            # Potential savings (reduce to 30% threshold)
            potential_savings = (total_holding_cost - (inventory_value * 0.3)) if excessive else 0

            # Add calculated fields to item
            results.append({
                **item,
                'inventory_value': round(inventory_value, 2),
                'annual_holding_cost': round(annual_holding_cost, 2),
                'annual_opportunity_cost': round(annual_opportunity_cost, 2),
                'annual_storage_cost': round(annual_storage_cost, 2),
                'annual_risk_cost': round(annual_risk_cost, 2),
                'total_holding_cost': round(total_holding_cost, 2),
                'holding_cost_pct': round(holding_cost_pct, 4),
                'excessive_holding_cost': excessive,
                'potential_savings': round(max(0, potential_savings), 2)
            })

        return results

    def _calculate_kpi_metrics(self, inventory_with_costs: List[Dict]) -> Dict:
        """Calculate KPI metrics for dashboard"""

        if not inventory_with_costs:
            return self._get_empty_kpis()

        total_inventory_value = sum(item['inventory_value'] for item in inventory_with_costs)
        total_holding_cost = sum(item['total_holding_cost'] for item in inventory_with_costs)
        total_storage_cost = sum(item['annual_storage_cost'] for item in inventory_with_costs)
        total_opportunity_cost = sum(item['annual_opportunity_cost'] for item in inventory_with_costs)
        total_risk_cost = sum(item['annual_risk_cost'] for item in inventory_with_costs)

        excessive_items = [item for item in inventory_with_costs if item['excessive_holding_cost']]
        potential_savings = sum(item['potential_savings'] for item in excessive_items)

        avg_holding_pct = (total_holding_cost / total_inventory_value) if total_inventory_value > 0 else 0

        return {
            "total_inventory_value": round(total_inventory_value, 2),
            "total_annual_holding_cost": round(total_holding_cost, 2),
            "avg_holding_cost_pct": round(avg_holding_pct, 4),
            "total_items_analyzed": len(inventory_with_costs),
            "excessive_cost_items": len(excessive_items),
            "potential_annual_savings": round(potential_savings, 2),
            "total_storage_cost": round(total_storage_cost, 2),
            "total_opportunity_cost": round(total_opportunity_cost, 2),
            "total_risk_cost": round(total_risk_cost, 2)
        }

    def _generate_category_analysis(
        self,
        inventory_with_costs: List[Dict],
        category_summary: List[Dict]
    ) -> List[Dict]:
        """Generate category-level analysis"""

        category_data = defaultdict(lambda: {
            'items': [],
            'inventory_value': 0,
            'total_holding_cost': 0,
            'high_cost_items': 0,
            'potential_savings': 0
        })

        # Aggregate by category
        for item in inventory_with_costs:
            category = item.get('category', 'Unknown')
            category_data[category]['items'].append(item)
            category_data[category]['inventory_value'] += item['inventory_value']
            category_data[category]['total_holding_cost'] += item['total_holding_cost']
            if item['excessive_holding_cost']:
                category_data[category]['high_cost_items'] += 1
                category_data[category]['potential_savings'] += item['potential_savings']

        # Format results
        results = []
        for category, data in category_data.items():
            items_count = len(data['items'])
            inventory_value = data['inventory_value']
            total_holding_cost = data['total_holding_cost']
            avg_holding_pct = (total_holding_cost / inventory_value) if inventory_value > 0 else 0

            results.append({
                'category': category,
                'items_count': items_count,
                'inventory_value': round(inventory_value, 2),
                'total_holding_cost': round(total_holding_cost, 2),
                'avg_holding_cost_pct': round(avg_holding_pct, 4),
                'high_cost_items': data['high_cost_items'],
                'potential_savings': round(data['potential_savings'], 2)
            })

        # Sort by inventory value descending
        results.sort(key=lambda x: x['inventory_value'], reverse=True)

        return results

    def _generate_warehouse_analysis(
        self,
        inventory_with_costs: List[Dict],
        warehouse_summary: List[Dict]
    ) -> List[Dict]:
        """Generate warehouse-level analysis"""

        warehouse_data = defaultdict(lambda: {
            'items': [],
            'inventory_value': 0,
            'total_holding_cost': 0,
            'capital_cost': 0,
            'storage_cost': 0,
            'risk_cost': 0,
            'opportunity_cost': 0,
            'high_cost_items': 0,
            'potential_savings': 0,
            'warehouse_name': '',
            'warehouse_type': ''
        })

        # Aggregate by warehouse
        for item in inventory_with_costs:
            warehouse_id = item.get('warehouse_id', 'Unknown')
            warehouse_data[warehouse_id]['items'].append(item)
            warehouse_data[warehouse_id]['warehouse_name'] = item.get('warehouse_name', warehouse_id)
            warehouse_data[warehouse_id]['warehouse_type'] = item.get('warehouse_type', 'Unknown')
            warehouse_data[warehouse_id]['inventory_value'] += item['inventory_value']
            warehouse_data[warehouse_id]['total_holding_cost'] += item['total_holding_cost']
            warehouse_data[warehouse_id]['capital_cost'] += item.get('annual_holding_cost', 0)
            warehouse_data[warehouse_id]['storage_cost'] += item.get('annual_storage_cost', 0)
            warehouse_data[warehouse_id]['risk_cost'] += item.get('annual_risk_cost', 0)
            warehouse_data[warehouse_id]['opportunity_cost'] += item.get('annual_opportunity_cost', 0)
            if item['excessive_holding_cost']:
                warehouse_data[warehouse_id]['high_cost_items'] += 1
                warehouse_data[warehouse_id]['potential_savings'] += item['potential_savings']

        # Calculate total costs for percentage calculation
        total_cost_across_warehouses = sum(data['total_holding_cost'] for data in warehouse_data.values())

        # Format results
        results = []
        for warehouse_id, data in warehouse_data.items():
            item_count = len(data['items'])
            total_cost = data['total_holding_cost']

            results.append({
                'warehouse_id': warehouse_id,
                'warehouse_name': data['warehouse_name'],
                'warehouse_type': data['warehouse_type'],
                'item_count': item_count,
                'inventory_value': round(data['inventory_value'], 2),
                'total_cost': round(total_cost, 2),
                'cost_percentage': round(total_cost / total_cost_across_warehouses if total_cost_across_warehouses > 0 else 0, 4),
                'cost_per_item': round(total_cost / item_count if item_count > 0 else 0, 2),
                'capital_cost': round(data['capital_cost'], 2),
                'storage_cost': round(data['storage_cost'], 2),
                'risk_cost': round(data['risk_cost'], 2),
                'opportunity_cost': round(data['opportunity_cost'], 2),
                'high_cost_items': data['high_cost_items'],
                'potential_savings': round(data['potential_savings'], 2)
            })

        # Sort by inventory value descending
        results.sort(key=lambda x: x['inventory_value'], reverse=True)

        return results

    def _get_high_cost_items(self, inventory_with_costs: List[Dict], limit: int = 50) -> List[Dict]:
        """Get items with highest holding costs"""

        # Sort by total holding cost descending
        sorted_items = sorted(
            inventory_with_costs,
            key=lambda x: x['total_holding_cost'],
            reverse=True
        )

        # Return top N items
        return sorted_items[:limit]

    def _generate_cost_breakdown(self, kpi_metrics: Dict) -> List[Dict]:
        """Generate cost breakdown by component"""

        total_cost = kpi_metrics['total_annual_holding_cost']

        if total_cost == 0:
            return []

        components = [
            {
                'component': 'Storage Cost',
                'amount': kpi_metrics['total_storage_cost'],
                'percentage': (kpi_metrics['total_storage_cost'] / total_cost) * 100,
                'color': '#3b82f6'  # Blue
            },
            {
                'component': 'Opportunity Cost',
                'amount': kpi_metrics['total_opportunity_cost'],
                'percentage': (kpi_metrics['total_opportunity_cost'] / total_cost) * 100,
                'color': '#8b5cf6'  # Purple
            },
            {
                'component': 'Risk Cost',
                'amount': kpi_metrics['total_risk_cost'],
                'percentage': (kpi_metrics['total_risk_cost'] / total_cost) * 100,
                'color': '#ef4444'  # Red
            }
        ]

        # Round percentages
        for comp in components:
            comp['percentage'] = round(comp['percentage'], 2)
            comp['amount'] = round(comp['amount'], 2)

        return components

    def _generate_insights(
        self,
        kpi_metrics: Dict,
        category_analysis: List[Dict],
        warehouse_analysis: List[Dict],
        high_cost_items: List[Dict]
    ) -> List[str]:
        """Generate rule-based insights (fast, deterministic)

        These insights are always present and provide immediate value without API calls.
        Focus on data-driven observations with actionable recommendations.

        Returns:
            List of formatted insight strings with priority indicators
        """
        insights = []

        # Critical: Excessive holding cost items
        excessive_count = kpi_metrics['excessive_cost_items']
        total_items = kpi_metrics['total_items_analyzed']
        if excessive_count > 0 and total_items > 0:
            excessive_pct = (excessive_count / total_items) * 100
            potential_savings = kpi_metrics['potential_annual_savings']

            if excessive_pct > 20:
                insights.append(
                    f"CRITICAL: {excessive_count} items ({excessive_pct:.1f}% of inventory) have excessive holding costs (>30% of value), "
                    f"representing ${potential_savings:,.0f} in potential annual savings. "
                    f"**Action:** Implement just-in-time inventory for top 20 high-cost items within 48 hours. "
                    f"Expected: 25-35% cost reduction, ${potential_savings * 0.3:,.0f} saved annually."
                )
            elif excessive_pct > 10:
                insights.append(
                    f"HIGH: {excessive_count} items with excessive holding costs represent ${potential_savings:,.0f} "
                    f"in optimization potential. **Action:** Review stock levels and reorder points for these items within 7 days. "
                    f"Expected: 20% cost reduction."
                )

        # High: Category-specific issues
        if category_analysis:
            highest_cost_category = max(category_analysis, key=lambda x: x['total_holding_cost'])
            if highest_cost_category['high_cost_items'] > 0:
                insights.append(
                    f"HIGH: '{highest_cost_category['category']}' category has {highest_cost_category['high_cost_items']} "
                    f"high-cost items with total holding cost of ${highest_cost_category['total_holding_cost']:,.0f}. "
                    f"**Action:** Implement category-specific optimization strategy focusing on demand forecasting. "
                    f"Expected: ${highest_cost_category['potential_savings']:,.0f} savings."
                )

        # Moderate: Warehouse distribution
        if len(warehouse_analysis) > 1:
            warehouse_costs = [w['total_holding_cost'] for w in warehouse_analysis]
            avg_warehouse_cost = sum(warehouse_costs) / len(warehouse_costs)
            high_cost_warehouses = [w for w in warehouse_analysis if w['total_holding_cost'] > avg_warehouse_cost * 1.5]

            if high_cost_warehouses:
                warehouse_names = ', '.join([w['warehouse_name'] for w in high_cost_warehouses[:3]])
                insights.append(
                    f"MODERATE: Warehouses {warehouse_names} have 50% higher holding costs than average. "
                    f"**Action:** Review storage policies and consider inventory redistribution. "
                    f"Expected: 15-20% cost reduction through better allocation."
                )

        # Info: Overall cost structure
        total_value = kpi_metrics['total_inventory_value']
        total_cost = kpi_metrics['total_annual_holding_cost']
        avg_pct = kpi_metrics['avg_holding_cost_pct']

        if avg_pct > 0.25:
            insights.append(
                f"MODERATE: Average holding cost of {avg_pct:.1%} exceeds industry benchmark of 25%. "
                f"Total annual cost: ${total_cost:,.0f} on ${total_value:,.0f} inventory value. "
                f"**Action:** Implement comprehensive inventory optimization program targeting 20% reduction. "
                f"Expected: ${total_cost * 0.2:,.0f} annual savings."
            )

        # Info: Provide general context if no specific issues
        if not insights:
            insights.append(
                f"INFO: Analyzed {total_items} items with total inventory value of ${total_value:,.0f}. "
                f"Annual holding cost: ${total_cost:,.0f} ({avg_pct:.1%}). "
                f"Monitor trends and implement continuous improvement strategies."
            )

        return insights

    def _generate_ai_insights(
        self,
        kpi_metrics: Dict,
        category_analysis: List[Dict],
        warehouse_analysis: List[Dict],
        filters: Dict
    ) -> List[str]:
        """Generate AI-powered strategic insights using Gemini

        This complements rule-based insights with creative, strategic analysis.
        Uses dashboard-specific prompts for consistent, actionable recommendations.

        Args:
            kpi_metrics: KPI metrics from dashboard
            category_analysis: Category-level analysis
            warehouse_analysis: Warehouse-level analysis
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            # Import at method level for error isolation
            from lib.ai_insights_generator import generate_ai_insights

            # Prepare data summary for AI context
            top_category = category_analysis[0] if category_analysis else {}
            top_warehouse = warehouse_analysis[0] if warehouse_analysis else {}

            data_summary = {
                'total_inventory_value': kpi_metrics['total_inventory_value'],
                'total_holding_cost': kpi_metrics['total_annual_holding_cost'],
                'avg_holding_pct': kpi_metrics['avg_holding_cost_pct'] * 100,  # Convert to percentage
                'excessive_items': kpi_metrics['excessive_cost_items'],
                'potential_savings': kpi_metrics['potential_annual_savings'],
                'top_category': top_category.get('category', 'N/A'),
                'top_category_cost': top_category.get('total_holding_cost', 0),
                'top_warehouse': top_warehouse.get('warehouse_name', 'N/A'),
                'top_warehouse_cost': top_warehouse.get('total_holding_cost', 0)
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='holding_cost',
                kpis=kpi_metrics,
                data_summary=data_summary,
                filters=filters
            )

            return ai_insights

        except ImportError:
            print("[HoldingCostProcessingService] AI insights module not available, skipping AI insights")
            return []
        except Exception as e:
            print(f"[HoldingCostProcessingService] Error generating AI insights: {e}")
            return []  # Graceful fallback

    def _generate_trend_data(self, inventory_with_costs: List[Dict]) -> List[Dict]:
        """Generate time-series trend data for cost visualization

        Groups data by month and calculates aggregated costs over time.
        """
        if not inventory_with_costs:
            return []

        # Group by month from transaction_date or order_date
        from collections import defaultdict
        monthly_data = defaultdict(lambda: {
            'capital_cost': 0,
            'storage_cost': 0,
            'risk_cost': 0,
            'opportunity_cost': 0,
            'total_cost': 0,
            'item_count': 0
        })

        for item in inventory_with_costs:
            # Use order_date or fall back to a default
            date_str = item.get('order_date', '2020-06-01')[:7]  # YYYY-MM format

            monthly_data[date_str]['capital_cost'] += item.get('annual_holding_cost', 0) / 12
            monthly_data[date_str]['storage_cost'] += item.get('annual_storage_cost', 0) / 12
            monthly_data[date_str]['risk_cost'] += item.get('annual_risk_cost', 0) / 12
            monthly_data[date_str]['opportunity_cost'] += item.get('annual_opportunity_cost', 0) / 12
            monthly_data[date_str]['total_cost'] += item.get('total_holding_cost', 0) / 12
            monthly_data[date_str]['item_count'] += 1

        # Convert to list and sort by date
        trend_data = []
        for month, data in sorted(monthly_data.items()):
            trend_data.append({
                'period': month,
                'capital_cost': round(data['capital_cost'], 2),
                'storage_cost': round(data['storage_cost'], 2),
                'risk_cost': round(data['risk_cost'], 2),
                'opportunity_cost': round(data['opportunity_cost'], 2),
                'total_cost': round(data['total_cost'], 2),
                'item_count': data['item_count']
            })

        return trend_data[-12:]  # Return last 12 months

    def _generate_saving_opportunities(self, inventory_with_costs: List[Dict]) -> List[Dict]:
        """Generate saving opportunity data for bubble chart visualization

        Analyzes items to identify cost-saving opportunities based on difficulty and potential savings.
        """
        opportunities = []

        for item in inventory_with_costs:
            if item.get('potential_savings', 0) <= 0:
                continue

            # Calculate difficulty score (1-5) based on various factors
            holding_pct = item.get('holding_cost_pct', 0)
            stock_level = item.get('average_stock_level', 0)

            # Higher holding % = easier to optimize (more room for improvement)
            # Lower stock levels = easier to manage
            difficulty = 1
            if holding_pct > 0.4:
                difficulty = 2  # Easy - very excessive
            elif holding_pct > 0.35:
                difficulty = 3  # Medium
            elif holding_pct > 0.30:
                difficulty = 4  # Hard
            else:
                difficulty = 5  # Very hard - already near threshold

            # Determine primary cost component
            costs = {
                'capital': item.get('annual_holding_cost', 0),
                'storage': item.get('annual_storage_cost', 0),
                'risk': item.get('annual_risk_cost', 0),
                'opportunity': item.get('annual_opportunity_cost', 0)
            }
            primary_component = max(costs.items(), key=lambda x: x[1])[0]

            opportunities.append({
                'id': item.get('item_key', item.get('item_number', '')),
                'name': item.get('item_name', 'Unknown'),
                'category': item.get('category', 'Unknown'),
                'warehouse': item.get('warehouse_name', 'Unknown'),
                'difficulty': difficulty,
                'potential_savings': round(item.get('potential_savings', 0), 2),
                'inventory_value': round(item.get('inventory_value', 0), 2),
                'primary_component': primary_component,
                'implementation_timeline': difficulty * 7,  # Days estimate
                'description': f"Reduce holding cost from {holding_pct*100:.1f}% to 30%"
            })

        # Sort by potential savings descending
        opportunities.sort(key=lambda x: x['potential_savings'], reverse=True)

        return opportunities[:100]  # Return top 100 opportunities

    def _get_excessive_cost_items(self, inventory_with_costs: List[Dict]) -> List[Dict]:
        """Get items with excessive holding costs for treemap visualization

        Filters and formats items that exceed the excessive cost threshold.
        Deduplicates items by item_number + warehouse_id to avoid duplicate keys.
        """
        # Use dictionary to deduplicate and aggregate by item+warehouse
        item_aggregation = {}

        for item in inventory_with_costs:
            if not item.get('excessive_holding_cost', False):
                continue

            # Create unique key for item + warehouse combination
            item_number = item.get('item_number', 'Unknown')
            warehouse_id = item.get('warehouse_id', 'default')
            unique_key = f"{item_number}-{warehouse_id}"

            # If item already exists, aggregate the costs
            if unique_key in item_aggregation:
                existing = item_aggregation[unique_key]
                existing['total_holding_cost'] += item.get('total_holding_cost', 0)
                existing['average_inventory_value'] += item.get('inventory_value', 0)
                existing['potential_savings'] += item.get('potential_savings', 0)
                existing['annual_holding_cost'] += item.get('annual_holding_cost', 0)
                existing['annual_opportunity_cost'] += item.get('annual_opportunity_cost', 0)
                existing['annual_storage_cost'] += item.get('annual_storage_cost', 0)
                existing['annual_risk_cost'] += item.get('annual_risk_cost', 0)
                existing['count'] += 1
            else:
                holding_pct = item.get('holding_cost_pct', 0)

                # Determine severity
                if holding_pct >= 0.40:
                    severity = 'Excessive'
                elif holding_pct >= 0.35:
                    severity = 'High'
                elif holding_pct >= 0.30:
                    severity = 'Moderate'
                else:
                    severity = 'Normal'

                item_aggregation[unique_key] = {
                    'item_key': item.get('item_key', item_number),
                    'item_name': item.get('item_name', 'Unknown'),
                    'item_number': item_number,
                    'item_category': item.get('category', 'Unknown'),
                    'warehouse_name': item.get('warehouse_name', 'Unknown'),
                    'warehouse_id': warehouse_id,
                    'total_holding_cost': item.get('total_holding_cost', 0),
                    'holding_cost_percentage': holding_pct,
                    'average_inventory_value': item.get('inventory_value', 0),
                    'potential_savings': item.get('potential_savings', 0),
                    'annual_holding_cost': item.get('annual_holding_cost', 0),
                    'annual_opportunity_cost': item.get('annual_opportunity_cost', 0),
                    'annual_storage_cost': item.get('annual_storage_cost', 0),
                    'annual_risk_cost': item.get('annual_risk_cost', 0),
                    'severity': severity,
                    'count': 1  # Track how many months were aggregated
                }

        # Convert to list and round aggregated values
        excessive_items = []
        for item_data in item_aggregation.values():
            count = item_data.pop('count')  # Remove count before returning
            # Average the values if multiple months were aggregated
            if count > 1:
                item_data['total_holding_cost'] = round(item_data['total_holding_cost'] / count, 2)
                item_data['average_inventory_value'] = round(item_data['average_inventory_value'] / count, 2)
                item_data['potential_savings'] = round(item_data['potential_savings'] / count, 2)
                item_data['annual_holding_cost'] = round(item_data['annual_holding_cost'] / count, 2)
                item_data['annual_opportunity_cost'] = round(item_data['annual_opportunity_cost'] / count, 2)
                item_data['annual_storage_cost'] = round(item_data['annual_storage_cost'] / count, 2)
                item_data['annual_risk_cost'] = round(item_data['annual_risk_cost'] / count, 2)
            else:
                item_data['total_holding_cost'] = round(item_data['total_holding_cost'], 2)
                item_data['average_inventory_value'] = round(item_data['average_inventory_value'], 2)
                item_data['potential_savings'] = round(item_data['potential_savings'], 2)
                item_data['annual_holding_cost'] = round(item_data['annual_holding_cost'], 2)
                item_data['annual_opportunity_cost'] = round(item_data['annual_opportunity_cost'], 2)
                item_data['annual_storage_cost'] = round(item_data['annual_storage_cost'], 2)
                item_data['annual_risk_cost'] = round(item_data['annual_risk_cost'], 2)

            item_data['holding_cost_percentage'] = round(item_data['holding_cost_percentage'], 4)
            excessive_items.append(item_data)

        # Sort by holding cost percentage descending
        excessive_items.sort(key=lambda x: x['holding_cost_percentage'], reverse=True)

        return excessive_items

    def _get_empty_kpis(self) -> Dict:
        """Return empty KPI structure"""
        return {
            "total_inventory_value": 0,
            "total_annual_holding_cost": 0,
            "avg_holding_cost_pct": 0,
            "total_items_analyzed": 0,
            "excessive_cost_items": 0,
            "potential_annual_savings": 0,
            "total_storage_cost": 0,
            "total_opportunity_cost": 0,
            "total_risk_cost": 0
        }
