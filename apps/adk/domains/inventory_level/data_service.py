"""Data service for inventory level - SQL queries only"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import InventoryLevelSchema


class InventoryLevelDataService:
    """Data service for inventory level analysis"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = InventoryLevelSchema()
        self.filter_engine = FilterEngine()

    async def get_inventory_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get inventory KPIs from sales data"""

        # Calculate inventory metrics from sales data
        sql = """
        WITH InventoryData AS (
            SELECT
                t."Item Number" as item,
                t."Product Posting Group" as category,
                SUM(t."Net Sales Quantity") as total_quantity,
                SUM(t."Net Sales Amount") as total_value,
                COUNT(DISTINCT t."Txn Date") as active_days,
                COUNT(*) as transactions
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
            GROUP BY t."Item Number", t."Product Posting Group"
        )
        SELECT
            SUM(total_value) as total_inventory_value,
            AVG(total_quantity) as avg_quantity,
            COUNT(DISTINCT item) as unique_items,
            COUNT(DISTINCT category) as unique_categories,
            AVG(CAST(active_days AS FLOAT)) as avg_active_days
        FROM InventoryData
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            row = result[0]
            total_value = row.get('total_inventory_value', 0) or 0
            avg_days = row.get('avg_active_days', 30) or 30

            # Calculate derived metrics
            turnover = (365 / max(avg_days, 1)) if avg_days > 0 else 0

            return {
                'totalInventoryValue': total_value,
                'stockTurnover': turnover,
                'stockoutRisk': 0,  # Placeholder
                'averageDaysOnHand': avg_days,
                'inventoryAccuracy': 95.0,  # Placeholder
                'excessStock': 0  # Placeholder
            }

        return {
            'totalInventoryValue': 0,
            'stockTurnover': 0,
            'stockoutRisk': 0,
            'averageDaysOnHand': 0,
            'inventoryAccuracy': 0,
            'excessStock': 0
        }

    async def get_stock_levels(self, filters: Dict[str, Any] = {}, limit: int = 20) -> List[Dict]:
        """Get current stock levels by item"""

        sql = f"""
        WITH StockData AS (
            SELECT
                t."Item Number" as item_name,
                t."Product Posting Group" as category,
                SUM(t."Net Sales Quantity") as total_quantity,
                SUM(t."Net Sales Amount") as total_value,
                AVG(t."Net Sales Quantity") as avg_quantity,
                COUNT(DISTINCT t."Txn Date") as active_days
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
            GROUP BY t."Item Number", t."Product Posting Group"
        )
        SELECT
            item_name,
            category,
            total_quantity as current_stock,
            avg_quantity * 7 as minimum_stock,
            avg_quantity * 30 as maximum_stock,
            total_value as stock_value,
            CASE
                WHEN total_quantity < avg_quantity * 7 THEN 'low'
                WHEN total_quantity > avg_quantity * 30 THEN 'excess'
                ELSE 'normal'
            END as status,
            active_days as days_on_hand
        FROM StockData
        ORDER BY total_value DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'itemName': row.get('item_name', 'Unknown'),
            'category': row.get('category') or 'Unknown',
            'currentStock': int(row.get('current_stock', 0) or 0),
            'minimumStock': int(row.get('minimum_stock', 0) or 0),
            'maximumStock': int(row.get('maximum_stock', 0) or 0),
            'stockValue': row.get('stock_value', 0) or 0,
            'status': row.get('status', 'normal'),
            'daysOnHand': row.get('days_on_hand', 0) or 0
        } for row in result]

    async def get_inventory_movements(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get inventory movement trends"""

        sql = """
        SELECT
            DATE(t."Txn Date") as period,
            SUM(CASE WHEN t."Net Sales Quantity" > 0 THEN t."Net Sales Quantity" ELSE 0 END) as inbound,
            SUM(CASE WHEN t."Net Sales Quantity" < 0 THEN ABS(t."Net Sales Quantity") ELSE 0 END) as outbound,
            SUM(t."Net Sales Quantity") as net_movement,
            COUNT(*) as transaction_count
        FROM "dbo_F_Sales_Transaction" t
        WHERE 1=1
        GROUP BY DATE(t."Txn Date")
        ORDER BY period DESC
        LIMIT 30
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        movements = []
        for row in result:
            inbound = int(row.get('inbound', 0) or 0)
            outbound = int(row.get('outbound', 0) or 0)
            net = int(row.get('net_movement', 0) or 0)

            # Calculate turnover rate (simplified)
            turnover = (outbound / max(inbound, 1)) * 100 if inbound > 0 else 0

            movements.append({
                'period': str(row.get('period', '')),
                'inbound': inbound,
                'outbound': outbound,
                'netMovement': net,
                'turnoverRate': turnover
            })

        return movements

    async def get_low_stock_items(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get items with low stock levels"""

        sql = """
        WITH StockAnalysis AS (
            SELECT
                t."Item Number" as item,
                t."Product Posting Group" as category,
                SUM(t."Net Sales Quantity") as current_stock,
                AVG(t."Net Sales Quantity") as avg_daily_usage
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
            GROUP BY t."Item Number", t."Product Posting Group"
            HAVING SUM(t."Net Sales Quantity") < AVG(t."Net Sales Quantity") * 7
        )
        SELECT * FROM StockAnalysis
        ORDER BY current_stock ASC
        LIMIT 10
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'item': row.get('item', 'Unknown'),
            'category': row.get('category') or 'Unknown',
            'currentStock': row.get('current_stock', 0) or 0,
            'avgDailyUsage': row.get('avg_daily_usage', 0) or 0
        } for row in result]