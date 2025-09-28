"""Database schema for revenue analysis"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class ColumnRef:
    """Reference to a database column with output alias"""
    ref: str
    output_alias: str


class RevenueAnalysisSchema:
    """Schema definition for revenue analysis"""

    def __init__(self):
        # Table names
        self.TABLES = {
            'transaction': 'dbo_F_Sales_Transaction',
            'customer': 'dbo_D_Customer',
            'item': 'dbo_D_Item',
            'region': 'dbo_D_Region'
        }

        # Table aliases
        self.ALIASES = {
            'transaction': 't',
            'customer': 'c',
            'item': 'i',
            'region': 'r'
        }

        # Transaction table columns
        self.TRANSACTION = type('obj', (object,), {
            'refs': {
                'date': f"{self.ALIASES['transaction']}.[Txn Date]",
                'amount': f"{self.ALIASES['transaction']}.[Net Sales Amount]",
                'quantity': f"{self.ALIASES['transaction']}.[Net Sales Quantity]",
                'customer_key': f"{self.ALIASES['transaction']}.[Customer Key]",
                'item_key': f"{self.ALIASES['transaction']}.[Item Key]",
                'region_key': f"{self.ALIASES['transaction']}.[Sales Org Hrchy L1 Key]"
            },
            'output_aliases': {
                'date': 'date',
                'amount': 'amount',
                'quantity': 'quantity',
                'customer_key': 'customer_key',
                'item_key': 'item_key',
                'region_key': 'region_key'
            }
        })()

        # Customer table columns
        self.CUSTOMER = type('obj', (object,), {
            'refs': {
                'key': f"{self.ALIASES['customer']}.[Customer Key]",
                'name': f"{self.ALIASES['customer']}.[Customer Name]",
                'segment': f"{self.ALIASES['customer']}.[Customer Segment]"
            },
            'output_aliases': {
                'key': 'customer_key',
                'name': 'customer_name',
                'segment': 'customer_segment'
            }
        })()

        # Item table columns
        self.ITEM = type('obj', (object,), {
            'refs': {
                'key': f"{self.ALIASES['item']}.[Item Key]",
                'desc': f"{self.ALIASES['item']}.[Item Desc]",
                'category': f"{self.ALIASES['item']}.[Item Category Desc]",
                'subcategory': f"{self.ALIASES['item']}.[Item Subcategory Desc]"
            },
            'output_aliases': {
                'key': 'item_key',
                'desc': 'product_name',
                'category': 'category',
                'subcategory': 'subcategory'
            }
        })()

        # Region table columns
        self.REGION = type('obj', (object,), {
            'refs': {
                'key': f"{self.ALIASES['region']}.[Sales Org Hrchy L1 Key]",
                'name': f"{self.ALIASES['region']}.[Sales Org Hrchy L1 Name]"
            },
            'output_aliases': {
                'key': 'region_key',
                'name': 'region_name'
            }
        })()

    def build_base_query(self) -> str:
        """Build base query with proper joins"""
        return f"""
        SELECT
            {self.TRANSACTION.refs['date']} as {self.TRANSACTION.output_aliases['date']},
            {self.TRANSACTION.refs['amount']} as {self.TRANSACTION.output_aliases['amount']},
            {self.TRANSACTION.refs['quantity']} as {self.TRANSACTION.output_aliases['quantity']},
            {self.CUSTOMER.refs['name']} as {self.CUSTOMER.output_aliases['name']},
            {self.CUSTOMER.refs['segment']} as {self.CUSTOMER.output_aliases['segment']},
            {self.ITEM.refs['desc']} as {self.ITEM.output_aliases['desc']},
            {self.ITEM.refs['category']} as {self.ITEM.output_aliases['category']},
            {self.REGION.refs['name']} as {self.REGION.output_aliases['name']}
        FROM {self.TABLES['transaction']} {self.ALIASES['transaction']}
        LEFT JOIN {self.TABLES['customer']} {self.ALIASES['customer']}
            ON {self.TRANSACTION.refs['customer_key']} = {self.CUSTOMER.refs['key']}
        LEFT JOIN {self.TABLES['item']} {self.ALIASES['item']}
            ON {self.TRANSACTION.refs['item_key']} = {self.ITEM.refs['key']}
        LEFT JOIN {self.TABLES['region']} {self.ALIASES['region']}
            ON {self.TRANSACTION.refs['region_key']} = {self.REGION.refs['key']}
        """

    def build_revenue_summary_query(self) -> str:
        """Build query for revenue summary data"""
        return f"""
        SELECT
            SUM({self.TRANSACTION.refs['amount']}) as total_revenue,
            COUNT(*) as total_transactions,
            AVG({self.TRANSACTION.refs['amount']}) as avg_transaction_value,
            COUNT(DISTINCT {self.TRANSACTION.refs['customer_key']}) as unique_customers,
            MIN({self.TRANSACTION.refs['date']}) as start_date,
            MAX({self.TRANSACTION.refs['date']}) as end_date
        FROM {self.TABLES['transaction']} {self.ALIASES['transaction']}
        """

    def build_revenue_breakdown_query(self) -> str:
        """Build query for revenue breakdown analysis"""
        return f"""
        SELECT
            {self.ITEM.refs['category']} as category,
            {self.CUSTOMER.refs['segment']} as segment,
            {self.REGION.refs['name']} as region,
            SUM({self.TRANSACTION.refs['amount']}) as revenue,
            COUNT(*) as transaction_count,
            AVG({self.TRANSACTION.refs['amount']}) as avg_value
        FROM {self.TABLES['transaction']} {self.ALIASES['transaction']}
        LEFT JOIN {self.TABLES['customer']} {self.ALIASES['customer']}
            ON {self.TRANSACTION.refs['customer_key']} = {self.CUSTOMER.refs['key']}
        LEFT JOIN {self.TABLES['item']} {self.ALIASES['item']}
            ON {self.TRANSACTION.refs['item_key']} = {self.ITEM.refs['key']}
        LEFT JOIN {self.TABLES['region']} {self.ALIASES['region']}
            ON {self.TRANSACTION.refs['region_key']} = {self.REGION.refs['key']}
        """
