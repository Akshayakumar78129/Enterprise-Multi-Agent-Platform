"""
Customer Segmentation database schema
Following the same pattern as ChurnSchema
"""

from database.base_schema import TableSchema, BaseSchema


class CustomerSegmentationSchema(BaseSchema):
    """Customer Segmentation schema definition"""

    # Table definitions
    TABLES = {
        'customer': 'dbo_D_Customer',
        'transaction': 'dbo_F_Sales_Transaction',
        'loyalty': 'dbo_F_Customer_Loyalty',
        'product': 'dbo_D_Product',
        'inventory': 'dbo_F_Inventory_Transaction',
    }

    # Aliases
    ALIASES = {
        'customer': 'c',
        'transaction': 't',
        'loyalty': 'cl',
        'product': 'p',
        'inventory': 'i',
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
            'parent_key': '"Customer Key"',  # Parent key doesn't exist, use Customer Key
        },
        refs={
            'id': 'c."Customer Key"',
            'name': 'c."Customer Name"',
            'status': 'c."Customer Status"',
            'region': 'c."Customer State/Prov"',
            'type': 'c."Customer Type Desc"',
            'credit_limit': 'c."Credit Limit Amount"',
            'parent_key': 'c."Customer Key"',  # Parent key doesn't exist, use Customer Key
        },
        output_aliases={
            'id': 'customer_id',
            'name': 'customer_name',
            'status': 'customer_status',
            'region': 'region',
            'type': 'customer_type',
            'credit_limit': 'credit_limit',
            'parent_key': 'parent_customer_id',
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
            'quantity': '"Sales Quantity"',
            'cost_amount': '"Cost Amount"',
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
            'quantity': 't."Sales Quantity"',
            'cost_amount': 't."Cost Amount"',
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
            'quantity': 'quantity',
            'cost_amount': 'cost_amount',
        }
    )

    # Loyalty schema
    LOYALTY = TableSchema(
        table_name=TABLES['loyalty'],
        alias=ALIASES['loyalty'],
        columns={
            'customer_id': '"Entity Key"',
            'customer_number': '"Customer Number"',
            'loyalty_status': '"Loyalty Status"',
            'rfm_score': '"RFM Score"',
            'days_since_last_activity': '"Days Since Last Activity"',
            'lifetime_sales': '"LTD Sales Amount"',
            'last_activity_date': '"Last Activity Date"',
            'loyalty_level': '"Loyalty Level"',
        },
        refs={
            'customer_id': 'cl."Entity Key"',
            'customer_number': 'cl."Customer Number"',
            'loyalty_status': 'cl."Loyalty Status"',
            'rfm_score': 'cl."RFM Score"',
            'days_since_last_activity': 'cl."Days Since Last Activity"',
            'lifetime_sales': 'cl."LTD Sales Amount"',
            'last_activity_date': 'cl."Last Activity Date"',
            'loyalty_level': 'cl."Loyalty Level"',
        },
        output_aliases={
            'customer_id': 'customer_id',
            'customer_number': 'customer_number',
            'loyalty_status': 'loyalty_status',
            'rfm_score': 'rfm_score',
            'days_since_last_activity': 'days_since_last_activity',
            'lifetime_sales': 'lifetime_sales',
            'last_activity_date': 'last_activity_date',
            'loyalty_level': 'loyalty_level',
        }
    )

    # Product schema (for dashboards that need it)
    PRODUCT = TableSchema(
        table_name=TABLES['product'],
        alias=ALIASES['product'],
        columns={
            'product_key': '"Product Key"',
            'product_name': '"Product Name"',
            'product_desc': '"Product Description"',
            'product_type': '"Product Type"',
            'product_category': '"Product Category"',
            'unit_price': '"Unit Price"',
        },
        refs={
            'product_key': 'p."Product Key"',
            'product_name': 'p."Product Name"',
            'product_desc': 'p."Product Description"',
            'product_type': 'p."Product Type"',
            'product_category': 'p."Product Category"',
            'unit_price': 'p."Unit Price"',
        },
        output_aliases={
            'product_key': 'product_id',
            'product_name': 'product_name',
            'product_desc': 'product_description',
            'product_type': 'product_type',
            'product_category': 'product_category',
            'unit_price': 'unit_price',
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
