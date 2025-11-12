"""Data service for sales trends - SQL queries only"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .db_schema import SalesTrendsSchema


class SalesTrendsDataService:
    """Data service for sales trends analysis"""

    def __init__(self):
        # Disable connection pooling to avoid bracket/quoting issues
        self.db = DatabaseConnection(use_pool=False)
        self.schema = SalesTrendsSchema()
        self.filter_engine = FilterEngine()

    def _date_part(self, date_ref: str, part: str) -> str:
        """Extract a date part (year, month, etc.)"""
        if self.db.db_type == 'postgres':
            if part == 'year':
                return f"TO_CHAR({date_ref}::date, 'YYYY')"
            elif part == 'month':
                return f"TO_CHAR({date_ref}::date, 'MM')"
        else:  # sqlite
            if part == 'year':
                return f"strftime('%Y', {date_ref})"
            elif part == 'month':
                return f"strftime('%m', {date_ref})"
        return date_ref

    def _get_time_group_expression(self, granularity: str) -> str:
        """Get SQL expression for time grouping"""
        date_ref = self.schema.TRANSACTION.refs['date']

        if self.db.db_type == 'postgres':
            if granularity == 'daily':
                return f"TO_CHAR({date_ref}::date, 'YYYY-MM-DD')"
            elif granularity == 'weekly':
                return f"TO_CHAR({date_ref}::date, 'IYYY-IW')"
            elif granularity == 'quarterly':
                return f"TO_CHAR({date_ref}::date, 'YYYY') || '-Q' || TO_CHAR({date_ref}::date, 'Q')"
            elif granularity == 'annual':
                return f"TO_CHAR({date_ref}::date, 'YYYY')"
            else:  # monthly (default)
                return f"TO_CHAR({date_ref}::date, 'YYYY-MM')"
        else:  # sqlite
            if granularity == 'daily':
                return f"date({date_ref})"
            elif granularity == 'weekly':
                return f"strftime('%Y-W%W', {date_ref})"
            elif granularity == 'quarterly':
                # Q1: Jan-Mar (months 1-3), Q2: Apr-Jun (4-6), Q3: Jul-Sep (7-9), Q4: Oct-Dec (10-12)
                return f"""strftime('%Y-Q', {date_ref}) ||
                         CASE
                             WHEN CAST(strftime('%m', {date_ref}) AS INTEGER) <= 3 THEN '1'
                             WHEN CAST(strftime('%m', {date_ref}) AS INTEGER) <= 6 THEN '2'
                             WHEN CAST(strftime('%m', {date_ref}) AS INTEGER) <= 9 THEN '3'
                             ELSE '4'
                         END"""
            elif granularity == 'annual':
                return f"strftime('%Y', {date_ref})"
            else:  # monthly (default)
                return f"strftime('%Y-%m', {date_ref})"

    async def get_kpi_summary(self, filters: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Get KPI summary metrics"""

        sql = f"""
            SELECT
                SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS total_revenue,
                SUM({self.schema.TRANSACTION.refs['net_sales_quantity']}) AS total_units,
                COUNT(DISTINCT {self.schema.TRANSACTION.refs['sales_txn_number']}) AS total_orders,
                CASE
                    WHEN COUNT(DISTINCT {self.schema.TRANSACTION.refs['sales_txn_number']}) > 0 THEN
                        SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) * 1.0 /
                        COUNT(DISTINCT {self.schema.TRANSACTION.refs['sales_txn_number']})
                    ELSE 0
                END AS avg_order_value,
                CASE
                    WHEN SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) > 0 THEN
                        ((SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) -
                          SUM(COALESCE({self.schema.TRANSACTION.refs['cost_amount']}, 0))) /
                         SUM({self.schema.TRANSACTION.refs['net_sales_amount']})) * 100.0
                    ELSE 0
                END AS margin_percentage
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
                ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
            LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
                ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
            WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
                AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            row = result[0]
            return {
                'totalRevenue': float(row.get('total_revenue') or 0),
                'totalUnits': float(row.get('total_units') or 0),
                'totalOrders': int(row.get('total_orders') or 0),
                'avgOrderValue': float(row.get('avg_order_value') or 0),
                'marginPercentage': float(row.get('margin_percentage') or 0)
            }

        return {
            'totalRevenue': 0,
            'totalUnits': 0,
            'totalOrders': 0,
            'avgOrderValue': 0,
            'marginPercentage': 0
        }

    async def get_time_series_data(self, filters: Dict[str, Any] = {}) -> List[Dict[str, Any]]:
        """Get time series data with specified granularity"""
        granularity = filters.get('granularity', 'monthly')
        time_group = self._get_time_group_expression(granularity)

        sql = f"""
            SELECT
                {time_group} AS period,
                SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS revenue,
                SUM({self.schema.TRANSACTION.refs['net_sales_quantity']}) AS units,
                COUNT(DISTINCT {self.schema.TRANSACTION.refs['sales_txn_number']}) AS orders
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
                ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
            LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
                ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
            WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
                AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
            GROUP BY period
            ORDER BY period ASC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [
            {
                'period': row['period'],
                'revenue': float(row.get('revenue') or 0),
                'units': float(row.get('units') or 0),
                'orders': int(row.get('orders') or 0)
            }
            for row in result
        ]

    async def get_seasonality_data(self, filters: Dict[str, Any] = {}) -> List[Dict[str, Any]]:
        """Get seasonality analysis data by year and month"""
        date_ref = self.schema.TRANSACTION.refs['date']
        year_expr = self._date_part(date_ref, 'year')
        month_expr = self._date_part(date_ref, 'month')

        sql = f"""
            SELECT
                {year_expr} AS year,
                {month_expr} AS month,
                SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS revenue
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
                ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
            LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
                ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
            WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
                AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
            GROUP BY year, month
            ORDER BY year, month
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [
            {
                'year': row['year'],
                'month': row['month'],
                'revenue': float(row.get('revenue') or 0)
            }
            for row in result
        ]

    async def get_top_performers(self, filters: Dict[str, Any] = {}) -> List[Dict[str, Any]]:
        """Get top performers by specified dimension"""
        dimension = filters.get('dimension')
        top_n = filters.get('topN', 10)

        if not dimension:
            return []

        # Map dimension to table column
        dimension_map = {
            'product': self.schema.ITEM.refs['desc'],
            'category': self.schema.ITEM.refs['category'],
            'region': self.schema.CUSTOMER.refs['state'],
            'customer': self.schema.CUSTOMER.refs['name']
        }

        if dimension not in dimension_map:
            return []

        dim_column = dimension_map[dimension]

        sql = f"""
            SELECT
                {dim_column} AS name,
                SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS revenue,
                SUM({self.schema.TRANSACTION.refs['net_sales_quantity']}) AS units,
                COUNT(DISTINCT {self.schema.TRANSACTION.refs['sales_txn_number']}) AS orders
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
                ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
            LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
                ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
            WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
                AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
                AND {dim_column} IS NOT NULL
            GROUP BY {dim_column}
            ORDER BY revenue DESC
            LIMIT {top_n}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [
            {
                'name': row['name'],
                'revenue': float(row.get('revenue') or 0),
                'units': float(row.get('units') or 0),
                'orders': int(row.get('orders') or 0)
            }
            for row in result
        ]
