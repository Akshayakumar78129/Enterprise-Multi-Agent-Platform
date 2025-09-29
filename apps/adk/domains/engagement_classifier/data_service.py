"""
Engagement Classifier data service
Implements all SQL queries using proper schema-based architecture
"""

from typing import Dict, List, Any, Optional
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import EngagementClassifierSchema
import logging

logger = logging.getLogger(__name__)


class EngagementClassifierDataService:
    """Data service for Engagement Classifier with all required queries"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = EngagementClassifierSchema()
        self.filter_engine = FilterEngine()

    async def get_engagement_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get customer engagement data with RFM scores and engagement levels"""

        # Build the main query using schema references
        sql = f"""
        WITH CustomerEngagementData AS (
            SELECT
                {self.schema.CUSTOMER.refs['id']} AS customer_key,
                {self.schema.LOYALTY.refs['customer_number']} AS customer_number,
                {self.schema.CUSTOMER.refs['name']} AS customer_name,
                {self.schema.LOYALTY.refs['loyalty_status']} AS loyalty_status,
                {self.schema.LOYALTY.refs['rfm_score']} AS rfm_score,
                cl."Recency Band" AS recency_band,
                cl."Frequency Band" AS frequency_band,
                cl."Monetary Band" AS monetary_band,
                {self.schema.LOYALTY.refs['days_since_last_activity']} AS days_since_activity,
                cl."Number Sales Txns" AS number_sales_txns,
                cl."Avg Sales Amount" AS avg_sales_amount,
                {self.schema.LOYALTY.refs['lifetime_sales']} AS ltd_sales_amount,
                {self.schema.LOYALTY.refs['last_activity_date']} AS last_activity_date,
                cl."First Activity Date" AS first_activity_date,
                CASE
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                    ELSE 'Low'
                END as engagement_level,
                CASE
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 1
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 2
                    ELSE 3
                END as engagement_sort
            FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
                ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
            WHERE {self.schema.LOYALTY.refs['days_since_last_activity']} IS NOT NULL
        """

        # Add custom filters
        if filters.get('startDate') and filters.get('endDate'):
            sql += f" AND {self.schema.LOYALTY.refs['last_activity_date']} BETWEEN '{filters['startDate']}' AND '{filters['endDate']}'"

        if filters.get('engagementLevels') and len(filters['engagementLevels']) > 0:
            levels = [f"'{level}'" for level in filters['engagementLevels']]
            sql += f""" AND (CASE
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                ELSE 'Low'
            END) IN ({','.join(levels)})"""

        if filters.get('loyaltyStatus') and len(filters['loyaltyStatus']) > 0:
            statuses = [f"'{status}'" for status in filters['loyaltyStatus']]
            sql += f" AND {self.schema.LOYALTY.refs['loyalty_status']} IN ({','.join(statuses)})"

        if filters.get('customerSearch'):
            search_term = filters['customerSearch'].replace("'", "''")
            sql += f" AND ({self.schema.CUSTOMER.refs['name']} LIKE '%{search_term}%' OR {self.schema.LOYALTY.refs['customer_number']} LIKE '%{search_term}%')"

        if filters.get('minTransactions'):
            sql += f" AND cl.\"Number Sales Txns\" >= {filters['minTransactions']}"

        if filters.get('minLTVAmount'):
            sql += f" AND {self.schema.LOYALTY.refs['lifetime_sales']} >= {filters['minLTVAmount']}"

        if filters.get('rfmScoreMin') is not None and filters.get('rfmScoreMax') is not None:
            sql += f" AND {self.schema.LOYALTY.refs['rfm_score']} BETWEEN {filters['rfmScoreMin']} AND {filters['rfmScoreMax']}"

        sql += """
        )
        SELECT * FROM CustomerEngagementData
        ORDER BY engagement_sort, days_since_activity
        """

        result = await self.db.query(sql)

        # Transform column names to match expected format
        rows = result.get("rows", [])
        transformed_rows = []
        for row in rows:
            transformed_row = {
                "Customer Key": row.get("customer_key"),
                "Customer Number": row.get("customer_number"),
                "Customer Name": row.get("customer_name"),
                "Loyalty Status": row.get("loyalty_status"),
                "RFM Score": row.get("rfm_score"),
                "Recency Band": row.get("recency_band"),
                "Frequency Band": row.get("frequency_band"),
                "Monetary Band": row.get("monetary_band"),
                "Days Since Last Activity": row.get("days_since_activity"),
                "Number Sales Txns": row.get("number_sales_txns"),
                "Avg Sales Amount": row.get("avg_sales_amount"),
                "LTD Sales Amount": row.get("ltd_sales_amount"),
                "Last Activity Date": row.get("last_activity_date"),
                "First Activity Date": row.get("first_activity_date"),
                "engagement_level": row.get("engagement_level"),
                "engagement_sort": row.get("engagement_sort")
            }
            transformed_rows.append(transformed_row)

        return {"data": transformed_rows, "success": True}

    async def get_kpi_metrics(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get KPI metrics for engagement dashboard"""

        sql = f"""
        WITH EngagementKPIs AS (
            SELECT
                COUNT(DISTINCT {self.schema.CUSTOMER.refs['id']}) as total_customers,
                AVG({self.schema.LOYALTY.refs['rfm_score']}) as avg_engagement_score,
                AVG({self.schema.LOYALTY.refs['days_since_last_activity']}) as avg_days_since_activity,
                COUNT(CASE WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 1 END) as high_engagement_count,
                COUNT(CASE WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} > 30 AND {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 1 END) as medium_engagement_count,
                COUNT(CASE WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} > 90 THEN 1 END) as low_engagement_count,
                AVG(cl."Avg Sales Amount") as avg_purchase_value,
                AVG(cl."Number Sales Txns") as avg_transaction_frequency,
                COUNT(CASE WHEN {self.schema.LOYALTY.refs['loyalty_status']} IN ('Active', 'Active, Loyal') AND {self.schema.LOYALTY.refs['days_since_last_activity']} > 90 THEN 1 END) as reengagement_opportunities
            FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
                ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
            WHERE {self.schema.LOYALTY.refs['days_since_last_activity']} IS NOT NULL
        """

        # Add filters
        if filters.get('startDate') and filters.get('endDate'):
            sql += f" AND {self.schema.LOYALTY.refs['last_activity_date']} BETWEEN '{filters['startDate']}' AND '{filters['endDate']}'"

        if filters.get('engagementLevels') and len(filters['engagementLevels']) > 0:
            levels = [f"'{level}'" for level in filters['engagementLevels']]
            sql += f""" AND (CASE
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                ELSE 'Low'
            END) IN ({','.join(levels)})"""

        if filters.get('loyaltyStatus') and len(filters['loyaltyStatus']) > 0:
            statuses = [f"'{status}'" for status in filters['loyaltyStatus']]
            sql += f" AND {self.schema.LOYALTY.refs['loyalty_status']} IN ({','.join(statuses)})"

        sql += """
        )
        SELECT * FROM EngagementKPIs
        """

        result = await self.db.query(sql)
        row = result.get("rows", [{}])[0] if result.get("rows") else {}

        # Calculate engagement trend
        engagement_trend = 'Improving' if row.get('avg_engagement_score', 0) > 7 else \
                          'Stable' if row.get('avg_engagement_score', 0) > 5 else 'Declining'

        return {
            "total_customers": row.get('total_customers', 0),
            "avg_engagement_score": round(row.get('avg_engagement_score', 0)),
            "avg_days_since_activity": round(row.get('avg_days_since_activity', 0)),
            "engagement_trend": engagement_trend,
            "reengagement_opportunities": row.get('reengagement_opportunities', 0),
            "engagement_distribution": {
                "high": row.get('high_engagement_count', 0),
                "medium": row.get('medium_engagement_count', 0),
                "low": row.get('low_engagement_count', 0)
            },
            "avg_purchase_value": row.get('avg_purchase_value', 0),
            "avg_transaction_frequency": row.get('avg_transaction_frequency', 0)
        }

    async def get_engagement_distribution(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get engagement distribution for pyramid visualization"""

        sql = f"""
        WITH EngagementDistribution AS (
            SELECT
                CASE
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                    ELSE 'Low'
                END as engagement_level,
                COUNT(*) as customer_count,
                AVG(cl."Number Sales Txns") as avg_transactions,
                AVG(cl."Avg Sales Amount") as avg_purchase_value,
                AVG({self.schema.LOYALTY.refs['days_since_last_activity']}) as avg_days_since_activity,
                AVG({self.schema.LOYALTY.refs['rfm_score']}) as avg_rfm_score,
                COUNT(CASE WHEN {self.schema.LOYALTY.refs['loyalty_status']} = 'Active, Loyal' THEN 1 END) as loyal_customers,
                SUM(COALESCE({self.schema.LOYALTY.refs['lifetime_sales']}, 0)) as total_ltd_sales
            FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
                ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
            WHERE {self.schema.LOYALTY.refs['days_since_last_activity']} IS NOT NULL
        """

        # Add filters
        if filters.get('startDate') and filters.get('endDate'):
            sql += f" AND {self.schema.LOYALTY.refs['last_activity_date']} BETWEEN '{filters['startDate']}' AND '{filters['endDate']}'"

        if filters.get('engagementLevels') and len(filters['engagementLevels']) > 0:
            levels = [f"'{level}'" for level in filters['engagementLevels']]
            sql += f""" AND (CASE
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                ELSE 'Low'
            END) IN ({','.join(levels)})"""

        sql += """
            GROUP BY engagement_level
        )
        SELECT
            engagement_level,
            customer_count,
            avg_transactions,
            avg_purchase_value,
            avg_days_since_activity,
            avg_rfm_score,
            loyal_customers,
            total_ltd_sales,
            ROUND((customer_count * 100.0 / NULLIF((SELECT SUM(customer_count) FROM EngagementDistribution), 0)), 2) as percentage
        FROM EngagementDistribution
        ORDER BY
            CASE engagement_level
                WHEN 'High' THEN 1
                WHEN 'Medium' THEN 2
                WHEN 'Low' THEN 3
            END
        """

        result = await self.db.query(sql)
        return {"data": result.get("rows", []), "success": True}

    async def get_rfm_analysis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get RFM (Recency, Frequency, Monetary) analysis"""

        sql = f"""
        WITH RFMAnalysis AS (
            SELECT
                CASE
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                    ELSE 'Low'
                END as engagement_level,
                cl."Recency Band",
                cl."Frequency Band",
                cl."Monetary Band",
                COUNT(*) as customer_count,
                AVG({self.schema.LOYALTY.refs['rfm_score']}) as avg_rfm_score
            FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
                ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
            WHERE {self.schema.LOYALTY.refs['days_since_last_activity']} IS NOT NULL
                AND cl."Recency Band" IS NOT NULL
                AND cl."Frequency Band" IS NOT NULL
                AND cl."Monetary Band" IS NOT NULL
        """

        if filters.get('startDate') and filters.get('endDate'):
            sql += f" AND {self.schema.LOYALTY.refs['last_activity_date']} BETWEEN '{filters['startDate']}' AND '{filters['endDate']}'"

        sql += """
            GROUP BY engagement_level, cl."Recency Band", cl."Frequency Band", cl."Monetary Band"
        )
        SELECT * FROM RFMAnalysis
        ORDER BY engagement_level, avg_rfm_score DESC
        """

        result = await self.db.query(sql)
        return {"data": result.get("rows", []), "success": True}

    async def get_reengagement_opportunities(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get reengagement opportunities for at-risk customers"""

        sql = f"""
        WITH ReengagementOpportunities AS (
            SELECT
                {self.schema.CUSTOMER.refs['id']} AS customer_key,
                {self.schema.CUSTOMER.refs['name']} AS customer_name,
                {self.schema.LOYALTY.refs['loyalty_status']} AS loyalty_status,
                {self.schema.LOYALTY.refs['days_since_last_activity']} AS days_since_activity,
                {self.schema.LOYALTY.refs['lifetime_sales']} AS ltd_sales,
                cl."Avg Sales Amount" AS avg_sales,
                cl."Number Sales Txns" AS num_txns,
                {self.schema.LOYALTY.refs['rfm_score']} AS rfm_score,
                CASE
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                    ELSE 'Low'
                END as engagement_level,
                CASE
                    WHEN {self.schema.LOYALTY.refs['lifetime_sales']} > 10000 AND {self.schema.LOYALTY.refs['days_since_last_activity']} BETWEEN 31 AND 180 THEN 'High Value Winback'
                    WHEN {self.schema.LOYALTY.refs['lifetime_sales']} > 5000 AND {self.schema.LOYALTY.refs['days_since_last_activity']} BETWEEN 31 AND 120 THEN 'Medium Value Nurture'
                    WHEN cl."Number Sales Txns" > 5 AND {self.schema.LOYALTY.refs['days_since_last_activity']} BETWEEN 31 AND 90 THEN 'Frequent Buyer Reactivation'
                    WHEN {self.schema.LOYALTY.refs['loyalty_status']} = 'Active, Loyal' AND {self.schema.LOYALTY.refs['days_since_last_activity']} > 60 THEN 'Loyal Customer Recovery'
                    ELSE 'Standard Reengagement'
                END as opportunity_type,
                CASE
                    WHEN {self.schema.LOYALTY.refs['lifetime_sales']} > 10000 THEN 'High'
                    WHEN {self.schema.LOYALTY.refs['lifetime_sales']} > 2000 THEN 'Medium'
                    ELSE 'Low'
                END as value_tier,
                CASE
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} BETWEEN 31 AND 60 THEN 'High'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} BETWEEN 61 AND 120 THEN 'Medium'
                    ELSE 'Low'
                END as reengagement_potential
            FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
                ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
            WHERE {self.schema.LOYALTY.refs['days_since_last_activity']} IS NOT NULL
                AND {self.schema.LOYALTY.refs['lifetime_sales']} > 0
        )
        SELECT
            engagement_level,
            COUNT(*) as customer_count,
            AVG(ltd_sales) as avg_customer_value,
            AVG(num_txns) as avg_transactions,
            AVG(days_since_activity) as avg_days_inactive,
            SUM(ltd_sales) as total_potential_value
        FROM ReengagementOpportunities
        GROUP BY engagement_level
        ORDER BY
            CASE engagement_level
                WHEN 'High' THEN 1
                WHEN 'Medium' THEN 2
                WHEN 'Low' THEN 3
            END
        """

        result = await self.db.query(sql)
        return {"data": result.get("rows", []), "success": True}

    async def get_engagement_timeline(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get engagement trends over time periods"""

        sql = f"""
        WITH EngagementTimeline AS (
            SELECT
                CASE
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 7 THEN 'This Week'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'This Month'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Last 3 Months'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 180 THEN 'Last 6 Months'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 365 THEN 'Last Year'
                    ELSE 'Over 1 Year'
                END as time_period,
                CASE
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                    WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                    ELSE 'Low'
                END as engagement_level,
                COUNT(*) as customer_count
            FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
                ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
            WHERE {self.schema.LOYALTY.refs['days_since_last_activity']} IS NOT NULL
            GROUP BY time_period, engagement_level
        )
        SELECT
            time_period,
            engagement_level,
            customer_count,
            CASE time_period
                WHEN 'This Week' THEN 1
                WHEN 'This Month' THEN 2
                WHEN 'Last 3 Months' THEN 3
                WHEN 'Last 6 Months' THEN 4
                WHEN 'Last Year' THEN 5
                ELSE 6
            END as sort_order
        FROM EngagementTimeline
        ORDER BY sort_order, engagement_level
        """

        result = await self.db.query(sql)
        return {"data": result.get("rows", []), "success": True}

    async def search_customers(self, search_term: str) -> Dict:
        """Search customers by name or number"""

        clean_term = search_term.strip().lower()

        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['id']} AS "Customer Key",
            {self.schema.LOYALTY.refs['customer_number']} AS "Customer Number",
            {self.schema.CUSTOMER.refs['name']} AS "Customer Name",
            c."Salesperson Name",
            {self.schema.LOYALTY.refs['loyalty_status']} AS "Loyalty Status",
            {self.schema.LOYALTY.refs['lifetime_sales']} AS "LTD Sales Amount",
            {self.schema.LOYALTY.refs['days_since_last_activity']} AS "Days Since Last Activity",
            {self.schema.LOYALTY.refs['rfm_score']} AS "RFM Score",
            cl."Number Sales Txns",
            cl."Avg Sales Amount",
            CASE
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                ELSE 'Low'
            END as engagement_level,
            CASE
                WHEN LOWER({self.schema.CUSTOMER.refs['name']}) LIKE '{clean_term}%' THEN 100
                WHEN LOWER({self.schema.CUSTOMER.refs['name']}) LIKE '%{clean_term}%' THEN 90
                WHEN LOWER(c."Salesperson Name") LIKE '{clean_term}%' THEN 80
                WHEN LOWER(c."Salesperson Name") LIKE '%{clean_term}%' THEN 70
                WHEN {self.schema.LOYALTY.refs['customer_number']} LIKE '%{search_term}%' THEN 60
                ELSE 50
            END as relevance_score
        FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
        LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
        WHERE (
            LOWER({self.schema.CUSTOMER.refs['name']}) LIKE '%{clean_term}%' OR
            LOWER(c."Salesperson Name") LIKE '%{clean_term}%' OR
            {self.schema.LOYALTY.refs['customer_number']} LIKE '%{search_term}%'
        )
        AND {self.schema.CUSTOMER.refs['name']} IS NOT NULL
        AND {self.schema.CUSTOMER.refs['name']} != ''
        ORDER BY relevance_score DESC, {self.schema.LOYALTY.refs['lifetime_sales']} DESC
        LIMIT 15
        """

        result = await self.db.query(sql)
        return {"data": result.get("rows", []), "success": True}

    async def get_customer_analytics(self, customer_key: str) -> Dict:
        """Get detailed analytics for a specific customer"""

        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['name']} AS "Customer Name",
            {self.schema.LOYALTY.refs['customer_number']} AS "Customer Number",
            {self.schema.LOYALTY.refs['loyalty_status']} AS "Loyalty Status",
            {self.schema.LOYALTY.refs['lifetime_sales']} as total_purchases,
            cl."Number Sales Txns" as total_transactions,
            cl."Avg Sales Amount" as avg_purchase_amount,
            {self.schema.LOYALTY.refs['days_since_last_activity']} AS "Days Since Last Activity",
            {self.schema.LOYALTY.refs['rfm_score']} AS "RFM Score",
            CASE
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 30 THEN 'High'
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 90 THEN 'Medium'
                ELSE 'Low'
            END as engagement_level,
            CASE
                WHEN {self.schema.LOYALTY.refs['days_since_last_activity']} <= 60 THEN
                    ROUND(cl."Number Sales Txns" * 0.3)
                ELSE 0
            END as purchases_last_60_days
        FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
        LEFT JOIN {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
        WHERE {self.schema.CUSTOMER.refs['id']} = '{customer_key}'
        """

        result = await self.db.query(sql)
        customer_data = result.get("rows", [{}])[0] if result.get("rows") else {}

        # Generate timeline and frequency data (simplified version)
        timeline_data = []
        frequency_data = []

        # Add mock timeline data for now (can be enhanced with actual transaction data)
        if customer_data:
            base_amount = customer_data.get('avg_purchase_amount', 1000)
            for i in range(12):
                timeline_data.append({
                    "period": f"Month {i+1}",
                    "purchase_amount": round(base_amount * (0.5 + 0.5 * (i/12)))
                })

            for i in range(4):
                frequency_data.append({
                    "period": f"Q{i+1} 2021",
                    "transaction_count": round(customer_data.get('total_transactions', 0) / 4)
                })

        return {
            "customer": customer_data,
            "timeline": timeline_data,
            "frequency_data": frequency_data,
            "success": True
        }

    # Keeping existing methods for backward compatibility
    async def get_customers(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get customer data - delegates to get_engagement_data for compatibility"""
        return await self.get_engagement_data(filters)

    async def get_transactions(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get transaction data with filters"""

        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['customer_id']} AS customer_id,
            {self.schema.TRANSACTION.refs['txn_id']} AS txn_id,
            {self.schema.TRANSACTION.refs['date']} AS date,
            {self.schema.TRANSACTION.refs['net_amount']} AS net_amount,
            {self.schema.TRANSACTION.refs['gross_amount']} AS gross_amount,
            {self.schema.TRANSACTION.refs['return_amount']} AS return_amount,
            {self.schema.TRANSACTION.refs['quantity']} AS quantity
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
            {self.schema.LOYALTY.refs['customer_id']} AS customer_id,
            {self.schema.LOYALTY.refs['customer_number']} AS customer_number,
            {self.schema.LOYALTY.refs['loyalty_status']} AS loyalty_status,
            {self.schema.LOYALTY.refs['rfm_score']} AS rfm_score,
            {self.schema.LOYALTY.refs['days_since_last_activity']} AS days_since_last_activity,
            {self.schema.LOYALTY.refs['lifetime_sales']} AS lifetime_sales,
            {self.schema.LOYALTY.refs['last_activity_date']} AS last_activity_date
        FROM {self.schema.TABLES['loyalty']} {self.schema.ALIASES['loyalty']}
        INNER JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.CUSTOMER.refs['id']} = {self.schema.LOYALTY.refs['customer_id']}
        WHERE {self.schema.LOYALTY.refs['customer_id']} > 0
        """

        # Apply filters using filter engine
        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        return await self.db.query(query, params)

    async def get_aggregated_metrics(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get aggregated metrics - delegates to get_kpi_metrics for compatibility"""
        kpi_data = await self.get_kpi_metrics(filters)
        # Transform to match expected format
        return {
            "data": [{
                "total_customers": kpi_data.get("total_customers", 0),
                "avg_engagement_score": kpi_data.get("avg_engagement_score", 0),
                "avg_days_since_activity": kpi_data.get("avg_days_since_activity", 0),
                "high_engagement": kpi_data.get("engagement_distribution", {}).get("high", 0),
                "medium_engagement": kpi_data.get("engagement_distribution", {}).get("medium", 0),
                "low_engagement": kpi_data.get("engagement_distribution", {}).get("low", 0)
            }],
            "success": True
        }