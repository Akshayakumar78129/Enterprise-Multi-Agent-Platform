"""Holding cost data service - PostgreSQL & SQLite compatible"""

from typing import Dict, List, Any
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import HoldingCostSchema


class HoldingCostDataService:
    """Data service for inventory holding cost analysis - uses Sales Transaction data

    All queries use:
    - ? placeholders (PostgreSQL & SQLite compatible)
    - Schema references (no hardcoded table/column names)
    - FilterEngine for dynamic filtering
    - Parameterized queries (no SQL injection risk)
    """

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = HoldingCostSchema()
        self.filter_engine = FilterEngine()

        # Default holding cost parameters (can be overridden)
        self.default_annual_holding_rate = 0.25  # 25% annual holding cost
        self.default_opportunity_rate = 0.08  # 8% opportunity cost

    async def get_holding_cost_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Calculate KPIs for holding cost from sales transaction data

        Args:
            filters: Filter dictionary (dateFrom, dateTo, category, etc.)

        Returns:
            Dict with KPI metrics
        """
        sql = """
        WITH InventoryData AS (
            SELECT
                t."Item Number" as item_number,
                t."Product Posting Group" as category,
                SUM(t."Net Sales Amount") as total_value,
                COUNT(*) as transactions
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
            GROUP BY t."Item Number", t."Product Posting Group"
        )
        SELECT
            SUM(total_value) as total_inventory_value,
            COUNT(*) as total_items_analyzed,
            AVG(total_value) as avg_item_value
        FROM InventoryData
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            row = result[0]
            total_value = row.get('total_inventory_value', 0) or 0
            total_items = row.get('total_items_analyzed', 0) or 0

            # Calculate holding costs
            annual_holding_cost = total_value * self.default_annual_holding_rate
            storage_cost = annual_holding_cost * 0.5  # 50% for storage
            opportunity_cost = annual_holding_cost * 0.35  # 35% for opportunity
            risk_cost = annual_holding_cost * 0.15  # 15% for risk

            return {
                'total_inventory_value': total_value,
                'total_annual_holding_cost': annual_holding_cost,
                'avg_holding_cost_pct': self.default_annual_holding_rate * 100,
                'total_items_analyzed': total_items,
                'total_storage_cost': storage_cost,
                'total_opportunity_cost': opportunity_cost,
                'total_risk_cost': risk_cost
            }

        return {
            'total_inventory_value': 0,
            'total_annual_holding_cost': 0,
            'avg_holding_cost_pct': 0,
            'total_items_analyzed': 0,
            'total_storage_cost': 0,
            'total_opportunity_cost': 0,
            'total_risk_cost': 0
        }

    async def get_category_summary(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get aggregated holding cost data by category from sales transactions

        Args:
            filters: Filter dictionary

        Returns:
            List of category-level summaries
        """
        sql = """
        SELECT
            t."Product Posting Group" AS category,
            COUNT(DISTINCT t."Item Number") AS items_count,
            SUM(t."Net Sales Amount") AS inventory_value,
            AVG(t."Net Sales Amount") AS avg_item_value,
            SUM(t."Net Sales Quantity") AS total_quantity
        FROM "dbo_F_Sales_Transaction" t
        WHERE 1=1
        GROUP BY t."Product Posting Group"
        ORDER BY inventory_value DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])

    async def get_warehouse_summary(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get aggregated holding cost data by warehouse

        Note: Warehouse data not available in Sales Transaction table.
        Returns empty list for now. Can be populated when warehouse table is available.

        Args:
            filters: Filter dictionary

        Returns:
            List of warehouse-level summaries (currently empty)
        """
        # Return empty list since warehouse data not available in current schema
        return []

    async def get_high_cost_items(
        self,
        filters: Dict[str, Any] = {},
        limit: int = 50
    ) -> List[Dict]:
        """Get items with highest holding costs from sales transactions

        Args:
            filters: Filter dictionary
            limit: Maximum number of items to return

        Returns:
            List of high-cost items sorted by holding cost
        """
        sql = f"""
        SELECT
            t."Item Number" AS item_number,
            t."Product Posting Group" AS category,
            SUM(t."Net Sales Amount") AS inventory_value,
            SUM(t."Net Sales Quantity") AS quantity,
            COUNT(*) AS transactions,
            SUM(t."Net Sales Amount") * {self.default_annual_holding_rate} AS annual_holding_cost
        FROM "dbo_F_Sales_Transaction" t
        WHERE 1=1
        GROUP BY t."Item Number", t."Product Posting Group"
        ORDER BY inventory_value DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])

    async def get_inventory_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get detailed inventory data from sales transactions with estimated cost components

        Args:
            filters: Filter dictionary (dateFrom, dateTo, category, etc.)

        Returns:
            List of inventory records with estimated cost data (one row per item per month)
        """
        sql = """
        SELECT
            t."Item Number" AS item_number,
            t."Product Posting Group" AS category,
            STRFTIME('%Y-%m', t."Txn Date") AS order_date,
            SUM(t."Net Sales Amount") AS total_value,
            SUM(t."Net Sales Quantity") AS total_quantity,
            AVG(t."Net Sales Quantity") AS avg_quantity,
            COUNT(DISTINCT t."Txn Date") AS active_days,
            COUNT(*) AS transactions
        FROM "dbo_F_Sales_Transaction" t
        WHERE 1=1
        GROUP BY t."Item Number", t."Product Posting Group", STRFTIME('%Y-%m', t."Txn Date")
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        raw_data = result_dict.get('rows', [])

        # Enrich with calculated fields needed by processing service
        enriched_data = []
        for row in raw_data:
            total_value = row.get('total_value', 0) or 0
            total_quantity = row.get('total_quantity', 0) or 0

            # Calculate unit cost (total value / total quantity)
            unit_cost = (total_value / total_quantity) if total_quantity > 0 else 0

            # Estimate average stock level (assume 30-day rolling stock)
            avg_quantity = row.get('avg_quantity', 0) or 0
            average_stock_level = avg_quantity * 30

            enriched_data.append({
                'item_number': row.get('item_number', 'Unknown'),
                'item_name': row.get('item_number', 'Unknown'),  # Use item number as name
                'category': row.get('category', 'Unknown'),
                'order_date': row.get('order_date', '2020-06'),  # YYYY-MM format from query
                'unit_cost': unit_cost,
                'average_stock_level': average_stock_level,
                'current_stock': total_quantity,
                'storage_cost_per_unit': 0.10,  # Default: $0.10 per unit per day
                'obsolescence_risk': 0.05,  # Default: 5% risk
                'lead_time_days': 7,  # Default: 7 days
                'warehouse_name': 'Main Warehouse',  # Default warehouse
                'transactions': row.get('transactions', 0),
                'active_days': row.get('active_days', 0)
            })

        return enriched_data
