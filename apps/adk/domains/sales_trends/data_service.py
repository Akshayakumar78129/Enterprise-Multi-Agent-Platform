"""Data service for sales trends - handles SQLite database queries"""

import os
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio


class SalesTrendsDataService:
    """Data service for sales trends analysis"""

    def __init__(self):
        # Use sales_agent.db from the Sales/database directory
        self.db_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            '..',
            'web',
            'Sales',
            'database',
            'sales_agent.db'
        )

        # Normalize path
        self.db_path = os.path.normpath(self.db_path)

        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Database not found at: {self.db_path}")

    def _get_connection(self) -> sqlite3.Connection:
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    async def execute_query(self, sql: str, params: tuple = ()) -> List[Dict]:
        """Execute SQL query asynchronously"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._execute_query_sync, sql, params)

    def _execute_query_sync(self, sql: str, params: tuple = ()) -> List[Dict]:
        """Execute SQL query synchronously"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    def _build_where_clause(self, filters: Dict[str, Any]) -> tuple[str, list]:
        """Build WHERE clause and parameters from filters"""
        conditions = []
        params = []

        # Base filters - always exclude deleted and excluded records
        conditions.append('"dbo_F_Sales_Transaction"."Deleted Flag" = ?')
        params.append(0)
        conditions.append('"dbo_F_Sales_Transaction"."Excluded Flag" = ?')
        params.append(0)

        # Date range filters
        if filters.get('dateFrom'):
            conditions.append('date("dbo_F_Sales_Transaction"."Txn Date") >= date(?)')
            params.append(filters['dateFrom'])

        if filters.get('dateTo'):
            conditions.append('date("dbo_F_Sales_Transaction"."Txn Date") <= date(?)')
            params.append(filters['dateTo'])

        # Customer category filter (from dimension table)
        if filters.get('customerCategory'):
            categories = filters['customerCategory']
            if isinstance(categories, list) and len(categories) > 0:
                placeholders = ','.join('?' * len(categories))
                conditions.append(f'"dbo_D_Customer"."Customer Type Desc" IN ({placeholders})')
                params.extend(categories)

        # Customer region filter
        if filters.get('customerRegion'):
            regions = filters['customerRegion']
            if isinstance(regions, list) and len(regions) > 0:
                placeholders = ','.join('?' * len(regions))
                # Check both State/Prov and Country
                conditions.append(f'("dbo_D_Customer"."Customer State/Prov" IN ({placeholders}) OR "dbo_D_Customer"."Customer Country" IN ({placeholders}))')
                params.extend(regions * 2)

        # Item name filter
        if filters.get('itemName'):
            items = filters['itemName']
            if isinstance(items, list) and len(items) > 0:
                placeholders = ','.join('?' * len(items))
                conditions.append(f'"dbo_D_Item"."Item Desc" IN ({placeholders})')
                params.extend(items)

        where_clause = ' AND '.join(conditions) if conditions else '1=1'
        return where_clause, params

    def _get_join_clauses(self, filters: Dict[str, Any]) -> str:
        """Get JOIN clauses based on filters"""
        joins = []

        # Customer dimension - needed for customer filters
        if filters.get('customerCategory') or filters.get('customerRegion'):
            joins.append('''
                LEFT JOIN "dbo_D_Customer" ON
                    "dbo_F_Sales_Transaction"."Customer Key" = "dbo_D_Customer"."Customer Key"
            ''')

        # Item dimension - needed for item filters
        if filters.get('itemName'):
            joins.append('''
                LEFT JOIN "dbo_D_Item" ON
                    "dbo_F_Sales_Transaction"."Item Key" = "dbo_D_Item"."Item Key"
            ''')

        return ' '.join(joins)

    def _get_time_group_expression(self, granularity: str) -> str:
        """Get SQL expression for time grouping"""
        if granularity == 'daily':
            return 'date("dbo_F_Sales_Transaction"."Txn Date")'
        elif granularity == 'weekly':
            return 'strftime(\'%Y-W%W\', "dbo_F_Sales_Transaction"."Txn Date")'
        elif granularity == 'quarterly':
            # Q1: Jan-Mar (months 1-3), Q2: Apr-Jun (4-6), Q3: Jul-Sep (7-9), Q4: Oct-Dec (10-12)
            return '''strftime('%Y-Q', "dbo_F_Sales_Transaction"."Txn Date") ||
                     CASE
                         WHEN CAST(strftime('%m', "dbo_F_Sales_Transaction"."Txn Date") AS INTEGER) <= 3 THEN '1'
                         WHEN CAST(strftime('%m', "dbo_F_Sales_Transaction"."Txn Date") AS INTEGER) <= 6 THEN '2'
                         WHEN CAST(strftime('%m', "dbo_F_Sales_Transaction"."Txn Date") AS INTEGER) <= 9 THEN '3'
                         ELSE '4'
                     END'''
        elif granularity == 'annual':
            return 'strftime(\'%Y\', "dbo_F_Sales_Transaction"."Txn Date")'
        else:  # monthly (default)
            return 'strftime(\'%Y-%m\', "dbo_F_Sales_Transaction"."Txn Date")'

    async def get_kpi_summary(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get KPI summary metrics"""
        where_clause, params = self._build_where_clause(filters)
        join_clauses = self._get_join_clauses(filters)

        sql = f'''
            SELECT
                SUM("dbo_F_Sales_Transaction"."Net Sales Amount") AS total_revenue,
                SUM("dbo_F_Sales_Transaction"."Net Sales Quantity") AS total_units,
                COUNT(DISTINCT "dbo_F_Sales_Transaction"."Sales Txn Number") AS total_orders,
                CASE
                    WHEN COUNT(DISTINCT "dbo_F_Sales_Transaction"."Sales Txn Number") > 0 THEN
                        SUM("dbo_F_Sales_Transaction"."Net Sales Amount") * 1.0 /
                        COUNT(DISTINCT "dbo_F_Sales_Transaction"."Sales Txn Number")
                    ELSE 0
                END AS avg_order_value,
                CASE
                    WHEN SUM("dbo_F_Sales_Transaction"."Net Sales Amount") > 0 THEN
                        ((SUM("dbo_F_Sales_Transaction"."Net Sales Amount") -
                          SUM(COALESCE("dbo_F_Sales_Transaction"."Cost Amount", 0))) /
                         SUM("dbo_F_Sales_Transaction"."Net Sales Amount")) * 100.0
                    ELSE 0
                END AS margin_percentage
            FROM "dbo_F_Sales_Transaction"
            {join_clauses}
            WHERE {where_clause}
        '''

        result = await self.execute_query(sql, tuple(params))

        if result and len(result) > 0:
            row = result[0]
            return {
                'totalRevenue': float(row['total_revenue'] or 0),
                'totalUnits': float(row['total_units'] or 0),
                'totalOrders': int(row['total_orders'] or 0),
                'avgOrderValue': float(row['avg_order_value'] or 0),
                'marginPercentage': float(row['margin_percentage'] or 0)
            }

        return {
            'totalRevenue': 0,
            'totalUnits': 0,
            'totalOrders': 0,
            'avgOrderValue': 0,
            'marginPercentage': 0
        }

    async def get_time_series_data(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get time series data with specified granularity"""
        where_clause, params = self._build_where_clause(filters)
        join_clauses = self._get_join_clauses(filters)
        granularity = filters.get('granularity', 'monthly')
        time_group = self._get_time_group_expression(granularity)

        sql = f'''
            SELECT
                {time_group} AS period,
                SUM("dbo_F_Sales_Transaction"."Net Sales Amount") AS revenue,
                SUM("dbo_F_Sales_Transaction"."Net Sales Quantity") AS units,
                COUNT(DISTINCT "dbo_F_Sales_Transaction"."Sales Txn Number") AS orders
            FROM "dbo_F_Sales_Transaction"
            {join_clauses}
            WHERE {where_clause}
            GROUP BY period
            ORDER BY period ASC
        '''

        result = await self.execute_query(sql, tuple(params))

        return [
            {
                'period': row['period'],
                'revenue': float(row['revenue'] or 0),
                'units': float(row['units'] or 0),
                'orders': int(row['orders'] or 0)
            }
            for row in result
        ]

    async def get_seasonality_data(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get seasonality analysis data by year and month"""
        where_clause, params = self._build_where_clause(filters)
        join_clauses = self._get_join_clauses(filters)

        sql = f'''
            SELECT
                strftime('%Y', "dbo_F_Sales_Transaction"."Txn Date") AS year,
                strftime('%m', "dbo_F_Sales_Transaction"."Txn Date") AS month,
                SUM("dbo_F_Sales_Transaction"."Net Sales Amount") AS revenue
            FROM "dbo_F_Sales_Transaction"
            {join_clauses}
            WHERE {where_clause}
            GROUP BY year, month
            ORDER BY year, month
        '''

        result = await self.execute_query(sql, tuple(params))

        return [
            {
                'year': row['year'],
                'month': row['month'],
                'revenue': float(row['revenue'] or 0)
            }
            for row in result
        ]

    async def get_top_performers(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get top performers by specified dimension"""
        dimension = filters.get('dimension')
        top_n = filters.get('topN', 10)

        if not dimension:
            return []

        where_clause, params = self._build_where_clause(filters)

        # Map dimension to table and column
        dimension_map = {
            'product': ('"dbo_D_Item"."Item Desc"', 'LEFT JOIN "dbo_D_Item" ON "dbo_F_Sales_Transaction"."Item Key" = "dbo_D_Item"."Item Key"'),
            'category': ('"dbo_D_Item"."Item Category Desc"', 'LEFT JOIN "dbo_D_Item" ON "dbo_F_Sales_Transaction"."Item Key" = "dbo_D_Item"."Item Key"'),
            'region': ('"dbo_D_Customer"."Customer State/Prov"', 'LEFT JOIN "dbo_D_Customer" ON "dbo_F_Sales_Transaction"."Customer Key" = "dbo_D_Customer"."Customer Key"'),
            'customer': ('"dbo_D_Customer"."Customer Name"', 'LEFT JOIN "dbo_D_Customer" ON "dbo_F_Sales_Transaction"."Customer Key" = "dbo_D_Customer"."Customer Key"')
        }

        if dimension not in dimension_map:
            return []

        dim_column, dim_join = dimension_map[dimension]

        # Get additional joins from filters
        filter_joins = self._get_join_clauses(filters)

        # Combine joins (remove duplicates)
        all_joins = dim_join
        if filter_joins and filter_joins not in all_joins:
            all_joins += ' ' + filter_joins

        sql = f'''
            SELECT
                {dim_column} AS name,
                SUM("dbo_F_Sales_Transaction"."Net Sales Amount") AS revenue,
                SUM("dbo_F_Sales_Transaction"."Net Sales Quantity") AS units,
                COUNT(DISTINCT "dbo_F_Sales_Transaction"."Sales Txn Number") AS orders
            FROM "dbo_F_Sales_Transaction"
            {all_joins}
            WHERE {where_clause} AND {dim_column} IS NOT NULL
            GROUP BY {dim_column}
            ORDER BY revenue DESC
            LIMIT ?
        '''

        params.append(top_n)
        result = await self.execute_query(sql, tuple(params))

        return [
            {
                'name': row['name'],
                'revenue': float(row['revenue'] or 0),
                'units': float(row['units'] or 0),
                'orders': int(row['orders'] or 0)
            }
            for row in result
        ]
