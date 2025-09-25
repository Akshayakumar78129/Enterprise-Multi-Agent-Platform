"""Database schema for customer behavior analysis"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class ColumnRef:
    """Reference to a database column with output alias"""
    ref: str
    output_alias: str


class CustomerBehaviorSchema:
    """Schema definition for customer behavior analysis"""

    def __init__(self):
        # Table names
        self.TABLES = {
            'customer': 'dbo_D_Customer',
            'transaction': 'dbo_F_Sales_Transaction',
            'loyalty': 'dbo_F_Customer_Loyalty',
            'ar_detail': 'dbo_F_AR_Detail'
        }

        # Table aliases
        self.ALIASES = {
            'customer': 'c',
            'transaction': 't',
            'loyalty': 'l',
            'ar_detail': 'ar'
        }

        # Customer table columns
        self.CUSTOMER = type('obj', (object,), {
            'refs': {
                'id': f"{self.ALIASES['customer']}.[Customer Key]",
                'name': f"{self.ALIASES['customer']}.[Customer Name]",
                'type': f"{self.ALIASES['customer']}.[Customer Type Desc]",
                'category': f"{self.ALIASES['customer']}.[Customer Category Hrchy Code]",
                'status': f"{self.ALIASES['customer']}.[Customer Status]",
                'city': f"{self.ALIASES['customer']}.[Customer City]",
                'region': f"{self.ALIASES['customer']}.[Customer State/Prov]",
                'country': f"{self.ALIASES['customer']}.[Customer Country]",
                'credit_limit': f"{self.ALIASES['customer']}.[Credit Limit Amount]"
            },
            'output_aliases': {
                'id': 'customer_id',
                'name': 'customer_name',
                'type': 'customer_type',
                'category': 'customer_category',
                'status': 'customer_status',
                'city': 'customer_city',
                'region': 'region',
                'country': 'country',
                'credit_limit': 'credit_limit'
            }
        })()

        # Transaction table columns
        self.TRANSACTION = type('obj', (object,), {
            'refs': {
                'customer_id': f"{self.ALIASES['transaction']}.[Customer Key]",
                'txn_date': f"{self.ALIASES['transaction']}.[Txn Date]",
                'net_sales_amount': f"{self.ALIASES['transaction']}.[Net Sales Amount]",
                'net_sales_quantity': f"{self.ALIASES['transaction']}.[Net Sales Quantity]",
                'item_id': f"{self.ALIASES['transaction']}.[Item Key]",
                'line_type': f"{self.ALIASES['transaction']}.[Line Type]",
                'product_category': f"{self.ALIASES['transaction']}.[Item Category Hrchy Key]",
                'sales_amount': f"{self.ALIASES['transaction']}.[Sales Amount]",
                'return_amount': f"{self.ALIASES['transaction']}.[Return Amount]",
                'discount_amount': f"{self.ALIASES['transaction']}.[Discount Amount]",
                'deleted_flag': f"{self.ALIASES['transaction']}.[Deleted Flag]",
                'excluded_flag': f"{self.ALIASES['transaction']}.[Excluded Flag]"
            },
            'output_aliases': {
                'customer_id': 'customer_id',
                'txn_date': 'transaction_date',
                'net_sales_amount': 'net_sales_amount',
                'net_sales_quantity': 'quantity',
                'item_id': 'item_id',
                'line_type': 'sales_channel',
                'product_category': 'product_category',
                'sales_amount': 'sales_amount',
                'return_amount': 'return_amount',
                'discount_amount': 'discount_amount'
            }
        })()

        # Loyalty table columns
        self.LOYALTY = type('obj', (object,), {
            'refs': {
                'customer_id': f"{self.ALIASES['loyalty']}.[Entity Key]",
                'loyalty_status': f"{self.ALIASES['loyalty']}.[Loyalty Status]",
                'rfm_score': f"{self.ALIASES['loyalty']}.[RFM Score]",
                'recency_band': f"{self.ALIASES['loyalty']}.[Recency Band]",
                'frequency_band': f"{self.ALIASES['loyalty']}.[Frequency Band]",
                'monetary_band': f"{self.ALIASES['loyalty']}.[Monetary Band]",
                'first_activity_date': f"{self.ALIASES['loyalty']}.[First Activity Date]",
                'last_activity_date': f"{self.ALIASES['loyalty']}.[Last Activity Date]",
                'days_since_last_activity': f"{self.ALIASES['loyalty']}.[Days Since Last Activity]",
                'lifetime_sales': f"{self.ALIASES['loyalty']}.[LTD Sales Amount]"
            },
            'output_aliases': {
                'customer_id': 'customer_id',
                'loyalty_status': 'loyalty_status',
                'rfm_score': 'rfm_score',
                'recency_band': 'recency_band',
                'frequency_band': 'frequency_band',
                'monetary_band': 'monetary_band',
                'first_activity_date': 'customer_since',
                'last_activity_date': 'last_activity_date',
                'days_since_last_activity': 'days_since_last_activity',
                'lifetime_sales': 'lifetime_sales'
            }
        })()

    def get_filter_column(self, filter_name: str) -> str:
        """Map filter names to actual column references

        Args:
            filter_name: Name of the filter

        Returns:
            Column reference string
        """
        filter_mapping = {
            'dateFrom': self.TRANSACTION.refs['txn_date'],
            'dateTo': self.TRANSACTION.refs['txn_date'],
            'segment': self.CUSTOMER.refs['category'],
            'segments': self.CUSTOMER.refs['category'],
            'customer_type': self.CUSTOMER.refs['type'],
            'loyalty_status': self.LOYALTY.refs['loyalty_status'],
            'region': self.CUSTOMER.refs['region'],
            'product_category': self.TRANSACTION.refs['product_category']
        }
        return filter_mapping.get(filter_name, '')