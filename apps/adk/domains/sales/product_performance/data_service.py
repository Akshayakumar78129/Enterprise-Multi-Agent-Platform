"""Data service for product performance analysis"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .models import ProductPerformanceSchema


class ProductPerformanceDataService:
    """Handles all database queries for product performance"""

    def __init__(self):
        # Disable connection pooling to avoid bracket/quoting issues
        self.db = DatabaseConnection(use_pool=False)
        self.schema = ProductPerformanceSchema()
        self.filter_engine = FilterEngine()

    async def get_product_kpis(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate KPI metrics for products"""

        sql = """
        SELECT
            COUNT(DISTINCT i."Item Key") as total_products,
            SUM(t."Net Sales Amount") as total_revenue,
            SUM(t."Net Sales Quantity") as total_units,
            AVG(t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) as avg_price
        FROM "dbo_F_Sales_Transaction" t
        LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
        WHERE t."Deleted Flag" = 0
            AND t."Excluded Flag" = 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            row = result[0]
            return {
                'totalProducts': row.get('total_products', 0) or 0,
                'totalRevenue': row.get('total_revenue', 0) or 0,
                'totalUnits': row.get('total_units', 0) or 0,
                'avgPrice': row.get('avg_price', 0) or 0
            }

        return {
            'totalProducts': 0,
            'totalRevenue': 0,
            'totalUnits': 0,
            'avgPrice': 0
        }

    async def get_top_products(self, filters: Dict[str, Any], limit: int = 10) -> List[Dict]:
        """Get top performing products"""

        limit = filters.get('topN', limit)

        sql = f"""
        SELECT
            i."Item Desc" as product_name,
            i."Item Category Desc" as category,
            SUM(t."Net Sales Amount") as revenue,
            SUM(t."Net Sales Quantity") as units_sold,
            AVG(t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) as avg_price,
            SUM(t."Net Sales Amount") as margin,
            (SUM(t."Net Sales Amount") / NULLIF(SUM(t."Net Sales Amount"), 0) * 100) as margin_percent
        FROM "dbo_F_Sales_Transaction" t
        LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
        WHERE t."Deleted Flag" = 0
            AND t."Excluded Flag" = 0
        GROUP BY i."Item Desc", i."Item Category Desc"
        ORDER BY revenue DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [
            {
                'productName': row.get('product_name', 'Unknown'),
                'category': row.get('category') or 'Unknown',
                'revenue': row.get('revenue', 0) or 0,
                'unitsSold': row.get('units_sold', 0) or 0,
                'avgPrice': row.get('avg_price', 0) or 0,
                'margin': row.get('margin', 0) or 0,
                'marginPercent': row.get('margin_percent', 0) or 0
            }
            for row in result
        ]

    async def get_category_performance(self, filters: Dict[str, Any]) -> List[Dict]:
        """Get performance by category"""

        sql = """
        SELECT
            i."Item Category Desc" as category,
            COUNT(DISTINCT i."Item Desc") as product_count,
            SUM(t."Net Sales Amount") as revenue,
            SUM(t."Net Sales Quantity") as units_sold,
            AVG(t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) as avg_price
        FROM "dbo_F_Sales_Transaction" t
        LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
        WHERE t."Deleted Flag" = 0
            AND t."Excluded Flag" = 0
        GROUP BY i."Item Category Desc"
        ORDER BY revenue DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [
            {
                'category': row.get('category') or 'Unknown',
                'productCount': row.get('product_count', 0) or 0,
                'revenue': row.get('revenue', 0) or 0,
                'unitsSold': row.get('units_sold', 0) or 0,
                'avgPrice': row.get('avg_price', 0) or 0
            }
            for row in result
        ]

    async def get_margin_analysis(self, filters: Dict[str, Any]) -> List[Dict]:
        """Get margin analysis for products"""

        sql = """
        SELECT
            i."Item Desc" as product_name,
            i."Item Category Desc" as category,
            SUM(t."Net Sales Amount") as revenue,
            SUM(t."Net Sales Quantity") as units_sold,
            SUM(t."Net Sales Amount") as total_margin,
            AVG(t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) as avg_price,
            0 as avg_cost,
            (SUM(t."Net Sales Amount") / NULLIF(SUM(t."Net Sales Amount"), 0) * 100) as margin_percent
        FROM "dbo_F_Sales_Transaction" t
        LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
        WHERE t."Deleted Flag" = 0
            AND t."Excluded Flag" = 0
        GROUP BY i."Item Desc", i."Item Category Desc"
        HAVING SUM(t."Net Sales Amount") > 0
        ORDER BY total_margin DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [
            {
                'productName': row.get('product_name', 'Unknown'),
                'category': row.get('category') or 'Unknown',
                'revenue': row.get('revenue', 0) or 0,
                'unitsSold': row.get('units_sold', 0) or 0,
                'totalMargin': row.get('total_margin', 0) or 0,
                'marginPercent': row.get('margin_percent', 0) or 0,
                'avgPrice': row.get('avg_price', 0) or 0,
                'avgCost': row.get('avg_cost', 0) or 0
            }
            for row in result
        ]

    async def get_price_band_distribution(self, filters: Dict[str, Any]) -> List[Dict]:
        """Get distribution of products by price bands"""

        sql = """
        SELECT
            CASE
                WHEN (t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) < 10 THEN 'Under $10'
                WHEN (t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) < 50 THEN '$10-$50'
                WHEN (t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) < 100 THEN '$50-$100'
                WHEN (t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) < 500 THEN '$100-$500'
                ELSE '$500+'
            END as price_band,
            COUNT(DISTINCT i."Item Key") as count,
            SUM(t."Net Sales Amount") as revenue
        FROM "dbo_F_Sales_Transaction" t
        LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
        WHERE t."Deleted Flag" = 0
            AND t."Excluded Flag" = 0
            AND t."Net Sales Quantity" > 0
        GROUP BY price_band
        ORDER BY MIN((t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)))
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [
            {
                'name': row.get('price_band', 'Unknown'),
                'count': row.get('count', 0) or 0,
                'revenue': row.get('revenue', 0) or 0
            }
            for row in result
        ]
