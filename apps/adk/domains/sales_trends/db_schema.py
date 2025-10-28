"""Database schema for sales trends"""

from database.base_schema import TableSchema, BaseSchema


class SalesTrendsSchema(BaseSchema):
    """Schema definition for sales trends analysis"""

    # Table definitions
    TABLES = {
        'transaction': 'dbo_F_Sales_Transaction',
        'customer': 'dbo_D_Customer',
        'item': 'dbo_D_Item',
    }

    # Table aliases
    ALIASES = {
        'transaction': 't',
        'customer': 'c',
        'item': 'i',
    }

    # Transaction schema
    TRANSACTION = TableSchema(
        table_name='dbo_F_Sales_Transaction',
        alias='t',
        columns={
            'date': '[Txn Date]',
            'sales_amount': '[Sales Amount]',
            'net_sales_amount': '[Net Sales Amount]',
            'sales_quantity': '[Sales Quantity]',
            'net_sales_quantity': '[Net Sales Quantity]',
            'cost_amount': '[Cost Amount]',
            'sales_txn_number': '[Sales Txn Number]',
            'customer_key': '[Customer Key]',
            'item_key': '[Item Key]',
            'deleted_flag': '[Deleted Flag]',
            'excluded_flag': '[Excluded Flag]',
        },
        refs={
            'date': 't.[Txn Date]',
            'sales_amount': 't.[Sales Amount]',
            'net_sales_amount': 't.[Net Sales Amount]',
            'sales_quantity': 't.[Sales Quantity]',
            'net_sales_quantity': 't.[Net Sales Quantity]',
            'cost_amount': 't.[Cost Amount]',
            'sales_txn_number': 't.[Sales Txn Number]',
            'customer_key': 't.[Customer Key]',
            'item_key': 't.[Item Key]',
            'deleted_flag': 't.[Deleted Flag]',
            'excluded_flag': 't.[Excluded Flag]',
        },
        output_aliases={
            'date': 'date',
            'sales_amount': 'sales_amount',
            'net_sales_amount': 'net_sales_amount',
            'sales_quantity': 'sales_quantity',
            'net_sales_quantity': 'net_sales_quantity',
            'cost_amount': 'cost_amount',
            'sales_txn_number': 'sales_txn_number',
            'customer_key': 'customer_key',
            'item_key': 'item_key',
            'deleted_flag': 'deleted_flag',
            'excluded_flag': 'excluded_flag',
        }
    )

    # Customer schema
    CUSTOMER = TableSchema(
        table_name='dbo_D_Customer',
        alias='c',
        columns={
            'key': '[Customer Key]',
            'name': '[Customer Name]',
            'type': '[Customer Type Desc]',
            'country': '[Customer Country]',
            'state': '[Customer State/Prov]',
        },
        refs={
            'key': 'c.[Customer Key]',
            'name': 'c.[Customer Name]',
            'type': 'c.[Customer Type Desc]',
            'country': 'c.[Customer Country]',
            'state': 'c.[Customer State/Prov]',
        },
        output_aliases={
            'key': 'customer_key',
            'name': 'customer_name',
            'type': 'customer_type',
            'country': 'country',
            'state': 'state',
        }
    )

    # Item schema
    ITEM = TableSchema(
        table_name='dbo_D_Item',
        alias='i',
        columns={
            'key': '[Item Key]',
            'desc': '[Item Desc]',
            'category': '[Item Category Desc]',
        },
        refs={
            'key': 'i.[Item Key]',
            'desc': 'i.[Item Desc]',
            'category': 'i.[Item Category Desc]',
        },
        output_aliases={
            'key': 'item_key',
            'desc': 'item_desc',
            'category': 'item_category',
        }
    )
