"""
Next Purchase Predictor data service
Following the same pattern as ChurnDataService
"""

from typing import Dict, List, Any
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import NextPurchaseSchema


class NextPurchaseDataService:
    """Data service for Next Purchase Predictor"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = NextPurchaseSchema()
        self.filter_engine = FilterEngine()

    async def get_customers(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get customer data with filters"""

        sql = f"""
        SELECT DISTINCT
            {self.schema.CUSTOMER.refs['id']} AS {self.schema.CUSTOMER.output_aliases['id']},
            {self.schema.CUSTOMER.refs['name']} AS {self.schema.CUSTOMER.output_aliases['name']},
            {self.schema.CUSTOMER.refs['status']} AS {self.schema.CUSTOMER.output_aliases['status']},
            {self.schema.CUSTOMER.refs['region']} AS {self.schema.CUSTOMER.output_aliases['region']},
            {self.schema.CUSTOMER.refs['type']} AS {self.schema.CUSTOMER.output_aliases['type']},
            {self.schema.CUSTOMER.refs['credit_limit']} AS {self.schema.CUSTOMER.output_aliases['credit_limit']}
        FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
        LEFT JOIN {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            ON {self.schema.TRANSACTION.refs['customer_id']} = {self.schema.CUSTOMER.refs['id']}
        LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
            ON {self.schema.LOYALTY.refs['customer_id']} = {self.schema.CUSTOMER.refs['id']}
        WHERE {self.schema.CUSTOMER.refs['id']} > 0
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_transactions(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get transaction data with filters"""

        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['customer_id']} AS {self.schema.TRANSACTION.output_aliases['customer_id']},
            {self.schema.TRANSACTION.refs['txn_id']} AS {self.schema.TRANSACTION.output_aliases['txn_id']},
            {self.schema.TRANSACTION.refs['date']} AS {self.schema.TRANSACTION.output_aliases['date']},
            {self.schema.TRANSACTION.refs['net_amount']} AS {self.schema.TRANSACTION.output_aliases['net_amount']},
            {self.schema.TRANSACTION.refs['gross_amount']} AS {self.schema.TRANSACTION.output_aliases['gross_amount']},
            {self.schema.TRANSACTION.refs['return_amount']} AS {self.schema.TRANSACTION.output_aliases['return_amount']},
            {self.schema.TRANSACTION.refs['quantity']} AS {self.schema.TRANSACTION.output_aliases['quantity']},
            {self.schema.TRANSACTION.refs['item_number']} AS {self.schema.TRANSACTION.output_aliases['item_number']}
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        INNER JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.TRANSACTION.refs['customer_id']}
        WHERE {self.schema.TRANSACTION.refs['net_amount']} IS NOT NULL
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_loyalty(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get loyalty data with filters"""

        sql = f"""
        SELECT
            {self.schema.LOYALTY.refs['customer_id']} AS {self.schema.LOYALTY.output_aliases['customer_id']},
            {self.schema.LOYALTY.refs['customer_number']} AS {self.schema.LOYALTY.output_aliases['customer_number']},
            {self.schema.LOYALTY.refs['loyalty_status']} AS {self.schema.LOYALTY.output_aliases['loyalty_status']},
            {self.schema.LOYALTY.refs['rfm_score']} AS {self.schema.LOYALTY.output_aliases['rfm_score']},
            {self.schema.LOYALTY.refs['days_since_last_activity']} AS {self.schema.LOYALTY.output_aliases['days_since_last_activity']},
            {self.schema.LOYALTY.refs['lifetime_sales']} AS {self.schema.LOYALTY.output_aliases['lifetime_sales']},
            {self.schema.LOYALTY.refs['last_activity_date']} AS {self.schema.LOYALTY.output_aliases['last_activity_date']}
        FROM {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
        INNER JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
        WHERE {self.schema.LOYALTY.refs['customer_id']} > 0
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_aggregated_metrics(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get aggregated metrics for analysis"""

        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['id']} AS customer_id,
            {self.schema.CUSTOMER.refs['name']} AS customer_name,
            {self.schema.CUSTOMER.refs['type']} AS customer_type,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['txn_id']}) AS transaction_count,
            SUM({self.schema.TRANSACTION.refs['net_amount']}) AS total_revenue,
            AVG({self.schema.TRANSACTION.refs['net_amount']}) AS avg_transaction_value,
            MAX({self.schema.TRANSACTION.refs['date']}) AS last_transaction_date,
            MIN({self.schema.TRANSACTION.refs['date']}) AS first_transaction_date,
            {self.schema.LOYALTY.refs['rfm_score']} AS rfm_score,
            {self.schema.LOYALTY.refs['days_since_last_activity']} AS days_since_last_activity,
            {self.schema.LOYALTY.refs['lifetime_sales']} AS lifetime_value
        FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
        LEFT JOIN {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            ON {self.schema.TRANSACTION.refs['customer_id']} = {self.schema.CUSTOMER.refs['id']}
        LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
            ON {self.schema.LOYALTY.refs['customer_id']} = {self.schema.CUSTOMER.refs['id']}
        WHERE {self.schema.CUSTOMER.refs['id']} > 0
        GROUP BY
            {self.schema.CUSTOMER.refs['id']},
            {self.schema.CUSTOMER.refs['name']},
            {self.schema.CUSTOMER.refs['type']},
            {self.schema.LOYALTY.refs['rfm_score']},
            {self.schema.LOYALTY.refs['days_since_last_activity']},
            {self.schema.LOYALTY.refs['lifetime_sales']}
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)
