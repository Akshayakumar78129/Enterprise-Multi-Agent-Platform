"""Customer behavior data service - Following pattern from other domains"""

from typing import Dict, List, Any
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import CustomerBehaviorSchema


class CustomerBehaviorDataService:
    """Data service for customer behavior analysis"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = CustomerBehaviorSchema()
        self.filter_engine = FilterEngine()

    async def get_customers(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get customer data with extended information for behavior analysis

        Returns customer data with segment, type, and loyalty information
        """
        sql = f"""
        SELECT DISTINCT
            {self.schema.CUSTOMER.refs['id']} AS {self.schema.CUSTOMER.output_aliases['id']},
            {self.schema.CUSTOMER.refs['name']} AS {self.schema.CUSTOMER.output_aliases['name']},
            {self.schema.CUSTOMER.refs['type']} AS {self.schema.CUSTOMER.output_aliases['type']},
            {self.schema.CUSTOMER.refs['category']} AS {self.schema.CUSTOMER.output_aliases['category']},
            {self.schema.CUSTOMER.refs['status']} AS {self.schema.CUSTOMER.output_aliases['status']},
            {self.schema.CUSTOMER.refs['city']} AS {self.schema.CUSTOMER.output_aliases['city']},
            {self.schema.CUSTOMER.refs['region']} AS {self.schema.CUSTOMER.output_aliases['region']},
            {self.schema.CUSTOMER.refs['country']} AS {self.schema.CUSTOMER.output_aliases['country']}
        FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
        LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
            ON {self.schema.LOYALTY.refs['customer_id']} = {self.schema.CUSTOMER.refs['id']}
        WHERE {self.schema.CUSTOMER.refs['id']} > 0
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_transactions(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get transaction data for behavior analysis

        Returns transaction data with sales amounts, quantities, and product information
        """
        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['customer_id']} AS {self.schema.TRANSACTION.output_aliases['customer_id']},
            {self.schema.TRANSACTION.refs['txn_date']} AS {self.schema.TRANSACTION.output_aliases['txn_date']},
            {self.schema.TRANSACTION.refs['net_sales_amount']} AS {self.schema.TRANSACTION.output_aliases['net_sales_amount']},
            {self.schema.TRANSACTION.refs['net_sales_quantity']} AS {self.schema.TRANSACTION.output_aliases['net_sales_quantity']},
            {self.schema.TRANSACTION.refs['item_id']} AS {self.schema.TRANSACTION.output_aliases['item_id']},
            {self.schema.TRANSACTION.refs['line_type']} AS {self.schema.TRANSACTION.output_aliases['line_type']},
            {self.schema.TRANSACTION.refs['product_category']} AS {self.schema.TRANSACTION.output_aliases['product_category']},
            {self.schema.TRANSACTION.refs['sales_amount']} AS {self.schema.TRANSACTION.output_aliases['sales_amount']},
            {self.schema.TRANSACTION.refs['return_amount']} AS {self.schema.TRANSACTION.output_aliases['return_amount']},
            {self.schema.TRANSACTION.refs['discount_amount']} AS {self.schema.TRANSACTION.output_aliases['discount_amount']}
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.TRANSACTION.refs['customer_id']}
        WHERE {self.schema.TRANSACTION.refs['customer_id']} > 0
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_loyalty(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get loyalty metrics for customers

        Returns loyalty data including status, RFM scores, and activity dates
        """
        sql = f"""
        SELECT
            {self.schema.LOYALTY.refs['customer_id']} AS {self.schema.LOYALTY.output_aliases['customer_id']},
            {self.schema.LOYALTY.refs['loyalty_status']} AS {self.schema.LOYALTY.output_aliases['loyalty_status']},
            {self.schema.LOYALTY.refs['rfm_score']} AS {self.schema.LOYALTY.output_aliases['rfm_score']},
            {self.schema.LOYALTY.refs['recency_band']} AS {self.schema.LOYALTY.output_aliases['recency_band']},
            {self.schema.LOYALTY.refs['frequency_band']} AS {self.schema.LOYALTY.output_aliases['frequency_band']},
            {self.schema.LOYALTY.refs['monetary_band']} AS {self.schema.LOYALTY.output_aliases['monetary_band']},
            {self.schema.LOYALTY.refs['first_activity_date']} AS {self.schema.LOYALTY.output_aliases['first_activity_date']},
            {self.schema.LOYALTY.refs['last_activity_date']} AS {self.schema.LOYALTY.output_aliases['last_activity_date']},
            {self.schema.LOYALTY.refs['days_since_last_activity']} AS {self.schema.LOYALTY.output_aliases['days_since_last_activity']},
            {self.schema.LOYALTY.refs['lifetime_sales']} AS {self.schema.LOYALTY.output_aliases['lifetime_sales']}
        FROM {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
        WHERE 1=1
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_product_categories(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get product category aggregates for analysis

        Returns aggregated product category data
        """
        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['customer_id']} AS customer_id,
            {self.schema.TRANSACTION.refs['product_category']} AS product_category,
            COUNT(*) AS transaction_count,
            SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS total_sales,
            AVG({self.schema.TRANSACTION.refs['net_sales_amount']}) AS avg_sales
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        WHERE {self.schema.TRANSACTION.refs['customer_id']} > 0
        GROUP BY
            {self.schema.TRANSACTION.refs['customer_id']},
            {self.schema.TRANSACTION.refs['product_category']}
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_behavior_analysis_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get comprehensive customer behavior data - matches web folder logic"""

        # Simplified query for debugging
        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['id']} as customer_id,
            {self.schema.CUSTOMER.refs['name']} as customer_name,
            {self.schema.CUSTOMER.refs['type']} as customer_type,
            {self.schema.CUSTOMER.refs['status']} as customer_status,
            COUNT({self.schema.TRANSACTION.refs['txn_key']}) as transaction_count,
            SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) as total_spend,
            AVG({self.schema.TRANSACTION.refs['net_sales_amount']}) as avg_order_value,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['product_category']}) as category_diversity,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['line_type']}) as channel_diversity,
            MIN({self.schema.TRANSACTION.refs['txn_date']}) as first_purchase_date,
            MAX({self.schema.TRANSACTION.refs['txn_date']}) as last_purchase_date
        FROM
            {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
        LEFT JOIN
            {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.TRANSACTION.refs['customer_id']}
        WHERE
            {self.schema.CUSTOMER.refs['id']} > 0
        GROUP BY
            {self.schema.CUSTOMER.refs['id']},
            {self.schema.CUSTOMER.refs['name']},
            {self.schema.CUSTOMER.refs['type']},
            {self.schema.CUSTOMER.refs['status']}
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_transaction_details(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get detailed transaction data for behavior analysis - matches web folder logic"""

        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['customer_id']} as customer_id,
            {self.schema.TRANSACTION.refs['txn_date']} as transaction_date,
            {self.schema.TRANSACTION.refs['net_sales_amount']} as sales_amount,
            {self.schema.TRANSACTION.refs['net_sales_quantity']} as quantity,
            {self.schema.TRANSACTION.refs['item_id']} as item_id,
            {self.schema.TRANSACTION.refs['line_type']} as sales_channel,
            {self.schema.TRANSACTION.refs['product_category']} as product_category
        FROM
            {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        WHERE
            {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
            AND {self.schema.TRANSACTION.refs['customer_id']} > 0
            AND {self.schema.TRANSACTION.refs['net_sales_amount']} IS NOT NULL
            AND {self.schema.TRANSACTION.refs['net_sales_quantity']} IS NOT NULL
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)