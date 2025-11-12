"""Purchase Frequency data service - Database queries"""

from typing import Dict, List, Any
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import PurchaseFrequencySchema


class PurchaseFrequencyDataService:
    """Data service for Purchase Frequency dashboard"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = PurchaseFrequencySchema()
        self.filter_engine = FilterEngine()

    async def get_customer_frequency_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get customer purchase frequency data

        Returns detailed frequency metrics per customer including:
        - Purchase count
        - Average days between purchases
        - Recency (days since last purchase)
        - Total spent and average order value
        """
        # Build date filter for CTE
        date_filter = ""
        params = []
        if filters.get('dateFrom'):
            date_filter += f" AND {self.schema.TRANSACTION.refs['date']} >= ?"
            params.append(filters['dateFrom'])
        if filters.get('dateTo'):
            date_filter += f" AND {self.schema.TRANSACTION.refs['date']} <= ?"
            params.append(filters['dateTo'])

        sql = f"""
        WITH CustomerPurchases AS (
            SELECT
                {self.schema.CUSTOMER.refs['id']} AS customer_id,
                {self.schema.CUSTOMER.refs['name']} AS customer_name,
                {self.schema.TRANSACTION.refs['date']} AS purchase_date,
                {self.schema.TRANSACTION.refs['gross_amount']} AS sales_amount
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            INNER JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
                ON {self.schema.CUSTOMER.refs['id']} = {self.schema.TRANSACTION.refs['customer_id']}
            WHERE {self.schema.TRANSACTION.refs['customer_id']} > 0{date_filter}
        ),
        CustomerStats AS (
            SELECT
                customer_id,
                customer_name,
                COUNT(*) as purchase_count,
                MIN(purchase_date) as first_purchase_date,
                MAX(purchase_date) as last_purchase_date,
                SUM(sales_amount) as total_spent,
                AVG(sales_amount) as avg_order_value
            FROM CustomerPurchases
            GROUP BY customer_id, customer_name
            HAVING COUNT(*) > 0
        ),
        LatestLoyalty AS (
            SELECT DISTINCT
                {self.schema.LOYALTY.refs['customer_id']} as customer_id,
                {self.schema.LOYALTY.refs['loyalty_status']} as loyalty_status
            FROM {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
        )
        SELECT
            cs.customer_id,
            cs.customer_name,
            cs.purchase_count,
            cs.first_purchase_date,
            cs.last_purchase_date,
            cs.total_spent,
            cs.avg_order_value,
            CASE
                WHEN cs.purchase_count >= 10 THEN 'High'
                WHEN cs.purchase_count >= 5 THEN 'Medium'
                ELSE 'Low'
            END as frequency_segment,
            ll.loyalty_status
        FROM CustomerStats cs
        LEFT JOIN LatestLoyalty ll
            ON cs.customer_id = ll.customer_id
        ORDER BY cs.purchase_count DESC
        """

        # Execute query with manually built params
        result = await self.db.query(sql, params)
        return result.get('rows', [])

    async def get_frequency_distribution(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get purchase frequency distribution

        Returns distribution of customers across frequency bins
        """
        sql = f"""
        WITH CustomerPurchaseCounts AS (
            SELECT
                {self.schema.TRANSACTION.refs['customer_id']} AS customer_id,
                COUNT(*) as purchase_count,
                SUM({self.schema.TRANSACTION.refs['gross_amount']}) as total_revenue
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            WHERE {self.schema.TRANSACTION.refs['customer_id']} > 0
            GROUP BY {self.schema.TRANSACTION.refs['customer_id']}
        ),
        FrequencyBins AS (
            SELECT
                CASE
                    WHEN purchase_count = 1 THEN '1'
                    WHEN purchase_count BETWEEN 2 AND 3 THEN '2-3'
                    WHEN purchase_count BETWEEN 4 AND 6 THEN '4-6'
                    WHEN purchase_count BETWEEN 7 AND 10 THEN '7-10'
                    WHEN purchase_count BETWEEN 11 AND 20 THEN '11-20'
                    ELSE '21+'
                END as bin_range,
                purchase_count,
                total_revenue
            FROM CustomerPurchaseCounts
        )
        SELECT
            bin_range,
            COUNT(*) as customer_count,
            SUM(total_revenue) as total_revenue
        FROM FrequencyBins
        GROUP BY bin_range
        ORDER BY
            CASE bin_range
                WHEN '1' THEN 1
                WHEN '2-3' THEN 2
                WHEN '4-6' THEN 3
                WHEN '7-10' THEN 4
                WHEN '11-20' THEN 5
                WHEN '21+' THEN 6
            END
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result = await self.db.query(query, params)
        return result.get('rows', [])

    async def get_purchase_intervals(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get average days between purchases for each customer

        Returns distribution of purchase intervals
        """
        sql = f"""
        WITH CustomerPurchases AS (
            SELECT
                {self.schema.TRANSACTION.refs['customer_id']} AS customer_id,
                {self.schema.TRANSACTION.refs['date']} AS purchase_date
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            WHERE {self.schema.TRANSACTION.refs['customer_id']} > 0
            ORDER BY customer_id, purchase_date
        ),
        IntervalCalc AS (
            SELECT
                customer_id,
                COUNT(*) as purchase_count,
                MIN(purchase_date) as first_date,
                MAX(purchase_date) as last_date
            FROM CustomerPurchases
            GROUP BY customer_id
            HAVING COUNT(*) > 1
        )
        SELECT
            customer_id,
            purchase_count,
            CAST((julianday(last_date) - julianday(first_date)) / NULLIF((purchase_count - 1), 0) AS INTEGER) as avg_days_between
        FROM IntervalCalc
        WHERE (julianday(last_date) - julianday(first_date)) / NULLIF((purchase_count - 1), 0) IS NOT NULL
        ORDER BY avg_days_between
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result = await self.db.query(query, params)
        return result.get('rows', [])

    async def get_customer_segmentation(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get RFM-style customer segmentation

        Segments customers by Recency, Frequency, and Monetary value
        """
        sql = f"""
        WITH CustomerMetrics AS (
            SELECT
                {self.schema.TRANSACTION.refs['customer_id']} AS customer_id,
                COUNT(*) as frequency,
                SUM({self.schema.TRANSACTION.refs['gross_amount']}) as monetary,
                MAX({self.schema.TRANSACTION.refs['date']}) as last_purchase_date
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            WHERE {self.schema.TRANSACTION.refs['customer_id']} > 0
            GROUP BY {self.schema.TRANSACTION.refs['customer_id']}
        ),
        SegmentedCustomers AS (
            SELECT
                customer_id,
                frequency,
                monetary,
                last_purchase_date,
                CASE
                    WHEN frequency >= 10 AND monetary >= 5000 THEN 'High Value / High Frequency'
                    WHEN frequency >= 10 AND monetary < 5000 THEN 'Low Value / High Frequency'
                    WHEN frequency < 10 AND monetary >= 5000 THEN 'High Value / Low Frequency'
                    ELSE 'Low Value / Low Frequency'
                END as segment
            FROM CustomerMetrics
        )
        SELECT
            segment,
            COUNT(*) as customer_count,
            AVG(frequency) as avg_frequency,
            AVG(monetary) as avg_monetary,
            SUM(monetary) as total_revenue
        FROM SegmentedCustomers
        GROUP BY segment
        ORDER BY total_revenue DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result = await self.db.query(query, params)
        return result.get('rows', [])

    async def get_lifecycle_stages(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get customer lifecycle stage distribution

        Categorizes customers as New, Active, At Risk, or Dormant
        based on recency and frequency WITHIN the selected date range
        """
        # Build date filter and get reference date (end of date range)
        date_filter = ""
        params = []
        reference_date = filters.get('dateTo', '2021-12-31')  # Use end of date range as reference

        if filters.get('dateFrom'):
            date_filter += f" AND {self.schema.TRANSACTION.refs['date']} >= ?"
            params.append(filters['dateFrom'])
        if filters.get('dateTo'):
            date_filter += f" AND {self.schema.TRANSACTION.refs['date']} <= ?"
            params.append(filters['dateTo'])

        sql = f"""
        WITH CustomerActivity AS (
            SELECT
                {self.schema.TRANSACTION.refs['customer_id']} AS customer_id,
                COUNT(*) as purchase_count,
                MIN({self.schema.TRANSACTION.refs['date']}) as first_purchase,
                MAX({self.schema.TRANSACTION.refs['date']}) as last_purchase,
                SUM({self.schema.TRANSACTION.refs['gross_amount']}) as total_spent
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            WHERE {self.schema.TRANSACTION.refs['customer_id']} > 0{date_filter}
            GROUP BY {self.schema.TRANSACTION.refs['customer_id']}
        ),
        Lifecycle AS (
            SELECT
                customer_id,
                purchase_count,
                total_spent,
                CASE
                    WHEN julianday(?) - julianday(first_purchase) <= 90 THEN 'New'
                    WHEN julianday(?) - julianday(last_purchase) <= 90 AND purchase_count >= 3 THEN 'Active'
                    WHEN julianday(?) - julianday(last_purchase) BETWEEN 91 AND 180 THEN 'At Risk'
                    ELSE 'Dormant'
                END as lifecycle_stage
            FROM CustomerActivity
        )
        SELECT
            lifecycle_stage as stage,
            COUNT(*) as customer_count,
            AVG(purchase_count) as avg_frequency,
            SUM(total_spent) as total_revenue
        FROM Lifecycle
        GROUP BY lifecycle_stage
        ORDER BY
            CASE lifecycle_stage
                WHEN 'New' THEN 1
                WHEN 'Active' THEN 2
                WHEN 'At Risk' THEN 3
                WHEN 'Dormant' THEN 4
            END
        """

        # Add reference_date params for the CASE statement (3 times)
        params.extend([reference_date, reference_date, reference_date])

        # Execute query with manually built params
        result = await self.db.query(sql, params)
        return result.get('rows', [])

    async def get_kpi_metrics(self, filters: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Get KPI metrics for the dashboard

        Returns aggregate metrics including:
        - Total customers
        - Average purchase frequency
        - Frequency segment counts
        """
        sql = f"""
        WITH CustomerPurchases AS (
            SELECT
                {self.schema.TRANSACTION.refs['customer_id']} AS customer_id,
                COUNT(*) as purchase_count,
                SUM({self.schema.TRANSACTION.refs['gross_amount']}) as total_spent
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            WHERE {self.schema.TRANSACTION.refs['customer_id']} > 0
            GROUP BY {self.schema.TRANSACTION.refs['customer_id']}
        )
        SELECT
            COUNT(DISTINCT customer_id) as total_customers,
            AVG(purchase_count) as avg_frequency,
            SUM(CASE WHEN purchase_count >= 10 THEN 1 ELSE 0 END) as high_frequency_count,
            SUM(CASE WHEN purchase_count >= 5 AND purchase_count < 10 THEN 1 ELSE 0 END) as medium_frequency_count,
            SUM(CASE WHEN purchase_count < 5 THEN 1 ELSE 0 END) as low_frequency_count,
            SUM(total_spent) as total_revenue
        FROM CustomerPurchases
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result = await self.db.query(query, params)
        rows = result.get('rows', [])

        if rows and len(rows) > 0:
            return rows[0]
        return {
            'total_customers': 0,
            'avg_frequency': 0.0,
            'high_frequency_count': 0,
            'medium_frequency_count': 0,
            'low_frequency_count': 0,
            'total_revenue': 0.0
        }
