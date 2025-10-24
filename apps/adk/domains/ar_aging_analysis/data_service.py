"""Data service for AR Aging Analysis"""

from typing import Dict, Any, List
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import ARAgingSchema


class ARAgingDataService:
    """Handles all database queries for AR aging analysis"""

    def __init__(self):
        self.db = DatabaseConnection(use_pool=False)
        self.schema = ARAgingSchema()
        self.filter_engine = FilterEngine()

    async def get_ar_invoices(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get AR invoices with aging calculations

        Returns AR invoices with days overdue calculated
        """
        sql = f"""
        SELECT
            {self.schema.AR_DETAIL.refs['customer_id']} AS {self.schema.AR_DETAIL.output_aliases['customer_id']},
            {self.schema.AR_DETAIL.refs['debit_amount']} AS {self.schema.AR_DETAIL.output_aliases['debit_amount']},
            {self.schema.AR_DETAIL.refs['posting_date']} AS {self.schema.AR_DETAIL.output_aliases['posting_date']},
            {self.schema.AR_DETAIL.refs['txn_date']} AS {self.schema.AR_DETAIL.output_aliases['txn_date']},
            {self.schema.AR_DETAIL.refs['document_number']} AS {self.schema.AR_DETAIL.output_aliases['document_number']},
            {self.schema.AR_DETAIL.refs['age_band_days']} AS {self.schema.AR_DETAIL.output_aliases['age_band_days']},
            ABS({self.schema.AR_DETAIL.refs['age_band_days']}) as days_overdue,
            {self.schema.CUSTOMER.refs['name']} AS {self.schema.CUSTOMER.output_aliases['name']},
            {self.schema.CUSTOMER.refs['type']} AS {self.schema.CUSTOMER.output_aliases['type']},
            {self.schema.CUSTOMER.refs['category']} AS {self.schema.CUSTOMER.output_aliases['category']},
            {self.schema.CUSTOMER.refs['region']} AS {self.schema.CUSTOMER.output_aliases['region']},
            {self.schema.CUSTOMER.refs['credit_limit']} AS {self.schema.CUSTOMER.output_aliases['credit_limit']}
        FROM {self.schema.TABLES['ar_detail']} {self.schema.ALIASES['ar_detail']}
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.AR_DETAIL.refs['customer_id']} = {self.schema.CUSTOMER.refs['id']}
        WHERE {self.schema.AR_DETAIL.refs['debit_amount']} > 0
            AND {self.schema.AR_DETAIL.refs['deleted_flag']} = 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])

    async def get_customer_sales_metrics(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get customer sales metrics for CLV calculation

        Returns aggregated sales metrics by customer
        """
        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['customer_id']} AS {self.schema.TRANSACTION.output_aliases['customer_id']},
            SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) as total_sales,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['txn_date']}) as transaction_count,
            AVG({self.schema.TRANSACTION.refs['net_sales_amount']}) as avg_transaction_value,
            MAX({self.schema.TRANSACTION.refs['txn_date']}) as last_transaction_date,
            MIN({self.schema.TRANSACTION.refs['txn_date']}) as first_transaction_date
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
            AND {self.schema.TRANSACTION.refs['net_sales_amount']} > 0
        GROUP BY {self.schema.TRANSACTION.refs['customer_id']}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])

    async def get_customer_loyalty_metrics(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get customer loyalty metrics

        Returns loyalty and RFM data for customers
        """
        sql = f"""
        SELECT
            {self.schema.LOYALTY.refs['customer_id']} AS {self.schema.LOYALTY.output_aliases['customer_id']},
            {self.schema.LOYALTY.refs['loyalty_status']} AS {self.schema.LOYALTY.output_aliases['loyalty_status']},
            {self.schema.LOYALTY.refs['rfm_score']} AS {self.schema.LOYALTY.output_aliases['rfm_score']},
            {self.schema.LOYALTY.refs['lifetime_sales']} AS {self.schema.LOYALTY.output_aliases['lifetime_sales']},
            {self.schema.LOYALTY.refs['days_since_last_activity']} AS {self.schema.LOYALTY.output_aliases['days_since_last_activity']},
            {self.schema.LOYALTY.refs['recency_band']} AS {self.schema.LOYALTY.output_aliases['recency_band']},
            {self.schema.LOYALTY.refs['frequency_band']} AS {self.schema.LOYALTY.output_aliases['frequency_band']},
            {self.schema.LOYALTY.refs['monetary_band']} AS {self.schema.LOYALTY.output_aliases['monetary_band']}
        FROM {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
        WHERE {self.schema.LOYALTY.refs['customer_id']} > 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])

    async def get_aging_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get aggregated aging summary

        Returns total AR, overdue amount, and count by aging bucket
        """
        sql = f"""
        SELECT
            COUNT(*) as total_invoices,
            SUM({self.schema.AR_DETAIL.refs['debit_amount']}) as total_ar,
            SUM(CASE
                WHEN ABS({self.schema.AR_DETAIL.refs['age_band_days']}) > 30
                THEN {self.schema.AR_DETAIL.refs['debit_amount']}
                ELSE 0
            END) as total_overdue,
            SUM(CASE
                WHEN ABS({self.schema.AR_DETAIL.refs['age_band_days']}) <= 30
                THEN {self.schema.AR_DETAIL.refs['debit_amount']}
                ELSE 0
            END) as current_amount,
            AVG(ABS({self.schema.AR_DETAIL.refs['age_band_days']})) as avg_days_overdue,
            COUNT(DISTINCT {self.schema.AR_DETAIL.refs['customer_id']}) as unique_customers
        FROM {self.schema.TABLES['ar_detail']} {self.schema.ALIASES['ar_detail']}
        WHERE {self.schema.AR_DETAIL.refs['debit_amount']} > 0
            AND {self.schema.AR_DETAIL.refs['deleted_flag']} = 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        rows = result_dict.get('rows', [])

        if rows and len(rows) > 0:
            return rows[0]

        return {
            'total_invoices': 0,
            'total_ar': 0,
            'total_overdue': 0,
            'current_amount': 0,
            'avg_days_overdue': 0,
            'unique_customers': 0
        }

    async def get_customer_ar_details(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get detailed AR by customer with sales and loyalty metrics

        Returns comprehensive customer AR profile with CLV and risk indicators
        """
        sql = f"""
        SELECT
            c.{self.schema.CUSTOMER.refs['id'].split('.')[-1]} AS customer_id,
            c.{self.schema.CUSTOMER.refs['name'].split('.')[-1]} AS customer_name,
            c.{self.schema.CUSTOMER.refs['type'].split('.')[-1]} AS customer_type,
            c.{self.schema.CUSTOMER.refs['region'].split('.')[-1]} AS region,
            c.{self.schema.CUSTOMER.refs['credit_limit'].split('.')[-1]} AS credit_limit,
            SUM({self.schema.AR_DETAIL.refs['debit_amount']}) as total_outstanding,
            AVG(ABS({self.schema.AR_DETAIL.refs['age_band_days']})) as avg_days_overdue,
            MAX(ABS({self.schema.AR_DETAIL.refs['age_band_days']})) as max_days_overdue,
            COUNT(*) as invoice_count,
            l.{self.schema.LOYALTY.refs['lifetime_sales'].split('.')[-1]} AS lifetime_sales,
            l.{self.schema.LOYALTY.refs['rfm_score'].split('.')[-1]} AS rfm_score,
            l.{self.schema.LOYALTY.refs['loyalty_status'].split('.')[-1]} AS loyalty_status
        FROM {self.schema.TABLES['ar_detail']} {self.schema.ALIASES['ar_detail']}
        INNER JOIN {self.schema.TABLES['customer']} c
            ON {self.schema.AR_DETAIL.refs['customer_id']} = c."Customer Key"
        LEFT JOIN {self.schema.TABLES['loyalty']} l
            ON c."Customer Key" = l."Entity Key"
        WHERE {self.schema.AR_DETAIL.refs['debit_amount']} > 0
            AND {self.schema.AR_DETAIL.refs['deleted_flag']} = 0
        GROUP BY
            c."Customer Key",
            c."Customer Name",
            c."Customer Type Desc",
            c."Customer State/Prov",
            c."Credit Limit Amount",
            l."LTD Sales Amount",
            l."RFM Score",
            l."Loyalty Status"
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])
