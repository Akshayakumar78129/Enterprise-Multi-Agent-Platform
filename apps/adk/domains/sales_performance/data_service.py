"""Data service for sales performance - SQL queries only"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import SalesPerformanceSchema


class SalesPerformanceDataService:
    """Data service for sales performance analysis"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = SalesPerformanceSchema()
        self.filter_engine = FilterEngine()

    async def get_sales_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get sales summary data with KPIs"""

        # Main sales query using actual database structure
        sql = """
        WITH SalesData AS (
            SELECT
                t."Txn Date" as date,
                t."Net Sales Amount" as amount,
                t."Net Sales Quantity" as quantity,
                c."Customer Name" as customer_name,
                t."Item Number" as item_number
            FROM dbo_F_Sales_Transaction t
            LEFT JOIN dbo_D_Customer c ON t."Customer Key" = c."Customer Key"
            WHERE 1=1
        )
        SELECT
            COUNT(DISTINCT date) as total_days,
            SUM(amount) as total_revenue,
            SUM(quantity) as total_units,
            AVG(amount) as avg_order_value,
            COUNT(DISTINCT customer_name) as unique_customers
        FROM SalesData
        """

        # Apply filters
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            return {
                'totalRevenue': result[0].get('total_revenue', 0),
                'totalUnits': result[0].get('total_units', 0),
                'avgOrderValue': result[0].get('avg_order_value', 0),
                'uniqueCustomers': result[0].get('unique_customers', 0)
            }

        return {
            'totalRevenue': 0,
            'totalUnits': 0,
            'avgOrderValue': 0,
            'uniqueCustomers': 0
        }

    async def get_sales_by_product(self, filters: Dict[str, Any] = {}, limit: int = 10) -> List[Dict]:
        """Get top performing products by sales"""

        sql = f"""
        WITH ProductSales AS (
            SELECT
                t."Item Number" as product_name,
                t."Product Posting Group" as category,
                SUM(t."Net Sales Amount") as revenue,
                SUM(t."Net Sales Quantity") as units_sold,
                AVG(t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) as avg_price
            FROM dbo_F_Sales_Transaction t
            WHERE 1=1
            GROUP BY t."Item Number", t."Product Posting Group"
        )
        SELECT *
        FROM ProductSales
        ORDER BY revenue DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'productName': row.get('product_name', 'Unknown'),
            'category': row.get('category') or 'Unknown',
            'revenue': row.get('revenue', 0),
            'unitsSold': row.get('units_sold', 0),
            'avgPrice': row.get('avg_price', 0)
        } for row in result]

    async def get_sales_by_region(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get sales performance by customer (since no region table exists)"""

        sql = """
        SELECT
            c."Customer Name" as region_name,
            COUNT(DISTINCT t."Customer Key") as customer_count,
            SUM(t."Net Sales Amount") as revenue,
            SUM(t."Net Sales Quantity") as units,
            AVG(t."Net Sales Amount") as avg_transaction_value
        FROM dbo_F_Sales_Transaction t
        LEFT JOIN dbo_D_Customer c ON t."Customer Key" = c."Customer Key"
        WHERE 1=1
        GROUP BY c."Customer Name"
        ORDER BY revenue DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'regionName': row.get('region_name', 'Unknown'),
            'customerCount': row.get('customer_count', 0),
            'revenue': row.get('revenue', 0),
            'units': row.get('units', 0),
            'avgTransactionValue': row.get('avg_transaction_value', 0)
        } for row in result]

    async def get_sales_trends(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get sales trends over time"""

        sql = """
        SELECT
            DATE(t."Txn Date") as date,
            SUM(t."Net Sales Amount") as daily_revenue,
            SUM(t."Net Sales Quantity") as daily_units,
            COUNT(DISTINCT t."Customer Key") as daily_customers,
            COUNT(*) as transaction_count
        FROM dbo_F_Sales_Transaction t
        WHERE 1=1
        GROUP BY DATE(t."Txn Date")
        ORDER BY date
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'date': row.get('date'),
            'revenue': row.get('daily_revenue', 0),
            'units': row.get('daily_units', 0),
            'customers': row.get('daily_customers', 0),
            'transactions': row.get('transaction_count', 0)
        } for row in result]

    async def get_sales_by_category(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get sales distribution by category"""

        sql = """
        SELECT
            t."Product Posting Group" as category,
            COUNT(DISTINCT t."Item Number") as product_count,
            SUM(t."Net Sales Amount") as revenue,
            SUM(t."Net Sales Quantity") as units,
            AVG(t."Net Sales Amount" / NULLIF(t."Net Sales Quantity", 0)) as avg_price
        FROM dbo_F_Sales_Transaction t
        WHERE 1=1
        GROUP BY t."Product Posting Group"
        ORDER BY revenue DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'category': row.get('category') or 'Unknown',
            'productCount': row.get('product_count', 0),
            'revenue': row.get('revenue', 0),
            'units': row.get('units', 0),
            'avgPrice': row.get('avg_price', 0)
        } for row in result]

    async def get_top_customers(self, filters: Dict[str, Any] = {}, limit: int = 10) -> List[Dict]:
        """Get top customers by revenue"""

        sql = f"""
        SELECT
            c."Customer Name" as customer_name,
            c."Customer Type Desc" as segment,
            COUNT(DISTINCT t."Txn Date") as purchase_days,
            SUM(t."Net Sales Amount") as total_revenue,
            SUM(t."Net Sales Quantity") as total_units,
            AVG(t."Net Sales Amount") as avg_order_value
        FROM dbo_F_Sales_Transaction t
        LEFT JOIN dbo_D_Customer c ON t."Customer Key" = c."Customer Key"
        WHERE 1=1
        GROUP BY c."Customer Name", c."Customer Type Desc"
        ORDER BY total_revenue DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'customerName': row.get('customer_name', 'Unknown'),
            'segment': row.get('segment') or 'Unknown',
            'purchaseDays': row.get('purchase_days', 0),
            'totalRevenue': row.get('total_revenue', 0),
            'totalUnits': row.get('total_units', 0),
            'avgOrderValue': row.get('avg_order_value', 0)
        } for row in result]