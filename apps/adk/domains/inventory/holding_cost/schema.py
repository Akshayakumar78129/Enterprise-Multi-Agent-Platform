"""Inventory Holding Cost database schema - PostgreSQL compatible"""

from database.base_schema import TableSchema, BaseSchema


class HoldingCostSchema(BaseSchema):
    """Schema for inventory holding cost analysis - PostgreSQL & SQLite compatible"""

    # Table definitions
    TABLES = {
        'transaction': '"dbo_F_Sales_Transaction"',
        'customer': '"dbo_D_Customer"',
    }

    # Aliases
    ALIASES = {
        'transaction': 't',
        'customer': 'c',
    }

    # Transaction schema
    TRANSACTION = TableSchema(
        table_name=TABLES['transaction'],
        alias=ALIASES['transaction'],
        columns={
            'customer_id': '"Customer Key"',
            'txn_id': '"Sales Txn Key"',
            'date': '"Txn Date"',
            'txn_date': '"Txn Date"',
            'net_amount': '"Net Sales Amount"',
            'gross_amount': '"Sales Amount"',
            'item_number': '"Item Number"',
            'product_group': '"Product Posting Group"',
            'category': '"Product Posting Group"',  # Alias for category filter
            'quantity': '"Net Sales Quantity"',
        },
        refs={
            'customer_id': 't."Customer Key"',
            'txn_id': 't."Sales Txn Key"',
            'date': 't."Txn Date"',
            'txn_date': 't."Txn Date"',
            'net_amount': 't."Net Sales Amount"',
            'gross_amount': 't."Sales Amount"',
            'item_number': 't."Item Number"',
            'product_group': 't."Product Posting Group"',
            'category': 't."Product Posting Group"',  # Alias for category filter
            'quantity': 't."Net Sales Quantity"',
        },
        output_aliases={
            'customer_id': 'customer_id',
            'txn_id': 'txn_id',
            'date': 'txn_date',
            'txn_date': 'txn_date',
            'net_amount': 'net_sales_amount',
            'gross_amount': 'sales_amount',
            'item_number': 'item_number',
            'product_group': 'product_group',
            'category': 'category',
            'quantity': 'quantity',
        }
    )

    # Customer schema (if needed for filters)
    CUSTOMER = TableSchema(
        table_name=TABLES['customer'],
        alias=ALIASES['customer'],
        columns={
            'id': '"Customer Key"',
            'name': '"Customer Name"',
            'region': '"Customer State/Prov"',
            'type': '"Customer Type Desc"',
        },
        refs={
            'id': 'c."Customer Key"',
            'name': 'c."Customer Name"',
            'region': 'c."Customer State/Prov"',
            'type': 'c."Customer Type Desc"',
        },
        output_aliases={
            'id': 'customer_id',
            'name': 'customer_name',
            'region': 'region',
            'type': 'customer_type',
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
