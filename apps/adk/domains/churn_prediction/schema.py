"""Churn prediction database schema - Direct port from Express"""

from database.base_schema import TableSchema, BaseSchema


class ChurnSchema(BaseSchema):
    """Direct port of Express churnPrediction.schema.ts"""

    # Table definitions
    TABLES = {
        'customer': '"dbo_D_Customer"',
        'transaction': '"dbo_F_Sales_Transaction"',
        'loyalty': '"dbo_F_Customer_Loyalty"',
    }

    # Aliases
    ALIASES = {
        'customer': 'c',
        'transaction': 't',
        'loyalty': 'cl',
    }

    # Customer schema
    CUSTOMER = TableSchema(
        table_name=TABLES['customer'],
        alias=ALIASES['customer'],
        columns={
            'id': '"Customer Key"',
            'name': '"Customer Name"',
            'status': '"Customer Status"',
            'region': '"Customer State/Prov"',
            'type': '"Customer Type Desc"',
            'credit_limit': '"Credit Limit Amount"',
        },
        refs={
            'id': 'c."Customer Key"',
            'name': 'c."Customer Name"',
            'status': 'c."Customer Status"',
            'region': 'c."Customer State/Prov"',
            'type': 'c."Customer Type Desc"',
            'credit_limit': 'c."Credit Limit Amount"',
        },
        output_aliases={
            'id': 'customer_id',
            'name': 'customer_name',
            'status': 'customer_status',
            'region': 'region',
            'type': 'customer_type',
            'credit_limit': 'credit_limit',
        }
    )

    # Transaction schema
    TRANSACTION = TableSchema(
        table_name=TABLES['transaction'],
        alias=ALIASES['transaction'],
        columns={
            'customer_id': '"Customer Key"',
            'txn_id': '"Sales Txn Key"',
            'date': '"Txn Date"',
            'net_amount': '"Net Sales Amount"',
            'gross_amount': '"Sales Amount"',
            'return_amount': '"Return Amount"',
            'item_number': '"Item Number"',
            'document': '"Sales Txn Document"',
        },
        refs={
            'customer_id': 't."Customer Key"',
            'txn_id': 't."Sales Txn Key"',
            'date': 't."Txn Date"',
            'net_amount': 't."Net Sales Amount"',
            'gross_amount': 't."Sales Amount"',
            'return_amount': 't."Return Amount"',
            'item_number': 't."Item Number"',
            'document': 't."Sales Txn Document"',
        },
        output_aliases={
            'customer_id': 'customer_id',
            'txn_id': 'txn_id',
            'date': 'txn_date',
            'net_amount': 'net_sales_amount',
            'gross_amount': 'sales_amount',
            'return_amount': 'return_amount',
            'item_number': 'item_number',
            'document': 'sales_txn_document',
        }
    )

    # Loyalty schema - Fixed to use Entity Key as per Express
    LOYALTY = TableSchema(
        table_name=TABLES['loyalty'],
        alias=ALIASES['loyalty'],
        columns={
            'customer_id': '"Entity Key"',  # Corrected from Customer Number
            'customer_number': '"Customer Number"',
            'loyalty_status': '"Loyalty Status"',
            'rfm_score': '"RFM Score"',
            'days_since_last_activity': '"Days Since Last Activity"',
            'lifetime_sales': '"LTD Sales Amount"',
            'last_activity_date': '"Last Activity Date"',
        },
        refs={
            'customer_id': 'cl."Entity Key"',
            'customer_number': 'cl."Customer Number"',
            'loyalty_status': 'cl."Loyalty Status"',
            'rfm_score': 'cl."RFM Score"',
            'days_since_last_activity': 'cl."Days Since Last Activity"',
            'lifetime_sales': 'cl."LTD Sales Amount"',
            'last_activity_date': 'cl."Last Activity Date"',
        },
        output_aliases={
            'customer_id': 'customer_id',
            'customer_number': 'customer_number',
            'loyalty_status': 'loyalty_status',
            'rfm_score': 'rfm_score',
            'days_since_last_activity': 'days_since_last_activity',
            'lifetime_sales': 'lifetime_sales',
            'last_activity_date': 'last_activity_date',
        }
    )

    @classmethod
    def get_tables(cls):
        """Return table name mappings"""
        return cls.TABLES

    @classmethod
    def get_aliases(cls):
        """Return table alias mappings"""
        return cls.ALIASES