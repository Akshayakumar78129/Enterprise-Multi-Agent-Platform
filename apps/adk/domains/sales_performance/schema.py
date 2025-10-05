"""Database schema for sales performance analysis"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class ColumnRef:
    """Reference to a database column with output alias"""
    ref: str
    output_alias: str


class SalesPerformanceSchema:
    """Schema definition for sales performance analysis"""

    def __init__(self):
        # Table names - some have quotes as part of the table name, use backticks to escape
        self.TABLES = {
            'transaction': 'dbo_F_Sales_Transaction',  # No quotes in name
            'customer': 'dbo_D_Customer',  # No quotes in name
            'item': '`"dbo_D_Item"`',  # Name includes quotes, use backticks
            'region': '`"dbo_D_Sales_Organization"`'  # Name includes quotes, use backticks
        }

        # Table aliases
        self.ALIASES = {
            'transaction': 't',
            'customer': 'c',
            'item': 'i',
            'region': 'r'
        }

        # Transaction table columns (with double quotes for PostgreSQL)
        self.TRANSACTION = type('obj', (object,), {
            'refs': {
                'date': f't."Txn Date"',
                'amount': f't."Net Sales Amount"',
                'quantity': f't."Net Sales Quantity"',
                'customer_key': f't."Customer Key"',
                'item_key': f't."Item Key"',
                'region_key': f't."Sales Organization Key"',
                'deleted_flag': f't."Deleted Flag"',
                'excluded_flag': f't."Excluded Flag"'
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
                'key': f'c."Customer Key"',
                'name': f'c."Customer Name"',
                'type': f'c."Customer Type Desc"'
            },
            'output_aliases': {
                'key': 'customer_key',
                'name': 'customer_name',
                'type': 'customer_type'
            }
        })()

        # Item table columns
        self.ITEM = type('obj', (object,), {
            'refs': {
                'key': f'i."Item Key"',
                'desc': f'i."Item Desc"',
                'category': f'i."Item Category Desc"',
                'subcategory': f'i."Item Subcategory Desc"'
            },
            'output_aliases': {
                'key': 'item_key',
                'desc': 'product_name',
                'category': 'category',
                'subcategory': 'subcategory'
            }
        })()

        # Region/Sales Organization table columns
        self.REGION = type('obj', (object,), {
            'refs': {
                'key': f'r."Sales Organization Key"',
                'name': f'r."Sales Org Hrchy L1 Name"'
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
            {self.ITEM.refs['desc']} as {self.ITEM.output_aliases['desc']},
            {self.ITEM.refs['category']} as {self.ITEM.output_aliases['category']},
            {self.ITEM.refs['subcategory']} as {self.ITEM.output_aliases['subcategory']},
            {self.REGION.refs['name']} as {self.REGION.output_aliases['name']}
        FROM {self.TABLES['transaction']} {self.ALIASES['transaction']}
        LEFT JOIN {self.TABLES['customer']} {self.ALIASES['customer']}
            ON {self.TRANSACTION.refs['customer_key']} = {self.CUSTOMER.refs['key']}
        LEFT JOIN {self.TABLES['item']} {self.ALIASES['item']}
            ON {self.TRANSACTION.refs['item_key']} = {self.ITEM.refs['key']}
        LEFT JOIN {self.TABLES['region']} {self.ALIASES['region']}
            ON {self.TRANSACTION.refs['region_key']} = {self.REGION.refs['key']}
        WHERE {self.TRANSACTION.refs['deleted_flag']} = 0
            AND {self.TRANSACTION.refs['excluded_flag']} = 0
        """
