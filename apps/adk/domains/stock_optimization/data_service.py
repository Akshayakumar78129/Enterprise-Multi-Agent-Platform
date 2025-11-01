"""Data service for stock optimization - SQL queries only"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import StockOptimizationSchema


class StockOptimizationDataService:
    """Data service for stock optimization analysis"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = StockOptimizationSchema()
        self.filter_engine = FilterEngine()

    async def get_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get stock optimization KPIs"""

        sql = """
        WITH MetricsData AS (
            SELECT
                COUNT(DISTINCT t."Item Number") as unique_items,
                COUNT(DISTINCT t."Customer Key") as unique_customers,
                SUM(t."Net Sales Amount") as total_value,
                SUM(t."Net Sales Quantity") as total_quantity,
                AVG(t."Net Sales Amount") as avg_value,
                COUNT(*) as transaction_count
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
        )
        SELECT * FROM MetricsData
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            row = result[0]
            # Generate domain-specific KPIs based on the data
            kpis = {}
            kpis['optimizedStockValue'] = row.get('total_value', 0) or 0
            kpis['reorderPoints'] = 0  # Placeholder for Number of reorder points
            kpis['safetyStockLevel'] = 0  # Placeholder for Safety stock coverage
            kpis['orderFrequency'] = 0  # Placeholder for Average order frequency
            kpis['costSavings'] = row.get('total_value', 0) or 0
            kpis['serviceLevel'] = 0  # Placeholder for Target service level percentage

            return kpis

        return {kpi: 0 for kpi in ['optimizedStockValue', 'reorderPoints', 'safetyStockLevel', 'orderFrequency', 'costSavings', 'serviceLevel']}

    async def get_detailed_data(self, filters: Dict[str, Any] = {}, limit: int = 20) -> List[Dict]:
        """Get detailed stock optimization data"""

        sql = f"""
        SELECT
            t."Item Number" as item,
            t."Product Posting Group" as category,
            SUM(t."Net Sales Quantity") as quantity,
            SUM(t."Net Sales Amount") as value,
            COUNT(*) as transactions
        FROM "dbo_F_Sales_Transaction" t
        WHERE 1=1
        GROUP BY t."Item Number", t."Product Posting Group"
        ORDER BY value DESC
        LIMIT {{limit}}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{{
            'item': row.get('item', 'Unknown'),
            'category': row.get('category') or 'Unknown',
            'quantity': row.get('quantity', 0) or 0,
            'value': row.get('value', 0) or 0,
            'transactions': row.get('transactions', 0) or 0
        }} for row in result]
