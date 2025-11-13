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
        """Generate database-specific substring SQL

        For PostgreSQL, casts the input to text to handle integer columns
        like GL Account Number which need SUBSTRING operations.
        """
        if self.db.db_type == 'postgres':
            # Cast to text to handle integer columns (e.g., GL Account Number)
            text_ref = f"CAST({string_ref} AS TEXT)"
            if length:
                return f"SUBSTRING({text_ref}, {start}, {length})"
            else:
                return f"SUBSTRING({text_ref}, {start})"
        else:  # sqlite
            # SQLite's substr() handles integers automatically
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

    def _months_between(self, month1: str, month2: str) -> str:
        """Calculate months between two YYYY-MM format strings"""
        if self.db.db_type == 'postgres':
            # PostgreSQL: use EXTRACT for date arithmetic
            return f"CAST(ROUND(EXTRACT(EPOCH FROM (({month1} || '-01')::date - ({month2} || '-01')::date)) / (30.0 * 86400), 0) AS INTEGER)"
        else:  # sqlite
            # SQLite: use julianday for date arithmetic
            return f"CAST(ROUND((julianday({month1} || '-01') - julianday({month2} || '-01')) / 30.0, 0) AS INTEGER)"

    def _subtract_years(self, date_ref: str, years: int = 1) -> str:
        """Generate SQL to subtract years from a date - database-specific"""
        if self.db.db_type == 'postgres':
            # Use CAST() instead of :: to avoid psycopg2 parameter parser confusion
            # When ? becomes %s, the sequence %s::date confuses psycopg2 (%s: looks like named param)
            return f"(CAST({date_ref} AS DATE) - INTERVAL '{years} year')"
        else:  # sqlite
            return f"date({date_ref}, '-{years} year')"

    def _convert_decimals_to_float(self, data: Any) -> Any:
        """Convert Decimal objects to float for JSON serialization

        PostgreSQL returns numeric values as Decimal objects which don't
        serialize well to JSON. This method recursively converts them to float.

        Args:
            data: Data to convert (dict, list, or primitive)

        Returns:
            Data with Decimals converted to float
        """
        from decimal import Decimal

        if isinstance(data, dict):
            return {key: self._convert_decimals_to_float(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._convert_decimals_to_float(item) for item in data]
        elif isinstance(data, Decimal):
            return float(data)
        elif isinstance(data, int) and not isinstance(data, bool):
            return float(data) if abs(data) > 1e10 else data  # Keep small ints as ints
        else:
            return data

    async def get_kpi_data(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get KPI metrics for revenue forecast
        Returns: Rule of 40, NRR, LTV/CAC, Revenue Quality Score, Market Share Momentum
        """
        from datetime import datetime, timedelta
        from dateutil.relativedelta import relativedelta

        date_from = filters.get('dateFrom', '2017-01-01')
        date_to = filters.get('dateTo', '2021-12-31')
        company_code = filters.get('companyCode', 'all')

        account_prefix = self._substring(self.schema.GL_TRANSACTION.refs['gl_account'], 1, 2)

        # Calculate prior year dates in Python instead of SQL to avoid psycopg2 issues
        date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
        date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
        prior_year_from_str = (date_from_obj - relativedelta(years=1)).strftime('%Y-%m-%d')
        prior_year_to_str = (date_to_obj - relativedelta(years=1)).strftime('%Y-%m-%d')

        query = f"""
        WITH revenue_metrics AS (
            SELECT
                -- Revenue components
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN {account_prefix} = '41'
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as product_revenue,
                COALESCE(SUM(CASE WHEN {account_prefix} = '42'
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as service_revenue,

                -- Cost components for profitability metrics
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('51', '52')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as cogs,
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('61', '62', '63', '64', '65', '66')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as opex,

                -- Customer metrics (simulated based on transaction patterns)
                COUNT(DISTINCT {self.schema.GL_TRANSACTION.refs['txn_date']}) as transaction_days,
                COUNT(DISTINCT {self.schema.GL_TRANSACTION.refs['document_number']}) as unique_transactions,
                COUNT(DISTINCT CASE WHEN {account_prefix} IN ('41', '42')
                    THEN {self.schema.GL_TRANSACTION.refs['document_number']} END) as revenue_transactions
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            {"AND " + self.schema.GL_TRANSACTION.refs['company_code'] + " = ?" if company_code and company_code != 'all' else ""}
        ),
        prior_period_metrics AS (
            SELECT
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as prior_revenue
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            {"AND " + self.schema.GL_TRANSACTION.refs['company_code'] + " = ?" if company_code and company_code != 'all' else ""}
        )
        SELECT
            rm.*,
            COALESCE(ppm.prior_revenue, 0) as prior_revenue,
            -- Calculate derived metrics
            ROUND((rm.total_revenue - rm.cogs), 2) as gross_profit,
            ROUND((rm.total_revenue - rm.cogs - rm.opex), 2) as ebitda,

            -- Growth metrics
            ROUND(
                CASE
                    WHEN COALESCE(ppm.prior_revenue, 0) > 0 THEN
                        ((rm.total_revenue - COALESCE(ppm.prior_revenue, 0)) / COALESCE(ppm.prior_revenue, 1)) * 100
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
                    WHEN COALESCE(ppm.prior_revenue, 0) > 0 AND rm.total_revenue > 0 THEN
                        (((rm.total_revenue - COALESCE(ppm.prior_revenue, 0)) / COALESCE(ppm.prior_revenue, 1)) * 100) +
                        (((rm.total_revenue - rm.cogs - rm.opex) / rm.total_revenue) * 100)
                    ELSE 0
                END, 2
            ) as rule_of_40,

            -- Simulated NRR (Net Revenue Retention) - based on recurring patterns
            ROUND(
                CASE
                    WHEN rm.service_revenue > 0 AND rm.total_revenue > 0 THEN
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
                    (CASE WHEN COALESCE(ppm.prior_revenue, 0) > 0 AND rm.total_revenue > COALESCE(ppm.prior_revenue, 0) THEN 40 ELSE 20 END) -- Growth
                ), 0
            ) as revenue_quality_score,

            -- Market Share Momentum (simulated)
            ROUND(
                CASE
                    WHEN COALESCE(ppm.prior_revenue, 0) > 0 THEN
                        ((rm.total_revenue - COALESCE(ppm.prior_revenue, 0)) / COALESCE(ppm.prior_revenue, 1)) * 10 -- Simplified momentum
                    ELSE 0
                END, 2
            ) as market_share_momentum

        FROM revenue_metrics rm
        LEFT JOIN prior_period_metrics ppm ON 1=1
        """

        # Use ? placeholders (will be converted to %s by connection.py)
        # This matches the pattern used by all other working dashboards
        params = [date_from, date_to, prior_year_from_str, prior_year_to_str]
        if company_code and company_code != 'all':
            params.extend([company_code, company_code])

        # Convert to tuple for psycopg2 compatibility
        params = tuple(params)

        try:
            logger.info(f"[Revenue Forecast] Executing get_kpi_data query")
            logger.debug(f"[Revenue Forecast] DB Type: {self.db.db_type}")
            logger.debug(f"[Revenue Forecast] Params: {params}")
            logger.debug(f"[Revenue Forecast] Params count: {len(params)}")
            logger.debug(f"[Revenue Forecast] Query placeholders: {query.count('?')}")

            result_dict = await self.db.query(query, params)
            rows = result_dict.get('rows', [])

            logger.info(f"[Revenue Forecast] get_kpi_data returned {len(rows)} rows")
            if len(rows) == 0:
                logger.warning(f"[Revenue Forecast] ⚠️  KPI query returned ZERO rows - table may not exist or have data")
            elif rows:
                logger.debug(f"[Revenue Forecast] Sample KPI data: {rows[0]}")
                # Check if all values are zero
                first_row = rows[0]
                if all(first_row.get(k, 0) == 0 for k in ['total_revenue', 'prior_revenue', 'rule_of_40']):
                    logger.warning(f"[Revenue Forecast] ⚠️  KPI data has ALL ZERO values")

            result = rows[0] if rows else {}
            return self._convert_decimals_to_float(result)
        except IndexError as e:
            logger.error(f"[Revenue Forecast] IndexError - Params/placeholder mismatch: {e}")
            logger.error(f"[Revenue Forecast] Params: {params} (count: {len(params)})")
            logger.error(f"[Revenue Forecast] Query: {query[:500]}")
            # Return empty result instead of crashing
            return {}
        except Exception as e:
            logger.error(f"[Revenue Forecast] Error fetching KPI data: {e}", exc_info=True)
            logger.error(f"[Revenue Forecast] Table might not exist: {self.schema.TABLES['gl_transaction']}")
            # Return empty result instead of crashing
            return {}

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
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as revenue,
                COALESCE(SUM(CASE WHEN {account_prefix} = '41'
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as product_revenue,
                COALESCE(SUM(CASE WHEN {account_prefix} = '42'
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as service_revenue
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
            COALESCE(revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month), 0) as revenue_change,
            ROUND(COALESCE(((revenue - LAG(revenue, 1, revenue) OVER (ORDER BY month)) /
                   NULLIF(LAG(revenue, 1, revenue) OVER (ORDER BY month), 0)) * 100, 0), 2) as growth_rate
        FROM monthly_revenue
        ORDER BY month
        """

        params = [date_from, date_to]
        if company_code and company_code != 'all':
            params.append(company_code)

        try:
            logger.info(f"[Revenue Forecast] Executing get_revenue_growth_decomposition query")
            logger.debug(f"[Revenue Forecast] DB Type: {self.db.db_type}")

            result_dict = await self.db.query(query, params)
            rows = result_dict.get('rows', [])

            logger.info(f"[Revenue Forecast] get_revenue_growth_decomposition returned {len(rows)} rows")
            if len(rows) == 0:
                logger.warning(f"[Revenue Forecast] ⚠️  Growth decomposition query returned ZERO rows - this will cause index out of range!")
            elif len(rows) < 2:
                logger.warning(f"[Revenue Forecast] ⚠️  Growth decomposition returned only {len(rows)} rows - need at least 2 for processing")
            else:
                logger.debug(f"[Revenue Forecast] Sample growth data (first row): {rows[0]}")

            return self._convert_decimals_to_float(rows)
        except Exception as e:
            logger.error(f"Error fetching growth decomposition: {e}", exc_info=True)
            raise

    async def get_cohort_retention_data(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get cohort-based revenue retention metrics

        Simplified approach: Calculate month differences using string comparison
        instead of complex date arithmetic to ensure PostgreSQL/SQLite compatibility
        """
        date_from = filters.get('dateFrom', '2017-01-01')
        date_to = filters.get('dateTo', '2021-12-31')

        # Use document number prefix (first 6 chars) as customer proxy since Cost Center is empty
        month_expr = self._date_format(self.schema.GL_TRANSACTION.refs['txn_date'], 'year_month')
        doc_prefix = self._substring(self.schema.GL_TRANSACTION.refs['document_number'], 1, 6)
        account_prefix = self._substring(self.schema.GL_TRANSACTION.refs['gl_account'], 1, 2)

        # Simplified query without complex date calculations
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
                COALESCE(SUM(ABS({self.schema.GL_TRANSACTION.refs['txn_amount']})), 0) as cohort_revenue,
                COUNT(DISTINCT {doc_prefix}) as customer_count
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            INNER JOIN customer_first_purchase cfp
                ON {doc_prefix} = cfp.customer_proxy
            WHERE {account_prefix} IN ('41', '42')
                AND {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            GROUP BY cfp.cohort_month, revenue_month
        )
        SELECT
            cohort_month,
            revenue_month,
            ROUND(cohort_revenue, 2) as cohort_revenue,
            customer_count
        FROM cohort_revenue
        WHERE cohort_revenue > 0
        ORDER BY cohort_month, revenue_month
        LIMIT 200
        """

        params = [date_from, date_to, date_from, date_to]

        try:
            logger.info(f"[Revenue Forecast] Executing get_cohort_retention_data query")
            logger.debug(f"[Revenue Forecast] DB Type: {self.db.db_type}")

            result_dict = await self.db.query(query, params)
            rows = result_dict.get('rows', [])

            logger.info(f"[Revenue Forecast] get_cohort_retention_data returned {len(rows)} raw rows")
            if len(rows) == 0:
                logger.warning(f"[Revenue Forecast] ⚠️  Cohort retention query returned ZERO rows")

            # Calculate months_since_cohort in Python instead of SQL to avoid DB-specific issues
            for row in rows:
                if row.get('cohort_month') and row.get('revenue_month'):
                    try:
                        # Parse YYYY-MM format strings
                        cohort_year, cohort_month = map(int, row['cohort_month'].split('-'))
                        revenue_year, revenue_month = map(int, row['revenue_month'].split('-'))

                        # Calculate months difference
                        months_diff = (revenue_year - cohort_year) * 12 + (revenue_month - cohort_month)
                        row['months_since_cohort'] = max(0, months_diff)
                    except (ValueError, AttributeError, KeyError) as e:
                        logger.warning(f"Error calculating months_since_cohort: {e}")
                        row['months_since_cohort'] = 0

            # Filter to only 0-12 months and return
            filtered_rows = [row for row in rows if 0 <= row.get('months_since_cohort', -1) <= 12]

            logger.info(f"[Revenue Forecast] After filtering: {len(filtered_rows)} cohort rows (0-12 months)")

            return self._convert_decimals_to_float(filtered_rows)

        except Exception as e:
            logger.error(f"Error fetching cohort retention data: {e}", exc_info=True)
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
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as revenue,
                COUNT(DISTINCT {self.schema.GL_TRANSACTION.refs['document_number']}) as transaction_count
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
            GROUP BY segment, month
        ),
        segment_aggregates AS (
            SELECT
                segment,
                COALESCE(AVG(revenue), 0) as avg_monthly_revenue,
                COALESCE(SUM(revenue), 0) as total_revenue,
                COUNT(*) as month_count,
                COALESCE(MAX(revenue), 0) as max_revenue,
                COALESCE(MIN(revenue), 0) as min_revenue,
                COALESCE(SUM(transaction_count), 0) as total_transactions
            FROM segment_revenue
            GROUP BY segment
        ),
        segment_growth AS (
            SELECT
                sr1.segment,
                COALESCE(AVG(
                    CASE
                        WHEN sr2.revenue > 0 THEN
                            ((sr1.revenue - sr2.revenue) / sr2.revenue) * 100
                        ELSE 0
                    END
                ), 0) as avg_growth_rate
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
            ROUND(COALESCE(((sa.max_revenue - sa.min_revenue) / NULLIF(sa.min_revenue, 0)) * 100, 0), 2) as volatility_pct
        FROM segment_aggregates sa
        LEFT JOIN segment_growth sg ON sa.segment = sg.segment
        WHERE sa.segment != 'Unknown'
        ORDER BY sa.total_revenue DESC
        LIMIT 10
        """

        params = [date_from, date_to]

        try:
            logger.info(f"[Revenue Forecast] Executing get_segment_forecast_data query")

            result_dict = await self.db.query(query, params)
            rows = result_dict.get('rows', [])

            logger.info(f"[Revenue Forecast] get_segment_forecast_data returned {len(rows)} rows")
            if len(rows) == 0:
                logger.warning(f"[Revenue Forecast] ⚠️  Segment forecast query returned ZERO rows")

            return self._convert_decimals_to_float(rows)
        except Exception as e:
            logger.error(f"Error fetching segment forecast data: {e}", exc_info=True)
            raise

    async def get_customer_economics_data(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get customer acquisition and lifetime value metrics"""
        date_from = filters.get('dateFrom', '2017-01-01')
        date_to = filters.get('dateTo', '2021-12-31')

        account_prefix = self._substring(self.schema.GL_TRANSACTION.refs['gl_account'], 1, 2)

        query = f"""
        WITH customer_metrics AS (
            SELECT
                -- Revenue metrics
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('41', '42')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as total_revenue,

                -- Marketing/Sales costs (OpEx accounts 61-63)
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('61', '62', '63')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as sales_marketing_cost,

                -- COGS
                COALESCE(SUM(CASE WHEN {account_prefix} IN ('51', '52')
                    THEN ABS({self.schema.GL_TRANSACTION.refs['txn_amount']}) ELSE 0 END), 0) as cogs,

                -- Unique customers (proxy using cost centers)
                COUNT(DISTINCT {self.schema.GL_TRANSACTION.refs['cost_center']}) as customer_count
            FROM {self.schema.TABLES['gl_transaction']} {self.schema.ALIASES['gl_transaction']}
            WHERE {self.schema.GL_TRANSACTION.refs['txn_date']} BETWEEN ? AND ?
        )
        SELECT
            ROUND(COALESCE(sales_marketing_cost / NULLIF(customer_count, 0), 0), 2) as cac,
            ROUND(COALESCE(total_revenue / NULLIF(customer_count, 0), 0), 2) as ltv,
            ROUND(COALESCE((total_revenue / NULLIF(customer_count, 0)) /
                  NULLIF(sales_marketing_cost / NULLIF(customer_count, 0), 0), 0), 2) as ltv_cac_ratio,
            ROUND(COALESCE(((total_revenue - cogs) / NULLIF(total_revenue, 0)) * 100, 0), 2) as gross_margin,
            customer_count
        FROM customer_metrics
        """

        params = [date_from, date_to]

        try:
            logger.info(f"[Revenue Forecast] Executing get_customer_economics_data query")

            result_dict = await self.db.query(query, params)
            rows = result_dict.get('rows', [])

            logger.info(f"[Revenue Forecast] get_customer_economics_data returned {len(rows)} rows")
            if len(rows) == 0:
                logger.warning(f"[Revenue Forecast] ⚠️  Customer economics query returned ZERO rows")
            elif rows:
                logger.debug(f"[Revenue Forecast] Customer economics data: {rows[0]}")

            result = rows[0] if rows else {}
            return self._convert_decimals_to_float(result)
        except Exception as e:
            logger.error(f"Error fetching customer economics: {e}", exc_info=True)
            raise
