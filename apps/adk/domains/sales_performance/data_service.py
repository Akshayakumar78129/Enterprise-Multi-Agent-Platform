"""Data service for sales performance - SQL queries only"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import SalesPerformanceSchema


class SalesPerformanceDataService:
    """Data service for sales performance analysis"""

    def __init__(self):
        # Disable connection pooling to avoid bracket/quoting issues
        self.db = DatabaseConnection(use_pool=False)
        self.schema = SalesPerformanceSchema()
        self.filter_engine = FilterEngine()

    async def get_sales_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get sales summary data with KPIs"""

        sql = f"""
        SELECT
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['date']}) as total_days,
            SUM({self.schema.TRANSACTION.refs['amount']}) as total_revenue,
            SUM({self.schema.TRANSACTION.refs['quantity']}) as total_units,
            AVG({self.schema.TRANSACTION.refs['amount']}) as avg_order_value,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as unique_customers
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            return {
                'totalRevenue': result[0].get('total_revenue', 0) or 0,
                'totalUnits': result[0].get('total_units', 0) or 0,
                'avgOrderValue': result[0].get('avg_order_value', 0) or 0,
                'uniqueCustomers': result[0].get('unique_customers', 0) or 0
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
        SELECT
            {self.schema.ITEM.refs['desc']} as product_name,
            {self.schema.ITEM.refs['category']} as category,
            SUM({self.schema.TRANSACTION.refs['amount']}) as revenue,
            SUM({self.schema.TRANSACTION.refs['quantity']}) as units_sold,
            AVG({self.schema.TRANSACTION.refs['amount']} / NULLIF({self.schema.TRANSACTION.refs['quantity']}, 0)) as avg_price
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        GROUP BY {self.schema.ITEM.refs['desc']}, {self.schema.ITEM.refs['category']}
        ORDER BY revenue DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'productName': row.get('product_name', 'Unknown'),
            'category': row.get('category') or 'Unknown',
            'revenue': row.get('revenue', 0) or 0,
            'unitsSold': row.get('units_sold', 0) or 0,
            'avgPrice': row.get('avg_price', 0) or 0
        } for row in result]

    async def get_sales_by_region(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get sales performance by region"""

        sql = f"""
        SELECT
            {self.schema.REGION.refs['name']} as region_name,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as customer_count,
            SUM({self.schema.TRANSACTION.refs['amount']}) as revenue,
            SUM({self.schema.TRANSACTION.refs['quantity']}) as units,
            AVG({self.schema.TRANSACTION.refs['amount']}) as avg_transaction_value
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        GROUP BY {self.schema.REGION.refs['name']}
        ORDER BY revenue DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'regionName': row.get('region_name', 'Unknown') or 'Unknown',
            'customerCount': row.get('customer_count', 0) or 0,
            'revenue': row.get('revenue', 0) or 0,
            'units': row.get('units', 0) or 0,
            'avgTransactionValue': row.get('avg_transaction_value', 0) or 0
        } for row in result]

    async def get_sales_trends(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get sales trends over time"""

        sql = f"""
        SELECT
            DATE({self.schema.TRANSACTION.refs['date']}) as date,
            SUM({self.schema.TRANSACTION.refs['amount']}) as daily_revenue,
            SUM({self.schema.TRANSACTION.refs['quantity']}) as daily_units,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as daily_customers,
            COUNT(*) as transaction_count
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        GROUP BY DATE({self.schema.TRANSACTION.refs['date']})
        ORDER BY date
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'date': row.get('date'),
            'revenue': row.get('daily_revenue', 0) or 0,
            'units': row.get('daily_units', 0) or 0,
            'customers': row.get('daily_customers', 0) or 0,
            'transactions': row.get('transaction_count', 0) or 0
        } for row in result]

    async def get_sales_by_category(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get sales distribution by category"""

        sql = f"""
        SELECT
            {self.schema.ITEM.refs['category']} as category,
            COUNT(DISTINCT {self.schema.ITEM.refs['desc']}) as product_count,
            SUM({self.schema.TRANSACTION.refs['amount']}) as revenue,
            SUM({self.schema.TRANSACTION.refs['quantity']}) as units,
            AVG({self.schema.TRANSACTION.refs['amount']} / NULLIF({self.schema.TRANSACTION.refs['quantity']}, 0)) as avg_price
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        GROUP BY {self.schema.ITEM.refs['category']}
        ORDER BY revenue DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'category': row.get('category') or 'Unknown',
            'productCount': row.get('product_count', 0) or 0,
            'revenue': row.get('revenue', 0) or 0,
            'units': row.get('units', 0) or 0,
            'avgPrice': row.get('avg_price', 0) or 0
        } for row in result]

    async def get_filter_options(self) -> Dict[str, List[str]]:
        """Get available filter options from the database"""

        # Get distinct regions
        region_sql = f"""
        SELECT DISTINCT {self.schema.REGION.refs['name']} as region_name
        FROM {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
        WHERE {self.schema.REGION.refs['name']} IS NOT NULL
        ORDER BY region_name
        """

        region_result = await self.db.query(region_sql, [])
        regions = [row['region_name'] for row in region_result.get('rows', [])]

        # Get distinct categories
        category_sql = f"""
        SELECT DISTINCT {self.schema.ITEM.refs['category']} as category
        FROM {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
        WHERE {self.schema.ITEM.refs['category']} IS NOT NULL
        ORDER BY category
        """

        category_result = await self.db.query(category_sql, [])
        categories = [row['category'] for row in category_result.get('rows', [])]

        return {
            'regions': regions,
            'categories': categories
        }

    async def get_top_customers(self, filters: Dict[str, Any] = {}, limit: int = 10) -> List[Dict]:
        """Get top customers by revenue"""

        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['name']} as customer_name,
            {self.schema.CUSTOMER.refs['type']} as segment,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['date']}) as purchase_days,
            SUM({self.schema.TRANSACTION.refs['amount']}) as total_revenue,
            SUM({self.schema.TRANSACTION.refs['quantity']}) as total_units,
            AVG({self.schema.TRANSACTION.refs['amount']}) as avg_order_value
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        GROUP BY {self.schema.CUSTOMER.refs['name']}, {self.schema.CUSTOMER.refs['type']}
        ORDER BY total_revenue DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'customerName': row.get('customer_name', 'Unknown') or 'Unknown',
            'segment': row.get('segment') or 'Unknown',
            'purchaseDays': row.get('purchase_days', 0) or 0,
            'totalRevenue': row.get('total_revenue', 0) or 0,
            'totalUnits': row.get('total_units', 0) or 0,
            'avgOrderValue': row.get('avg_order_value', 0) or 0
        } for row in result]
