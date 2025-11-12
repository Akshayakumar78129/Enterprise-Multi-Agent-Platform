"""Database models and schema for product performance"""

from dataclasses import dataclass
from typing import Dict, Optional
from pydantic import BaseModel


@dataclass
class ColumnRef:
    """Reference to a database column with output alias"""
    ref: str
    output_alias: str


class ProductPerformanceSchema:
    """Schema definition for product performance analysis"""

    def __init__(self):
        # Table names
        self.TABLES = {
            'transaction': 'dbo_F_Sales_Transaction',
            'item': 'dbo_D_Item',
            'customer': 'dbo_D_Customer'
        }

        # Table aliases
        self.ALIASES = {
            'transaction': 't',
            'item': 'i',
            'customer': 'c'
        }

        # Transaction/Sales table columns (with double quotes for PostgreSQL)
        self.SALES = type('obj', (object,), {
            'refs': {
                'date': f't."Txn Date"',
                'amount': f't."Net Sales Amount"',
                'quantity': f't."Net Sales Quantity"',
                'item_key': f't."Item Key"',
                'customer_key': f't."Customer Key"',
                'deleted_flag': f't."Deleted Flag"',
                'excluded_flag': f't."Excluded Flag"'
            },
            'output_aliases': {
                'date': 'order_date',
                'amount': 'revenue',
                'quantity': 'units_sold',
                'item_key': 'item_key',
                'customer_key': 'customer_key'
            }
        })()

        # Alias for backwards compatibility
        self.TRANSACTION = self.SALES

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

        # Customer table columns
        self.CUSTOMER = type('obj', (object,), {
            'refs': {
                'key': f'c."Customer Key"',
                'name': f'c."Customer Name"'
            },
            'output_aliases': {
                'key': 'customer_key',
                'name': 'customer_name'
            }
        })()

    def build_base_query(self) -> str:
        """Build base query with proper joins"""
        return f"""
        SELECT
            {self.SALES.refs['date']} as {self.SALES.output_aliases['date']},
            {self.SALES.refs['amount']} as {self.SALES.output_aliases['amount']},
            {self.SALES.refs['quantity']} as {self.SALES.output_aliases['quantity']},
            {self.ITEM.refs['desc']} as {self.ITEM.output_aliases['desc']},
            {self.ITEM.refs['category']} as {self.ITEM.output_aliases['category']},
            {self.ITEM.refs['subcategory']} as {self.ITEM.output_aliases['subcategory']},
            {self.CUSTOMER.refs['name']} as {self.CUSTOMER.output_aliases['name']}
        FROM {self.TABLES['transaction']} {self.ALIASES['transaction']}
        LEFT JOIN {self.TABLES['item']} {self.ALIASES['item']}
            ON {self.SALES.refs['item_key']} = {self.ITEM.refs['key']}
        LEFT JOIN {self.TABLES['customer']} {self.ALIASES['customer']}
            ON {self.SALES.refs['customer_key']} = {self.CUSTOMER.refs['key']}
        WHERE {self.SALES.refs['deleted_flag']} = 0
            AND {self.SALES.refs['excluded_flag']} = 0
        """


# Pydantic models for API
class ProductFilters(BaseModel):
    """Filters for product performance queries"""
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    categories: Optional[list[str]] = []
    subcategories: Optional[list[str]] = []
    products: Optional[list[str]] = []
    priceBands: Optional[list[str]] = []
    minMargin: Optional[float] = None
    maxMargin: Optional[float] = None
    minRevenue: Optional[float] = None
    maxRevenue: Optional[float] = None
    topN: Optional[int] = None
