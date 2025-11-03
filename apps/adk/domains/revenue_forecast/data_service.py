"""Data service for Revenue Forecast domain - handles database queries"""

import logging
from typing import List, Dict, Any, Optional
from database.connection import DatabaseConnection
from .schema import RevenueForecastSchema

logger = logging.getLogger(__name__)


class RevenueForecastDataService:
    """Service for querying revenue forecast data from database"""

    def __init__(self):
        self.db = DatabaseConnection(use_pool=False)
        self.schema = RevenueForecastSchema()

    def _date_format(self, date_ref: str, format_type: str) -> str:
        """Generate database-specific date formatting SQL"""
        if self.db.db_type == 'postgres':
            format_map = {
                'year_month': f"TO_CHAR({date_ref}::date, 'YYYY-MM')",
                'year': f"TO_CHAR({date_ref}::date, 'YYYY')",
                'month': f"TO_CHAR({date_ref}::date, 'MM')"
            }
            return format_map.get(format_type, f"TO_CHAR({date_ref}::date, 'YYYY-MM')")
        else:  # sqlite
            format_map = {
                'year_month': f"strftime('%Y-%m', {date_ref})",
                'year': f"strftime('%Y', {date_ref})",
                'month': f"strftime('%m', {date_ref})"
            }
            return format_map.get(format_type, f"strftime('%Y-%m', {date_ref})")

    def _substring(self, string_ref: str, start: int, length: int = None) -> str:
        """Generate database-specific substring SQL"""
        if self.db.db_type == 'postgres':
            if length:
                return f"SUBSTRING({string_ref}, {start}, {length})"
            else:
                return f"SUBSTRING({string_ref}, {start})"
        else:  # sqlite
            if length:
                return f"substr({string_ref}, {start}, {length})"
            else:
                return f"substr({string_ref}, {start})"

    def _add_month(self, month_string_ref: str) -> str:
        """Generate SQL to add 1 month to a YYYY-MM format string"""
        if self.db.db_type == 'postgres':
            return f"TO_CHAR(({month_string_ref} || '-01')::date + INTERVAL '1 month', 'YYYY-MM')"
        else:  # sqlite
            return f"strftime('%Y-%m', date({month_string_ref} || '-01', '+1 month'))"

    async def get_kpi_data(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get KPI metrics for revenue forecast
        Returns: Rule of 40, NRR, LTV/CAC, Revenue Quality Score, Market Share Momentum
        """
        date_from = filters.get('dateFrom', '2017-01-01')
        date_to = filters.get('dateTo', '2021-12-31')
        company_code = filters.get('companyCode', 'all')

        query = f"""
        WITH revenue_metrics AS (
            SELECT
                -- Revenue components
                COALESCE(SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) = '41'
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as product_revenue,
                COALESCE(SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) = '42'
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as service_revenue,

                -- Cost components for profitability metrics
                COALESCE(SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('51', '52')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as cogs,
                COALESCE(SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('61', '62', '63', '64', '65', '66')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as opex,

                -- Customer metrics (simulated based on transaction patterns)
                COUNT(DISTINCT {self.schema.GL_TRANSACTION.refs['txn_date']}) as transaction_days,
                COUNT(DISTINCT {self.schema.GL_TRANSACTION.refs['document_number']}) as unique_transactions,
                COUNT(DISTINCT CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('41', '42')
                    THEN {self.schema.GL_TRANSACTION.refs['document_number']} END) as revenue_transactions
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            {"AND " + self.schema.GL_TRANSACTION.refs['company_code'] + " = ?" if company_code and company_code != 'all' else ""}
        ),
        prior_period_metrics AS (
            SELECT
                COALESCE(SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as prior_revenue
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN date(?, '-1 year') AND date(?, '-1 year')
            {"AND " + self.schema.GL_TRANSACTION.refs['company_code'] + " = ?" if company_code and company_code != 'all' else ""}
        )
        SELECT
            rm.*,
            ppm.prior_revenue,
            -- Calculate derived metrics
            ROUND((rm.total_revenue - rm.cogs), 2) as gross_profit,
            ROUND((rm.total_revenue - rm.cogs - rm.opex), 2) as ebitda,

            -- Growth metrics
            ROUND(
                CASE
                    WHEN ppm.prior_revenue > 0 THEN
                        ((rm.total_revenue - ppm.prior_revenue) / ppm.prior_revenue) * 100
                    ELSE 0
                END, 2
            ) as revenue_growth_rate,

            -- Profitability margins
            ROUND(
                CASE
                    WHEN rm.total_revenue > 0 THEN
                        ((rm.total_revenue - rm.cogs) / rm.total_revenue) * 100
                    ELSE 0
                END, 2
            ) as gross_margin,

            ROUND(
                CASE
                    WHEN rm.total_revenue > 0 THEN
                        ((rm.total_revenue - rm.cogs - rm.opex) / rm.total_revenue) * 100
                    ELSE 0
                END, 2
            ) as ebitda_margin,

            -- Rule of 40 (Growth Rate + EBITDA Margin)
            ROUND(
                CASE
                    WHEN ppm.prior_revenue > 0 AND rm.total_revenue > 0 THEN
                        (((rm.total_revenue - ppm.prior_revenue) / ppm.prior_revenue) * 100) +
                        (((rm.total_revenue - rm.cogs - rm.opex) / rm.total_revenue) * 100)
                    ELSE 0
                END, 2
            ) as rule_of_40,

            -- Simulated NRR (Net Revenue Retention) - based on recurring patterns
            ROUND(
                CASE
                    WHEN rm.service_revenue > 0 THEN
                        100 + ((rm.service_revenue / rm.total_revenue) * 20) -- Assume services have 20% expansion
                    ELSE 100
                END, 2
            ) as net_revenue_retention,

            -- Simulated LTV/CAC (using revenue per transaction as proxy)
            ROUND(
                CASE
                    WHEN rm.revenue_transactions > 0 THEN
                        (rm.total_revenue / rm.revenue_transactions) / 5000 -- Assume $5000 CAC
                    ELSE 0
                END, 2
            ) as ltv_cac_ratio,

            -- Revenue Quality Score (0-100 based on diversification and growth)
            ROUND(
                MIN(100,
                    (CASE WHEN rm.service_revenue > 0 AND rm.product_revenue > 0 THEN 30 ELSE 0 END) + -- Diversification
                    (CASE WHEN rm.revenue_transactions > 10 THEN 30 ELSE rm.revenue_transactions * 3 END) + -- Transaction volume
                    (CASE WHEN ppm.prior_revenue > 0 AND rm.total_revenue > ppm.prior_revenue THEN 40 ELSE 20 END) -- Growth
                ), 0
            ) as revenue_quality_score,

            -- Market Share Momentum (simulated)
            ROUND(
                CASE
                    WHEN ppm.prior_revenue > 0 THEN
                        ((rm.total_revenue - ppm.prior_revenue) / ppm.prior_revenue) * 10 -- Simplified momentum
                    ELSE 0
                END, 2
            ) as market_share_momentum

        FROM revenue_metrics rm
        CROSS JOIN prior_period_metrics ppm
        """

        params = [date_from, date_to, date_from, date_to]
        if company_code and company_code != 'all':
            params.extend([company_code, company_code])

        try:
            result_dict = await self.db.query(query, params)
            rows = result_dict.get('rows', [])
            return rows[0] if rows else {}
        except Exception as e:
            logger.error(f"Error fetching KPI data: {e}")
            raise

    async def get_revenue_growth_decomposition(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get revenue growth decomposition into organic and inorganic components"""
        date_from = filters.get('dateFrom', '2017-01-01')
        date_to = filters.get('dateTo', '2021-12-31')
        company_code = filters.get('companyCode', 'all')

        month_expr = self._date_format(self.schema.GL_TRANSACTION.refs['txn_date'], 'year_month')
        account_prefix = self._substring(self.schema.GL_TRANSACTION.refs['gl_account'], 1, 2)

        query = f"""
        WITH monthly_revenue AS (
            SELECT
                {month_expr} as month,
                SUM(CASE WHEN {account_prefix} IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END) as revenue,
                SUM(CASE WHEN {account_prefix} = '41'
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END) as product_revenue,
                SUM(CASE WHEN {account_prefix} = '42'
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END) as service_revenue
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            {"AND " + self.schema.GL_TRANSACTION.refs['company_code'] + " = ?" if company_code and company_code != 'all' else ""}
            GROUP BY month
            ORDER BY month
        )
        SELECT
            month,
            revenue as total_revenue,
            product_revenue,
            service_revenue,
            revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month) as revenue_change,
            ROUND(((revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month)) /
                   NULLIF(LAG(revenue, 1, revenue) OVER (ORDER BY month), 0)) * 100, 2) as growth_rate
        FROM monthly_revenue
        ORDER BY month
        """

        params = [date_from, date_to]
        if company_code and company_code != 'all':
            params.append(company_code)

        try:
            result_dict = await self.db.query(query, params)
            return result_dict.get('rows', [])
        except Exception as e:
            logger.error(f"Error fetching growth decomposition: {e}")
            raise

    async def get_cohort_retention_data(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get cohort-based revenue retention metrics"""
        date_from = filters.get('dateFrom', '2017-01-01')
        date_to = filters.get('dateTo', '2021-12-31')

        # Use document number prefix (first 6 chars) as customer proxy since Cost Center is empty
        month_expr = self._date_format(self.schema.GL_TRANSACTION.refs['txn_date'], 'year_month')
        doc_prefix = self._substring(self.schema.GL_TRANSACTION.refs['document_number'], 1, 6)
        account_prefix = self._substring(self.schema.GL_TRANSACTION.refs['gl_account'], 1, 2)

        query = f"""
        WITH customer_first_purchase AS (
            SELECT
                {doc_prefix} as customer_proxy,
                MIN({month_expr}) as cohort_month
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {account_prefix} IN ('41', '42')
                AND {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            GROUP BY customer_proxy
            HAVING COUNT(*) > 1  -- Only customers with multiple transactions
        ),
        cohort_revenue AS (
            SELECT
                cfp.cohort_month,
                {month_expr} as revenue_month,
                SUM(ABS({self.schema.GL_TRANSACTION.refs['txn_amount']})) as cohort_revenue,
                COUNT(DISTINCT {doc_prefix}) as customer_count
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            INNER JOIN customer_first_purchase cfp
                ON {doc_prefix} = cfp.customer_proxy
            WHERE {account_prefix} IN ('41', '42')
                AND {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            GROUP BY cfp.cohort_month, revenue_month
        ),
        cohort_with_months AS (
            SELECT
                cohort_month,
                revenue_month,
                cohort_revenue,
                customer_count,
                CAST(ROUND(EXTRACT(EPOCH FROM ((revenue_month || '-01')::date - (cohort_month || '-01')::date)) / (30.0 * 86400), 0) AS INTEGER) as months_since_cohort
            FROM cohort_revenue
        )
        SELECT
            cohort_month,
            revenue_month,
            ROUND(cohort_revenue, 2) as cohort_revenue,
            customer_count,
            months_since_cohort
        FROM cohort_with_months
        WHERE months_since_cohort >= 0 AND months_since_cohort <= 12
        ORDER BY cohort_month, months_since_cohort
        LIMIT 200
        """

        params = [date_from, date_to, date_from, date_to]

        try:
            result_dict = await self.db.query(query, params)
            return result_dict.get('rows', [])
        except Exception as e:
            logger.error(f"Error fetching cohort retention data: {e}")
            raise

    async def get_segment_forecast_data(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get revenue forecast by segment/region"""
        date_from = filters.get('dateFrom', '2017-01-01')
        date_to = filters.get('dateTo', '2021-12-31')

        # Use Company Code as segment since Division Code is empty
        month_expr = self._date_format(self.schema.GL_TRANSACTION.refs['txn_date'], 'year_month')
        account_prefix = self._substring(self.schema.GL_TRANSACTION.refs['gl_account'], 1, 2)
        next_month_expr = self._add_month('sr2.month')

        query = f"""
        WITH segment_revenue AS (
            SELECT
                COALESCE({self.schema.GL_TRANSACTION.refs['company_code']}, 'Unknown') as segment,
                {month_expr} as month,
                SUM(CASE WHEN {account_prefix} IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END) as revenue,
                COUNT(DISTINCT {self.schema.GL_TRANSACTION.refs['document_number']}) as transaction_count
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            GROUP BY segment, month
        ),
        segment_aggregates AS (
            SELECT
                segment,
                AVG(revenue) as avg_monthly_revenue,
                SUM(revenue) as total_revenue,
                COUNT(*) as month_count,
                MAX(revenue) as max_revenue,
                MIN(revenue) as min_revenue,
                SUM(transaction_count) as total_transactions
            FROM segment_revenue
            GROUP BY segment
        ),
        segment_growth AS (
            SELECT
                sr1.segment,
                AVG(
                    CASE
                        WHEN sr2.revenue > 0 THEN
                            ((sr1.revenue - sr2.revenue) / sr2.revenue) * 100
                        ELSE 0
                    END
                ) as avg_growth_rate
            FROM segment_revenue sr1
            LEFT JOIN segment_revenue sr2
                ON sr1.segment = sr2.segment
                AND sr1.month = {next_month_expr}
            WHERE sr2.revenue IS NOT NULL
            GROUP BY sr1.segment
        )
        SELECT
            sa.segment,
            ROUND(sa.avg_monthly_revenue, 2) as avg_monthly_revenue,
            ROUND(sa.total_revenue, 2) as total_revenue,
            sa.month_count,
            ROUND(sa.max_revenue, 2) as max_revenue,
            ROUND(sa.min_revenue, 2) as min_revenue,
            sa.total_transactions,
            ROUND(COALESCE(sg.avg_growth_rate, 0), 2) as avg_growth_rate,
            ROUND(((sa.max_revenue - sa.min_revenue) / NULLIF(sa.min_revenue, 0)) * 100, 2) as volatility_pct
        FROM segment_aggregates sa
        LEFT JOIN segment_growth sg ON sa.segment = sg.segment
        WHERE sa.segment != 'Unknown'
        ORDER BY sa.total_revenue DESC
        LIMIT 10
        """

        params = [date_from, date_to]

        try:
            result_dict = await self.db.query(query, params)
            return result_dict.get('rows', [])
        except Exception as e:
            logger.error(f"Error fetching segment forecast data: {e}")
            raise

    async def get_customer_economics_data(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get customer acquisition and lifetime value metrics"""
        date_from = filters.get('dateFrom', '2017-01-01')
        date_to = filters.get('dateTo', '2021-12-31')

        query = f"""
        WITH customer_metrics AS (
            SELECT
                -- Revenue metrics
                SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END) as total_revenue,

                -- Marketing/Sales costs (OpEx accounts 61-63)
                SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('61', '62', '63')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END) as sales_marketing_cost,

                -- COGS
                SUM(CASE WHEN substr({self.schema.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('51', '52')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END) as cogs,

                -- Unique customers (proxy using cost centers)
                COUNT(DISTINCT {self.schema.GL_TRANSACTION.refs['cost_center']}) as customer_count
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
        )
        SELECT
            ROUND(sales_marketing_cost / NULLIF(customer_count, 0), 2) as cac,
            ROUND(total_revenue / NULLIF(customer_count, 0), 2) as ltv,
            ROUND((total_revenue / NULLIF(customer_count, 0)) /
                  NULLIF(sales_marketing_cost / NULLIF(customer_count, 0), 0), 2) as ltv_cac_ratio,
            ROUND(((total_revenue - cogs) / NULLIF(total_revenue, 0)) * 100, 2) as gross_margin,
            customer_count
        FROM customer_metrics
        """

        params = [date_from, date_to]

        try:
            result_dict = await self.db.query(query, params)
            rows = result_dict.get('rows', [])
            return rows[0] if rows else {}
        except Exception as e:
            logger.error(f"Error fetching customer economics: {e}")
            raise
