"""Database schema for sales forecast analysis"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class ColumnRef:
    """Reference to a database column with output alias"""
    ref: str
    output_alias: str


class SalesForecastSchema:
    """Schema definition for sales forecast analysis"""

    def __init__(self):
        # Table names
        self.TABLES = {
            'transaction': 'dbo_F_Sales_Transaction',
            'customer': 'dbo_D_Customer',
            'item': 'dbo_D_Item',
            'region': 'dbo_D_Region',
            'time': 'dbo_D_Time'
        }

        # Table aliases
        self.ALIASES = {
            'transaction': 't',
            'customer': 'c',
            'item': 'i',
            'region': 'r',
            'time': 'tm'
        }

        # Transaction table columns
        self.TRANSACTION = type('obj', (object,), {
            'refs': {
                'date': f"{self.ALIASES['transaction']}.[Txn Date]",
                'amount': f"{self.ALIASES['transaction']}.[Net Sales Amount]",
                'quantity': f"{self.ALIASES['transaction']}.[Net Sales Quantity]",
                'customer_key': f"{self.ALIASES['transaction']}.[Customer Key]",
                'item_key': f"{self.ALIASES['transaction']}.[Item Key]",
                'region_key': f"{self.ALIASES['transaction']}.[Sales Org Hrchy L1 Key]",
                'time_key': f"{self.ALIASES['transaction']}.[Time Key]"
            },
            'output_aliases': {
                'date': 'date',
                'amount': 'amount',
                'quantity': 'quantity',
                'customer_key': 'customer_key',
                'item_key': 'item_key',
                'region_key': 'region_key',
                'time_key': 'time_key'
            }
        })()

        # Time dimension columns
        self.TIME = type('obj', (object,), {
            'refs': {
                'key': f"{self.ALIASES['time']}.[Time Key]",
                'month': f"{self.ALIASES['time']}.[Month]",
                'quarter': f"{self.ALIASES['time']}.[Quarter]",
                'year': f"{self.ALIASES['time']}.[Year]",
                'week': f"{self.ALIASES['time']}.[Week]"
            },
            'output_aliases': {
                'key': 'time_key',
                'month': 'month',
                'quarter': 'quarter',
                'year': 'year',
                'week': 'week'
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