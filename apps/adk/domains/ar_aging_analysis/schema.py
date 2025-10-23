"""Database schema for AR Aging Analysis"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class ColumnRef:
    """Reference to a database column with output alias"""
    ref: str
    output_alias: str


class ARAgingSchema:
    """Schema definition for AR aging analysis"""

    def __init__(self):
        # Table names
        self.TABLES = {
            'ar_detail': 'dbo_F_AR_Detail',
            'customer': 'dbo_D_Customer',
            'transaction': 'dbo_F_Sales_Transaction',
            'loyalty': 'dbo_F_Customer_Loyalty'
        }

        # Table aliases
        self.ALIASES = {
            'ar_detail': 'ar',
            'customer': 'c',
            'transaction': 't',
            'loyalty': 'l'
        }

        # AR Detail table columns (this is the main AR table)
        self.AR_DETAIL = type('obj', (object,), {
            'refs': {
                'customer_id': f'{self.ALIASES["ar_detail"]}."Customer Key"',
                'debit_amount': f'{self.ALIASES["ar_detail"]}."Debit Amount"',
                'credit_amount': f'{self.ALIASES["ar_detail"]}."Credit Amount"',
                'posting_date': f'{self.ALIASES["ar_detail"]}."Posting Date"',
                'txn_date': f'{self.ALIASES["ar_detail"]}."Txn Date"',
                'document_number': f'{self.ALIASES["ar_detail"]}."Document Number"',
                'document_type': f'{self.ALIASES["ar_detail"]}."Document Type"',
                'age_band_days': f'{self.ALIASES["ar_detail"]}."Age Band Days"',
                'age_band': f'{self.ALIASES["ar_detail"]}."Age Band"',
                'txn_amount': f'{self.ALIASES["ar_detail"]}."Txn Amount"',
                'deleted_flag': f'{self.ALIASES["ar_detail"]}."Deleted Flag"'
            },
            'output_aliases': {
                'customer_id': 'customer_id',
                'debit_amount': 'balance_due_amount',
                'credit_amount': 'credit_amount',
                'posting_date': 'posting_date',
                'txn_date': 'due_date',
                'document_number': 'invoice_number',
                'document_type': 'document_type',
                'age_band_days': 'days_overdue',
                'age_band': 'age_band',
                'txn_amount': 'transaction_amount'
            }
        })()

        # Customer table columns
        self.CUSTOMER = type('obj', (object,), {
            'refs': {
                'id': f'{self.ALIASES["customer"]}."Customer Key"',
                'name': f'{self.ALIASES["customer"]}."Customer Name"',
                'type': f'{self.ALIASES["customer"]}."Customer Type Desc"',
                'category': f'{self.ALIASES["customer"]}."Customer Category Hrchy Code"',
                'status': f'{self.ALIASES["customer"]}."Customer Status"',
                'city': f'{self.ALIASES["customer"]}."Customer City"',
                'region': f'{self.ALIASES["customer"]}."Customer State/Prov"',
                'country': f'{self.ALIASES["customer"]}."Customer Country"',
                'credit_limit': f'{self.ALIASES["customer"]}."Credit Limit Amount"'
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

        # Transaction table columns (for CLV calculation)
        self.TRANSACTION = type('obj', (object,), {
            'refs': {
                'customer_id': f'{self.ALIASES["transaction"]}."Customer Key"',
                'txn_date': f'{self.ALIASES["transaction"]}."Txn Date"',
                'net_sales_amount': f'{self.ALIASES["transaction"]}."Net Sales Amount"',
                'net_sales_quantity': f'{self.ALIASES["transaction"]}."Net Sales Quantity"',
                'item_id': f'{self.ALIASES["transaction"]}."Item Key"',
                'sales_amount': f'{self.ALIASES["transaction"]}."Sales Amount"',
                'return_amount': f'{self.ALIASES["transaction"]}."Return Amount"',
                'discount_amount': f'{self.ALIASES["transaction"]}."Discount Amount"',
                'deleted_flag': f'{self.ALIASES["transaction"]}."Deleted Flag"',
                'excluded_flag': f'{self.ALIASES["transaction"]}."Excluded Flag"'
            },
            'output_aliases': {
                'customer_id': 'customer_id',
                'txn_date': 'transaction_date',
                'net_sales_amount': 'net_sales_amount',
                'net_sales_quantity': 'quantity',
                'item_id': 'item_id',
                'sales_amount': 'sales_amount',
                'return_amount': 'return_amount',
                'discount_amount': 'discount_amount'
            }
        })()

        # Loyalty table columns
        self.LOYALTY = type('obj', (object,), {
            'refs': {
                'customer_id': f'{self.ALIASES["loyalty"]}."Entity Key"',
                'loyalty_status': f'{self.ALIASES["loyalty"]}."Loyalty Status"',
                'rfm_score': f'{self.ALIASES["loyalty"]}."RFM Score"',
                'recency_band': f'{self.ALIASES["loyalty"]}."Recency Band"',
                'frequency_band': f'{self.ALIASES["loyalty"]}."Frequency Band"',
                'monetary_band': f'{self.ALIASES["loyalty"]}."Monetary Band"',
                'first_activity_date': f'{self.ALIASES["loyalty"]}."First Activity Date"',
                'last_activity_date': f'{self.ALIASES["loyalty"]}."Last Activity Date"',
                'days_since_last_activity': f'{self.ALIASES["loyalty"]}."Days Since Last Activity"',
                'lifetime_sales': f'{self.ALIASES["loyalty"]}."LTD Sales Amount"'
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
            'dateFrom': self.AR_DETAIL.refs['posting_date'],
            'dateTo': self.AR_DETAIL.refs['posting_date'],
            'customerSegments': self.CUSTOMER.refs['category'],
            'customer_type': self.CUSTOMER.refs['type'],
            'region': self.CUSTOMER.refs['region'],
            'minAmount': self.AR_DETAIL.refs['debit_amount'],
            'maxAmount': self.AR_DETAIL.refs['debit_amount']
        }
        return filter_mapping.get(filter_name, '')
