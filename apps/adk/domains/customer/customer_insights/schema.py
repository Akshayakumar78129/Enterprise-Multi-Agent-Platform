"""Database schema for customer insights analysis"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class ColumnRef:
    """Reference to a database column with output alias"""
    ref: str
    output_alias: str


class CustomerInsightsSchema:
    """Schema definition for customer insights analysis"""

    def __init__(self):
        # Table names
        self.TABLES = {
            'customer': 'Customer',
            'order': '[Order]',
            'customer_list': 'Customer_List'
        }

        # Table aliases
        self.ALIASES = {
            'customer': 'c',
            'order': 'o',
            'customer_list': 'cl'
        }

        # Customer table columns
        self.CUSTOMER = type('obj', (object,), {
            'refs': {
                'id': f"{self.ALIASES['customer']}.[Customer Key]",
                'name': f"{self.ALIASES['customer']}.[Customer]",
                'category': f"{self.ALIASES['customer']}.[Category]",
                'segment': f"{self.ALIASES['customer']}.[Segment]",
                'postal_code': f"{self.ALIASES['customer']}.[Postal Code]"
            },
            'output_aliases': {
                'id': 'customer_id',
                'name': 'customer_name',
                'category': 'category',
                'segment': 'segment',
                'postal_code': 'postal_code'
            }
        })()

        # Order table columns
        self.ORDER = type('obj', (object,), {
            'refs': {
                'id': f"{self.ALIASES['order']}.[Order Key]",
                'customer_id': f"{self.ALIASES['order']}.[Customer Key]",
                'order_date': f"{self.ALIASES['order']}.[Order Date]",
                'total': f"{self.ALIASES['order']}.[Total Excluding Tax]",
                'status': f"{self.ALIASES['order']}.[Order Status]"
            },
            'output_aliases': {
                'id': 'order_id',
                'customer_id': 'customer_id',
                'order_date': 'order_date',
                'total': 'order_total',
                'status': 'order_status'
            }
        })()

        # Customer list columns
        self.CUSTOMER_LIST = type('obj', (object,), {
            'refs': {
                'customer_id': f"{self.ALIASES['customer_list']}.[Customer ID]",
                'rfm_score': f"{self.ALIASES['customer_list']}.[RFM Score]",
                'recency': f"{self.ALIASES['customer_list']}.[Days Since Last Activity]",
                'frequency': f"{self.ALIASES['customer_list']}.[Transaction Count]",
                'monetary': f"{self.ALIASES['customer_list']}.[Total Spent]"
            },
            'output_aliases': {
                'customer_id': 'customer_id',
                'rfm_score': 'rfm_score',
                'recency': 'recency',
                'frequency': 'frequency',
                'monetary': 'monetary_value'
            }
        })()

    def get_customer_columns(self) -> Dict[str, str]:
        """Get customer table column mappings"""
        return {
            alias: ref for alias, ref in zip(
                self.CUSTOMER.output_aliases.values(),
                self.CUSTOMER.refs.values()
            )
        }

    def get_order_columns(self) -> Dict[str, str]:
        """Get order table column mappings"""
        return {
            alias: ref for alias, ref in zip(
                self.ORDER.output_aliases.values(),
                self.ORDER.refs.values()
            )
        }

    def build_base_query(self, include_orders: bool = False) -> str:
        """Build base query with proper joins"""
        query = f"""
        SELECT DISTINCT
            {self.CUSTOMER.refs['id']} AS {self.CUSTOMER.output_aliases['id']},
            {self.CUSTOMER.refs['name']} AS {self.CUSTOMER.output_aliases['name']},
            {self.CUSTOMER.refs['segment']} AS {self.CUSTOMER.output_aliases['segment']}
        """

        if include_orders:
            query += f"""
            FROM {self.TABLES['customer']} {self.ALIASES['customer']}
            LEFT JOIN {self.TABLES['order']} {self.ALIASES['order']}
                ON {self.CUSTOMER.refs['id']} = {self.ORDER.refs['customer_id']}
            """
        else:
            query += f"""
            FROM {self.TABLES['customer']} {self.ALIASES['customer']}
            """

        return query