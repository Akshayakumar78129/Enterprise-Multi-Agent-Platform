"""Data service for regional sales analyzer - SQL queries only"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import RegionalSalesAnalyzerSchema


class RegionalSalesAnalyzerDataService:
    """Data service for regional sales analysis"""

    def __init__(self):
        # Disable connection pooling to avoid bracket/quoting issues
        self.db = DatabaseConnection(use_pool=False)
        self.schema = RegionalSalesAnalyzerSchema()
        self.filter_engine = FilterEngine()

    def _get_period_expression(self, date_ref: str, aggregation: str) -> str:
        """Generate database-specific period expression based on aggregation type"""
        if self.db.db_type == 'postgres':
            if aggregation == 'day':
                return f"TO_CHAR({date_ref}, 'YYYY-MM-DD')"
            elif aggregation == 'week':
                return f"TO_CHAR({date_ref}, 'IYYY-IW')"
            elif aggregation == 'quarter':
                return f"TO_CHAR({date_ref}, 'YYYY') || '-Q' || TO_CHAR({date_ref}, 'Q')"
            else:  # month
                return f"TO_CHAR({date_ref}, 'YYYY-MM')"
        else:  # sqlite
            if aggregation == 'day':
                return f"strftime('%Y-%m-%d', {date_ref})"
            elif aggregation == 'week':
                return f"strftime('%Y-W%W', {date_ref})"
            elif aggregation == 'quarter':
                return f"strftime('%Y', {date_ref}) || '-Q' || (CASE WHEN CAST(strftime('%m', {date_ref}) AS INTEGER) <= 3 THEN '1' WHEN CAST(strftime('%m', {date_ref}) AS INTEGER) <= 6 THEN '2' WHEN CAST(strftime('%m', {date_ref}) AS INTEGER) <= 9 THEN '3' ELSE '4' END)"
            else:  # month
                return f"strftime('%Y-%m', {date_ref})"

    async def get_regional_sales_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get regional sales data grouped by country and state"""

        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['country']} as country,
            {self.schema.CUSTOMER.refs['state']} as state,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as totalSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS numeric), 2) as netSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_quantity']}) AS numeric), 2) as totalQuantity,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['gross_profit']}) AS numeric), 2) as grossProfit,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as customerCount,
            COUNT(*) as transactionCount,
            ROUND(CAST(AVG({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as avgTransactionValue,
            MIN({self.schema.TRANSACTION.refs['date']}) as firstSaleDate,
            MAX({self.schema.TRANSACTION.refs['date']}) as lastSaleDate
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
        GROUP BY {self.schema.CUSTOMER.refs['country']}, {self.schema.CUSTOMER.refs['state']}
        ORDER BY totalSales DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        results = result_dict.get('rows', [])

        # Calculate profit margin for each region
        for row in results:
            if row.get('totalSales', 0) > 0:
                row['profitMargin'] = round((row.get('grossProfit', 0) / row['totalSales']) * 100, 2)
            else:
                row['profitMargin'] = 0.0

        return results

    async def get_country_level_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get country-level aggregated data"""

        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['country']} as country,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as totalSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS numeric), 2) as netSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_quantity']}) AS numeric), 2) as totalQuantity,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['gross_profit']}) AS numeric), 2) as grossProfit,
            ROUND(CAST(CAST(SUM({self.schema.TRANSACTION.refs['gross_profit']}) AS numeric) / NULLIF(SUM({self.schema.TRANSACTION.refs['sales_amount']}), 0) * 100 AS numeric), 2) as profitMargin,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as customerCount,
            COUNT(*) as transactionCount,
            COUNT(DISTINCT {self.schema.CUSTOMER.refs['state']}) as stateCount
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
        GROUP BY {self.schema.CUSTOMER.refs['country']}
        ORDER BY totalSales DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])

    async def get_time_series_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get time series data with configurable aggregation"""

        aggregation = filters.get('aggregation', 'month')

        # Get database-specific period expression
        period_expression = self._get_period_expression(self.schema.TRANSACTION.refs['date'], aggregation)

        sql = f"""
        SELECT
            {period_expression} as period,
            {self.schema.CUSTOMER.refs['country']} as country,
            {self.schema.CUSTOMER.refs['state']} as state,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as totalSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS numeric), 2) as netSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_quantity']}) AS numeric), 2) as totalQuantity,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['gross_profit']}) AS numeric), 2) as grossProfit,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as customerCount,
            COUNT(*) as transactionCount
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
        GROUP BY {period_expression}, {self.schema.CUSTOMER.refs['country']}, {self.schema.CUSTOMER.refs['state']}
        ORDER BY period ASC, totalSales DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])

    async def get_regional_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get summary statistics for regional sales"""

        sql = f"""
        SELECT
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as totalSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['net_sales_amount']}) AS numeric), 2) as netSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['gross_profit']}) AS numeric), 2) as grossProfit,
            COUNT(DISTINCT {self.schema.CUSTOMER.refs['country']}) as countryCount,
            COUNT(DISTINCT {self.schema.CUSTOMER.refs['state']}) as stateCount,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as customerCount,
            COUNT(*) as transactionCount,
            ROUND(CAST(AVG({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as avgTransactionValue
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        results = result_dict.get('rows', [])

        if results and len(results) > 0:
            summary = results[0]
            # Calculate profit margin
            if summary.get('totalSales') != None and summary.get('totalSales', 0) > 0:
                summary['profitMargin'] = round((summary.get('grossProfit', 0) / summary['totalSales']) * 100, 2)
            else:
                summary['profitMargin'] = 0.0
            return summary

        return {
            'totalSales': 0,
            'netSales': 0,
            'grossProfit': 0,
            'profitMargin': 0,
            'countryCount': 0,
            'stateCount': 0,
            'customerCount': 0,
            'transactionCount': 0,
            'avgTransactionValue': 0
        }

    async def get_top_regions(self, filters: Dict[str, Any] = {}, limit: int = 5) -> List[Dict]:
        """Get top performing regions"""

        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['country']} as country,
            {self.schema.CUSTOMER.refs['state']} as state,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as totalSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['gross_profit']}) / NULLIF(SUM({self.schema.TRANSACTION.refs['sales_amount']}), 0) * 100 AS numeric), 2) as profitMargin
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
        GROUP BY {self.schema.CUSTOMER.refs['country']}, {self.schema.CUSTOMER.refs['state']}
        ORDER BY totalSales DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        return result_dict.get('rows', [])

    async def get_opportunity_analysis(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get opportunity analysis using BCG matrix approach

        Note: Statistics are calculated from ALL regions (no country/state filters) to maintain
        consistent benchmarks, but date filters are still applied to statistics.
        """

        # Create a date-only filter (remove country/state filters for statistics)
        date_only_filters = {}
        if filters.get('dateFrom'):
            date_only_filters['dateFrom'] = filters['dateFrom']
        if filters.get('dateTo'):
            date_only_filters['dateTo'] = filters['dateTo']

        # First, get statistics from ALL regions (only date filters, no country/state)
        stats_sql = f"""
        WITH AllRegionalMetrics AS (
            SELECT
                {self.schema.CUSTOMER.refs['country']} as country,
                {self.schema.CUSTOMER.refs['state']} as state,
                ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as totalSales,
                COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as customerCount
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
                ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
            WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            GROUP BY {self.schema.CUSTOMER.refs['country']}, {self.schema.CUSTOMER.refs['state']}
        )
        SELECT
            AVG(totalSales) as avgSales,
            AVG(customerCount) as avgCustomers
        FROM AllRegionalMetrics
        """

        # Get statistics with date filters only (no country/state filters)
        stats_query, stats_params = self.filter_engine.apply_filters(stats_sql, date_only_filters, self.schema)
        stats_result = await self.db.query(stats_query, stats_params)
        stats = stats_result.get('rows', [{}])[0]
        avg_sales = stats.get('avgSales', 0) or 0
        avg_customers = stats.get('avgCustomers', 0) or 0

        # Now get filtered regional data and apply opportunity categorization
        sql = f"""
        SELECT
            {self.schema.CUSTOMER.refs['country']} as country,
            {self.schema.CUSTOMER.refs['state']} as state,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as totalSales,
            ROUND(CAST(SUM({self.schema.TRANSACTION.refs['gross_profit']}) AS numeric), 2) as grossProfit,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['customer_key']}) as customerCount,
            COUNT(*) as transactionCount,
            ROUND(CAST(AVG({self.schema.TRANSACTION.refs['sales_amount']}) AS numeric), 2) as avgTransactionValue
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
        GROUP BY {self.schema.CUSTOMER.refs['country']}, {self.schema.CUSTOMER.refs['state']}
        ORDER BY totalSales DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        results = result_dict.get('rows', [])

        # Apply opportunity categorization to each result
        for row in results:
            total_sales = row.get('totalSales', 0) or 0
            customer_count = row.get('customerCount', 0) or 0
            gross_profit = row.get('grossProfit', 0) or 0

            # Categorize based on comparison to global averages
            if total_sales > avg_sales and customer_count > avg_customers:
                row['opportunityCategory'] = 'Star Region'
            elif total_sales <= avg_sales and customer_count > avg_customers:
                row['opportunityCategory'] = 'Growth Opportunity'
            elif total_sales > avg_sales and customer_count <= avg_customers:
                row['opportunityCategory'] = 'Cash Cow'
            else:
                row['opportunityCategory'] = 'Focus Area'

            # Calculate comparison metrics
            if avg_sales > 0:
                row['salesVsAvg'] = round((total_sales / avg_sales - 1) * 100, 2)
            else:
                row['salesVsAvg'] = 0

            if avg_customers > 0:
                row['customersVsAvg'] = round((customer_count / avg_customers - 1) * 100, 2)
            else:
                row['customersVsAvg'] = 0

            # Calculate profit margin
            if total_sales > 0:
                row['profitMargin'] = round((gross_profit / total_sales) * 100, 2)
            else:
                row['profitMargin'] = 0

        return results

    async def get_available_regions(self) -> Dict[str, Any]:
        """Get available countries and states for filters"""

        sql = f"""
        SELECT DISTINCT
            {self.schema.CUSTOMER.refs['country']} as country,
            {self.schema.CUSTOMER.refs['state']} as state
        FROM {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
        WHERE {self.schema.CUSTOMER.refs['country']} IS NOT NULL
        AND {self.schema.CUSTOMER.refs['state']} IS NOT NULL
        AND {self.schema.CUSTOMER.refs['deleted_flag']} = 0
        ORDER BY {self.schema.CUSTOMER.refs['country']}, {self.schema.CUSTOMER.refs['state']}
        """

        result_dict = await self.db.query(sql, [])
        results = result_dict.get('rows', [])

        print(f"[RegionalSalesDataService] Query returned {len(results)} rows")
        if results and len(results) > 0:
            print(f"[RegionalSalesDataService] Sample row: {results[0]}")

        # Get unique countries
        countries = sorted(list(set([row['country'] for row in results if row.get('country')])))

        # Keep the full mapping of country-state pairs
        states = [{'country': row['country'], 'state': row['state']}
                  for row in results if row.get('country') and row.get('state')]

        print(f"[RegionalSalesDataService] Found {len(countries)} countries: {countries}")
        print(f"[RegionalSalesDataService] Found {len(states)} country-state pairs")
        if states and len(states) > 0:
            print(f"[RegionalSalesDataService] Sample state: {states[0]}")

        return {
            'countries': countries,
            'states': states
        }
