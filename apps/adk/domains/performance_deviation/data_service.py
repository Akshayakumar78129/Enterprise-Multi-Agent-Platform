"""Data service for Performance Deviation Analysis"""

from typing import Dict, List, Any, Optional
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import PerformanceSchema


class PerformanceDataService:
    """Service for fetching performance deviation data from database"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.filter_engine = FilterEngine()
        self.schema = PerformanceSchema()

    async def get_sales_kpis(self, filters: Dict) -> Dict:
        """Get sales KPIs with filtering"""
        # Build where clause using filter engine
        where_conditions = []
        params = []

        # Extract dateRange if provided by frontend (Performance Deviation sends nested dateRange object)
        if filters.get('dateRange'):
            date_range = filters['dateRange']
            if not filters.get('dateFrom'):
                filters['dateFrom'] = date_range.get('startDate')
            if not filters.get('dateTo'):
                filters['dateTo'] = date_range.get('endDate')

        # Add default dates as fallback
        if not filters.get('dateFrom'):
            filters['dateFrom'] = '2017-01-01'
        if not filters.get('dateTo'):
            filters['dateTo'] = '2021-12-31'

        if filters.get('dateFrom'):
            where_conditions.append(f"{self.schema.SALES.refs['date']} >= ?")
            params.append(filters['dateFrom'])

        if filters.get('dateTo'):
            where_conditions.append(f"{self.schema.SALES.refs['date']} <= ?")
            params.append(filters['dateTo'])

        if filters.get('customerIds'):
            placeholders = ','.join(['?' for _ in filters['customerIds']])
            where_conditions.append(f"{self.schema.SALES.refs['customer_key']} IN ({placeholders})")
            params.extend(filters['customerIds'])

        if filters.get('productGroups'):
            placeholders = ','.join(['?' for _ in filters['productGroups']])
            where_conditions.append(f"{self.schema.SALES.refs['product_group']} IN ({placeholders})")
            params.extend(filters['productGroups'])

        where_clause = ' AND ' + ' AND '.join(where_conditions) if where_conditions else ''

        # Build base query
        query = f"""
        WITH sales_daily AS (
            SELECT
                {self.schema.SALES.refs['date']} AS date,
                'sales' AS function,
                COUNT(DISTINCT {self.schema.SALES.refs['document']}) AS transaction_count,
                SUM(COALESCE({self.schema.SALES.refs['amount']}, 0)) AS total_revenue,
                AVG(COALESCE({self.schema.SALES.refs['amount']}, 0)) AS avg_transaction_value,
                COUNT(DISTINCT {self.schema.SALES.refs['customer_key']}) AS unique_customers
            FROM {self.schema.TABLES['sales']}
            WHERE {self.schema.SALES.refs['amount']} IS NOT NULL
            {where_clause}
            GROUP BY {self.schema.SALES.refs['date']}
        )
        SELECT
            date,
            function,
            transaction_count,
            total_revenue,
            avg_transaction_value,
            unique_customers,
            CASE
                WHEN transaction_count > 0
                THEN total_revenue / transaction_count
                ELSE 0
            END AS order_value
        FROM sales_daily
        ORDER BY date
        """

        result = await self.db.query(query, params)
        return {
            'rows': result.get('rows', []),
            'count': len(result.get('rows', []))
        }

    async def get_customer_kpis(self, filters: Dict) -> Dict:
        """Get customer loyalty KPIs with filtering"""
        # Build where clause
        where_conditions = []
        params = []

        # Extract dateRange if provided by frontend (Performance Deviation sends nested dateRange object)
        if filters.get('dateRange'):
            date_range = filters['dateRange']
            if not filters.get('dateFrom'):
                filters['dateFrom'] = date_range.get('startDate')
            if not filters.get('dateTo'):
                filters['dateTo'] = date_range.get('endDate')

        # Add default dates as fallback
        if not filters.get('dateFrom'):
            filters['dateFrom'] = '2017-01-01'
        if not filters.get('dateTo'):
            filters['dateTo'] = '2021-12-31'

        if filters.get('dateFrom'):
            where_conditions.append(f"{self.schema.LOYALTY.refs['date']} >= ?")
            params.append(filters['dateFrom'])

        if filters.get('dateTo'):
            where_conditions.append(f"{self.schema.LOYALTY.refs['date']} <= ?")
            params.append(filters['dateTo'])

        if filters.get('customerSegments'):
            placeholders = ','.join(['?' for _ in filters['customerSegments']])
            where_conditions.append(f"{self.schema.LOYALTY.refs['segment']} IN ({placeholders})")
            params.extend(filters['customerSegments'])

        where_clause = ' AND ' + ' AND '.join(where_conditions) if where_conditions else ''

        query = f"""
        WITH customer_kpis AS (
            SELECT
                {self.schema.LOYALTY.refs['date']} AS date,
                'customer' AS function,
                SUM(COALESCE({self.schema.LOYALTY.refs['active_count']}, 0)) AS active_customers,
                SUM(COALESCE({self.schema.LOYALTY.refs['loyal_count']}, 0)) AS loyal_customers,
                AVG(COALESCE({self.schema.LOYALTY.refs['rfm_score']}, 0)) AS avg_rfm_score,
                COUNT(DISTINCT {self.schema.LOYALTY.refs['customer_key']}) AS total_customers
            FROM {self.schema.TABLES['loyalty']}
            WHERE 1=1
            {where_clause}
            GROUP BY {self.schema.LOYALTY.refs['date']}
        )
        SELECT * FROM customer_kpis
        ORDER BY date
        """

        result = await self.db.query(query, params)
        return {
            'rows': result.get('rows', []),
            'count': len(result.get('rows', []))
        }

    async def get_finance_kpis(self, filters: Dict) -> Dict:
        """Get AR/Finance KPIs with filtering"""
        # Build where clause
        where_conditions = []
        params = []

        # Extract dateRange if provided by frontend (Performance Deviation sends nested dateRange object)
        if filters.get('dateRange'):
            date_range = filters['dateRange']
            if not filters.get('dateFrom'):
                filters['dateFrom'] = date_range.get('startDate')
            if not filters.get('dateTo'):
                filters['dateTo'] = date_range.get('endDate')

        # Add default dates as fallback
        if not filters.get('dateFrom'):
            filters['dateFrom'] = '2017-01-01'
        if not filters.get('dateTo'):
            filters['dateTo'] = '2021-12-31'

        if filters.get('dateFrom'):
            where_conditions.append(f"{self.schema.AR.refs['date']} >= ?")
            params.append(filters['dateFrom'])

        if filters.get('dateTo'):
            where_conditions.append(f"{self.schema.AR.refs['date']} <= ?")
            params.append(filters['dateTo'])

        if filters.get('customerIds'):
            placeholders = ','.join(['?' for _ in filters['customerIds']])
            where_conditions.append(f"{self.schema.AR.refs['customer_key']} IN ({placeholders})")
            params.extend(filters['customerIds'])

        where_clause = ' AND ' + ' AND '.join(where_conditions) if where_conditions else ''

        query = f"""
        WITH ar_kpis AS (
            SELECT
                {self.schema.AR.refs['date']} AS date,
                'finance' AS function,
                COUNT(DISTINCT {self.schema.AR.refs['detail_id']}) AS ar_transactions,
                SUM(COALESCE({self.schema.AR.refs['amount']}, 0)) AS total_ar_amount,
                AVG(COALESCE({self.schema.AR.refs['age_days']}, 0)) AS avg_age_days,
                COUNT(DISTINCT {self.schema.AR.refs['customer_key']}) AS ar_customers
            FROM {self.schema.TABLES['ar']}
            WHERE 1=1
            {where_clause}
            GROUP BY {self.schema.AR.refs['date']}
        )
        SELECT * FROM ar_kpis
        ORDER BY date
        """

        result = await self.db.query(query, params)
        return {
            'rows': result.get('rows', []),
            'count': len(result.get('rows', []))
        }

    async def get_all_kpis(self, filters: Dict) -> Dict:
        """Get all KPIs combined"""
        # Get business functions filter
        business_functions = filters.get('businessFunctions', ['sales', 'customer', 'finance'])

        # If business functions is explicitly empty, return no data
        if 'businessFunctions' in filters and not business_functions:
            return {
                'rows': [],
                'sales': [],
                'customer': [],
                'finance': [],
                'count': 0
            }

        # Fetch only requested KPIs
        sales_kpis = await self.get_sales_kpis(filters) if 'sales' in business_functions else {'rows': []}
        customer_kpis = await self.get_customer_kpis(filters) if 'customer' in business_functions else {'rows': []}
        finance_kpis = await self.get_finance_kpis(filters) if 'finance' in business_functions else {'rows': []}

        # Combine all KPIs
        all_kpis = []
        all_kpis.extend(sales_kpis.get('rows', []))
        all_kpis.extend(customer_kpis.get('rows', []))
        all_kpis.extend(finance_kpis.get('rows', []))

        return {
            'rows': all_kpis,
            'sales': sales_kpis.get('rows', []),
            'customer': customer_kpis.get('rows', []),
            'finance': finance_kpis.get('rows', []),
            'count': len(all_kpis)
        }