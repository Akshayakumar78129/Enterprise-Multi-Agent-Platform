"""Database schema for regional sales analyzer"""

from database.base_schema import TableSchema, BaseSchema


class RegionalSalesAnalyzerSchema(BaseSchema):
    """Schema definition for regional sales analysis"""

    # Table definitions
    TABLES = {
        'transaction': 'dbo_F_Sales_Transaction',
        'customer': 'dbo_D_Customer',
    }

    # Table aliases
    ALIASES = {
        'transaction': 't',
        'customer': 'c',
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
            'gross_profit': '[Gross Profit Amount]',
            'customer_key': '[Customer Key]',
            'deleted_flag': '[Deleted Flag]',
        },
        refs={
            'date': 't.[Txn Date]',
            'sales_amount': 't.[Sales Amount]',
            'net_sales_amount': 't.[Net Sales Amount]',
            'sales_quantity': 't.[Sales Quantity]',
            'gross_profit': 't.[Gross Profit Amount]',
            'customer_key': 't.[Customer Key]',
            'deleted_flag': 't.[Deleted Flag]',
        },
        output_aliases={
            'date': 'date',
            'sales_amount': 'sales_amount',
            'net_sales_amount': 'net_sales_amount',
            'sales_quantity': 'sales_quantity',
            'gross_profit': 'gross_profit',
            'customer_key': 'customer_key',
            'deleted_flag': 'deleted_flag',
        }
    )

    # Customer schema
    CUSTOMER = TableSchema(
        table_name='dbo_D_Customer',
        alias='c',
        columns={
            'key': '[Customer Key]',
            'name': '[Customer Name]',
            'country': '[Customer Country]',
            'state': '[Customer State/Prov]',
            'deleted_flag': '[Deleted Flag]',
        },
        refs={
            'key': 'c.[Customer Key]',
            'name': 'c.[Customer Name]',
            'country': 'c.[Customer Country]',
            'state': 'c.[Customer State/Prov]',
            'deleted_flag': 'c.[Deleted Flag]',
        },
        output_aliases={
            'key': 'customer_key',
            'name': 'customer_name',
            'country': 'country',
            'state': 'state',
            'deleted_flag': 'deleted_flag',
        }
    )
