"""Data service for cash flow analysis - SQL queries only"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import CashFlowSchema


class CashFlowDataService:
    """Data service for cash flow analysis"""

    def __init__(self):
        # Disable connection pooling to avoid bracket/quoting issues
        self.db = DatabaseConnection(use_pool=False)
        self.schema = CashFlowSchema()
        self.filter_engine = FilterEngine()

    def _date_format(self, date_ref: str, format_type: str) -> str:
        """Generate database-specific date formatting SQL

        Args:
            date_ref: Column reference for the date
            format_type: Format type ('year_month', 'year', 'month')

        Returns:
            SQL expression for date formatting
        """
        if self.db.db_type == 'postgres':
            format_map = {
                'year_month': f"TO_CHAR({date_ref}, 'YYYY-MM')",
                'year': f"TO_CHAR({date_ref}, 'YYYY')",
                'month': f"TO_CHAR({date_ref}, 'MM')"
            }
            return format_map.get(format_type, f"TO_CHAR({date_ref}, 'YYYY-MM')")
        else:  # sqlite
            format_map = {
                'year_month': f"strftime('%Y-%m', {date_ref})",
                'year': f"strftime('%Y', {date_ref})",
                'month': f"strftime('%m', {date_ref})"
            }
            return format_map.get(format_type, f"strftime('%Y-%m', {date_ref})")

    async def get_cash_flow_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get cash flow summary KPIs"""

        sql = f"""
        SELECT
            SUM({self.schema.TRANSACTION.refs['amount']}) as total_cash_flow,
            COUNT(DISTINCT {self.schema.TRANSACTION.refs['date']}) as total_days,
            AVG({self.schema.TRANSACTION.refs['amount']}) as avg_daily_flow
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            return {
                'totalCashFlow': result[0].get('total_cash_flow', 0) or 0,
                'totalDays': result[0].get('total_days', 0) or 0,
                'avgDailyFlow': result[0].get('avg_daily_flow', 0) or 0
            }

        return {
            'totalCashFlow': 0,
            'totalDays': 0,
            'avgDailyFlow': 0
        }

    async def get_operating_cash_flow(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get operating cash flow (from sales transactions)"""

        sql = f"""
        SELECT
            SUM({self.schema.TRANSACTION.refs['amount']}) as total_operating_cf,
            COUNT(*) as transaction_count,
            AVG({self.schema.TRANSACTION.refs['amount']}) as avg_transaction
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            return {
                'totalOperatingCF': result[0].get('total_operating_cf', 0) or 0,
                'transactionCount': result[0].get('transaction_count', 0) or 0,
                'avgTransaction': result[0].get('avg_transaction', 0) or 0
            }

        return {
            'totalOperatingCF': 0,
            'transactionCount': 0,
            'avgTransaction': 0
        }

    async def get_cash_flow_by_category(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get cash flow breakdown by category"""

        sql = f"""
        SELECT
            {self.schema.ITEM.refs['category']} as category,
            SUM(CASE WHEN {self.schema.TRANSACTION.refs['amount']} > 0
                THEN {self.schema.TRANSACTION.refs['amount']} ELSE 0 END) as inflow,
            SUM(CASE WHEN {self.schema.TRANSACTION.refs['amount']} < 0
                THEN ABS({self.schema.TRANSACTION.refs['amount']}) ELSE 0 END) as outflow,
            SUM({self.schema.TRANSACTION.refs['amount']}) as net_flow,
            COUNT(*) as transaction_count
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        GROUP BY {self.schema.ITEM.refs['category']}
        ORDER BY net_flow DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'category': row.get('category') or 'Unknown',
            'inflow': row.get('inflow', 0) or 0,
            'outflow': row.get('outflow', 0) or 0,
            'net': row.get('net_flow', 0) or 0,
            'transactionCount': row.get('transaction_count', 0) or 0
        } for row in result]

    async def get_cash_flow_trends(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get cash flow trends over time (monthly aggregation)"""

        month_expr = self._date_format(self.schema.TRANSACTION.refs['date'], 'year_month')

        sql = f"""
        SELECT
            {month_expr} as month,
            SUM({self.schema.TRANSACTION.refs['amount']}) as total_flow,
            COUNT(*) as transaction_count,
            AVG({self.schema.TRANSACTION.refs['amount']}) as avg_flow
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        GROUP BY {month_expr}
        ORDER BY month
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'date': row.get('month'),
            'operating': row.get('total_flow', 0) or 0,  # Treat all as operating for now
            'investing': 0,  # Placeholder - could be derived from specific categories
            'financing': 0,  # Placeholder - could be derived from specific categories
            'net': row.get('total_flow', 0) or 0,
            'transactionCount': row.get('transaction_count', 0) or 0
        } for row in result]

    async def get_cash_flow_by_region(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get cash flow by region"""

        sql = f"""
        SELECT
            {self.schema.REGION.refs['name']} as region_name,
            SUM({self.schema.TRANSACTION.refs['amount']}) as total_flow,
            COUNT(*) as transaction_count,
            AVG({self.schema.TRANSACTION.refs['amount']}) as avg_flow
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        GROUP BY {self.schema.REGION.refs['name']}
        ORDER BY total_flow DESC
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'regionName': row.get('region_name', 'Unknown') or 'Unknown',
            'totalFlow': row.get('total_flow', 0) or 0,
            'transactionCount': row.get('transaction_count', 0) or 0,
            'avgFlow': row.get('avg_flow', 0) or 0
        } for row in result]

    async def get_transactions(self, filters: Dict[str, Any] = {}, limit: int = 100) -> List[Dict]:
        """Get individual cash flow transactions"""

        sql = f"""
        SELECT
            {self.schema.TRANSACTION.refs['date']} as date,
            {self.schema.ITEM.refs['category']} as category,
            {self.schema.ITEM.refs['desc']} as description,
            {self.schema.TRANSACTION.refs['amount']} as amount,
            {self.schema.REGION.refs['name']} as region,
            {self.schema.CUSTOMER.refs['name']} as customer
        FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
        LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
            ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
        LEFT JOIN {self.schema.TABLES['region']} {self.schema.ALIASES['region']}
            ON {self.schema.TRANSACTION.refs['region_key']} = {self.schema.REGION.refs['key']}
        LEFT JOIN {self.schema.TABLES['customer']} {self.schema.ALIASES['customer']}
            ON {self.schema.TRANSACTION.refs['customer_key']} = {self.schema.CUSTOMER.refs['key']}
        WHERE {self.schema.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.schema.TRANSACTION.refs['excluded_flag']} = 0
        ORDER BY {self.schema.TRANSACTION.refs['date']} DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'date': str(row.get('date', '')),
            'category': row.get('category') or 'Unknown',
            'description': row.get('description') or 'Transaction',
            'amount': row.get('amount', 0) or 0,
            'region': row.get('region') or 'Unknown',
            'customer': row.get('customer') or 'Unknown',
            'type': 'operating',  # Default all to operating
            'flowDirection': 'inflow' if (row.get('amount', 0) or 0) > 0 else 'outflow'
        } for row in result]

    async def get_fcf_bridge_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """
        Get Free Cash Flow bridge components for waterfall chart
        Returns FCF decomposition from EBITDA to Sustainable FCF
        """
        # Get operating cash flow data
        operating_data = await self.get_operating_cash_flow(filters)
        operating_cf = operating_data.get('totalOperatingCF', 0)

        # Estimate EBITDA (approximation: OCF represents ~80% of EBITDA typically)
        ebitda = operating_cf / 0.8 if operating_cf else 0

        # Simplified FCF bridge components
        fcf_bridge = [
            {
                'component': 'EBITDA',
                'value': ebitda,
                'impact_type': 'baseline',
                'sequence_order': 1
            },
            {
                'component': 'Working Capital Change',
                'value': -(ebitda * 0.15),  # Typical WC usage
                'impact_type': 'reduction',
                'sequence_order': 2
            },
            {
                'component': 'Capital Expenditure',
                'value': -(ebitda * 0.10),  # Typical CapEx
                'impact_type': 'reduction',
                'sequence_order': 3
            },
            {
                'component': 'Tax Impact',
                'value': -(ebitda * 0.25),  # Tax rate
                'impact_type': 'reduction',
                'sequence_order': 4
            },
            {
                'component': 'Interest Payments',
                'value': -(ebitda * 0.05),  # Interest
                'impact_type': 'reduction',
                'sequence_order': 5
            }
        ]

        # Calculate final FCF
        final_fcf = sum(item['value'] for item in fcf_bridge)
        fcf_bridge.append({
            'component': 'Sustainable FCF',
            'value': final_fcf,
            'impact_type': 'baseline',
            'sequence_order': 6
        })

        return fcf_bridge

    async def get_liquidity_timeline(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """
        Get daily/weekly liquidity timeline data
        Returns cash balance over time with risk indicators
        """
        # Get cash flow trends
        trends = await self.get_cash_flow_trends(filters)

        # Convert monthly trends to timeline with risk assessment
        timeline = []
        for trend in trends:
            cash_balance = trend.get('net', 0)

            # Determine liquidity status based on balance
            if cash_balance < 1000000:  # Less than $1M
                status = 'critical'
            elif cash_balance < 5000000:  # Less than $5M
                status = 'warning'
            else:
                status = 'healthy'

            timeline.append({
                'date': trend.get('date', ''),
                'cash_balance': cash_balance,
                'liquidity_status': status,
                'threshold_min': 1000000,  # $1M minimum
                'threshold_target': 10000000  # $10M target
            })

        return timeline

    async def get_capital_allocation(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """
        Get capital allocation breakdown for efficiency matrix
        Returns how capital is deployed across categories
        """
        # Get category-level performance
        categories = await self.get_cash_flow_by_category(filters)

        # Calculate total allocation
        total_amount = sum(abs(cat.get('net', 0)) for cat in categories)

        # Map categories to allocation types
        allocation_map = {
            'Bikes': 'growth',
            'Cargo': 'operations',
            'Racks': 'operations'
        }

        allocation = []
        for cat in categories:
            category_name = cat.get('category', 'Unknown')
            amount = abs(cat.get('net', 0))
            percentage = (amount / total_amount * 100) if total_amount > 0 else 0

            allocation.append({
                'category': category_name,
                'amount': amount,
                'percentage': percentage,
                'allocation_type': allocation_map.get(category_name, 'other')
            })

        return allocation
