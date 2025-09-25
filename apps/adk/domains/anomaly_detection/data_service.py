"""Anomaly detection data service - Following ChurnDataService pattern"""

from typing import Dict, List, Any
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import AnomalySchema


class AnomalyDataService:
    """Data service for anomaly detection following ChurnDataService pattern"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = AnomalySchema()
        self.filter_engine = FilterEngine()

    async def get_customers(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get customer data with extended information for anomaly detection

        Returns customer data with basic information plus segment and region
        """
        sql = f"""
        SELECT DISTINCT
            {self.schema.CUSTOMER.refs['id']} AS {self.schema.CUSTOMER.output_aliases['id']},
            {self.schema.CUSTOMER.refs['name']} AS {self.schema.CUSTOMER.output_aliases['name']},
            {self.schema.CUSTOMER.refs['status']} AS {self.schema.CUSTOMER.output_aliases['status']},
            {self.schema.CUSTOMER.refs['region']} AS {self.schema.CUSTOMER.output_aliases['region']},
            {self.schema.CUSTOMER.refs['type']} AS {self.schema.CUSTOMER.output_aliases['type']},
            {self.schema.CUSTOMER.refs['credit_limit']} AS {self.schema.CUSTOMER.output_aliases['credit_limit']},
            {self.schema.CUSTOMER.refs['city']} AS {self.schema.CUSTOMER.output_aliases['city']},
            {self.schema.CUSTOMER.refs['country']} AS {self.schema.CUSTOMER.output_aliases['country']}
        FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
        LEFT JOIN {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            ON {self.schema.TRANSACTION.refs['customer_id']} = {self.schema.CUSTOMER.refs['id']}
        LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
            ON {self.schema.LOYALTY.refs['customer_id']} = {self.schema.CUSTOMER.refs['id']}
        WHERE 1=1
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_transactions(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get transaction data with extended fields for anomaly detection

        Returns transaction data including amounts, quantities, and discounts
        """
        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['customer_id']} AS {self.schema.TRANSACTION.output_aliases['customer_id']},
            {self.schema.TRANSACTION.refs['txn_id']} AS {self.schema.TRANSACTION.output_aliases['txn_id']},
            {self.schema.TRANSACTION.refs['date']} AS {self.schema.TRANSACTION.output_aliases['date']},
            {self.schema.TRANSACTION.refs['net_amount']} AS {self.schema.TRANSACTION.output_aliases['net_amount']},
            {self.schema.TRANSACTION.refs['gross_amount']} AS {self.schema.TRANSACTION.output_aliases['gross_amount']},
            {self.schema.TRANSACTION.refs['return_amount']} AS {self.schema.TRANSACTION.output_aliases['return_amount']},
            {self.schema.TRANSACTION.refs['item_number']} AS {self.schema.TRANSACTION.output_aliases['item_number']},
            {self.schema.TRANSACTION.refs['document']} AS {self.schema.TRANSACTION.output_aliases['document']}
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.TRANSACTION.refs['customer_id']}
        LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
            ON {self.schema.LOYALTY.refs['customer_id']} = {self.schema.TRANSACTION.refs['customer_id']}
        WHERE 1=1
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_loyalty(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get loyalty metrics for customers

        Returns loyalty data including RFM scores and activity metrics
        """
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
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
        LEFT JOIN {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            ON {self.schema.TRANSACTION.refs['customer_id']} = {self.schema.LOYALTY.refs['customer_id']}
        WHERE 1=1
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_ar_details(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get accounts receivable details for financial anomaly detection

        Returns AR data including overdue amounts and days
        """
        sql = f"""
        SELECT
            {self.schema.AR_DETAIL.refs['customer_id']} AS {self.schema.AR_DETAIL.output_aliases['customer_id']},
            {self.schema.AR_DETAIL.refs['document']} AS {self.schema.AR_DETAIL.output_aliases['document']},
            {self.schema.AR_DETAIL.refs['date']} AS {self.schema.AR_DETAIL.output_aliases['date']},
            {self.schema.AR_DETAIL.refs['amount']} AS {self.schema.AR_DETAIL.output_aliases['amount']},
            {self.schema.AR_DETAIL.refs['days_overdue']} AS {self.schema.AR_DETAIL.output_aliases['days_overdue']}
        FROM {self.schema.TABLES['ar_detail']} {self.schema.ALIASES['ar_detail']}
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.AR_DETAIL.refs['customer_id']}
        WHERE 1=1
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_transaction_aggregates(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get aggregated transaction metrics for anomaly detection

        Returns aggregated metrics per customer
        """
        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['customer_id']} AS customer_id,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['txn_id']}) AS transaction_count,
            AVG({self.schema.TRANSACTION.refs['net_amount']}) AS avg_transaction_value,
            MAX({self.schema.TRANSACTION.refs['net_amount']}) AS max_transaction_value,
            MIN({self.schema.TRANSACTION.refs['net_amount']}) AS min_transaction_value,
            MAX({self.schema.TRANSACTION.refs['net_amount']}) - MIN({self.schema.TRANSACTION.refs['net_amount']}) AS transaction_range,
            SUM({self.schema.TRANSACTION.refs['net_amount']}) AS total_spend,
            SUM({self.schema.TRANSACTION.refs['return_amount']}) AS total_returns,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['item_number']}) AS unique_items,
            COUNT(DISTINCT DATE({self.schema.TRANSACTION.refs['date']})) AS unique_transaction_days
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.TRANSACTION.refs['customer_id']}
        WHERE 1=1
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)

        # Add GROUP BY clause after filters
        query += f" GROUP BY {self.schema.TRANSACTION.refs['customer_id']}"

        return await self.db.query(query, params)