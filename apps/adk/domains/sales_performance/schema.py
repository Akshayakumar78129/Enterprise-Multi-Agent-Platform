"""Database schema for sales performance analysis"""

from database.base_schema import TableSchema, BaseSchema


class  SalesPerformanceSchema(BaseSchema):
    """Schema definition for sales performance analysis - matching churn pattern"""

    # Table definitions
    TABLES = {
        'transaction': 'dbo_F_Sales_Transaction',
        'customer': 'dbo_D_Customer',
        'item': 'dbo_D_Item',
        'region': 'dbo_D_Sales_Organization',
    }

    # Table aliases
    ALIASES = {
        'transaction': 't',
        'customer': 'c',
        'item': 'i',
        'region': 'r',
    }

    # Transaction schema
    TRANSACTION = TableSchema(
        table_name='dbo_F_Sales_Transaction',
        alias='t',
        columns={
            'date': '[Txn Date]',
            'amount': '[Net Sales Amount]',
            'quantity': '[Net Sales Quantity]',
            'customer_key': '[Customer Key]',
            'item_key': '[Item Key]',
            'region_key': '[Sales Organization Key]',
            'deleted_flag': '[Deleted Flag]',
            'excluded_flag': '[Excluded Flag]',
        },
        refs={
            'date': 't.[Txn Date]',
            'amount': 't.[Net Sales Amount]',
            'quantity': 't.[Net Sales Quantity]',
            'customer_key': 't.[Customer Key]',
            'item_key': 't.[Item Key]',
            'region_key': 't.[Sales Organization Key]',
            'deleted_flag': 't.[Deleted Flag]',
            'excluded_flag': 't.[Excluded Flag]',
        },
        output_aliases={
            'date': 'date',
            'amount': 'amount',
            'quantity': 'quantity',
            'customer_key': 'customer_key',
            'item_key': 'item_key',
            'region_key': 'region_key',
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
        },
        refs={
            'key': 'c.[Customer Key]',
            'name': 'c.[Customer Name]',
            'type': 'c.[Customer Type Desc]',
        },
        output_aliases={
            'key': 'customer_key',
            'name': 'customer_name',
            'type': 'customer_type',
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
            'subcategory': '[Item Subcategory Desc]',
        },
        refs={
            'key': 'i.[Item Key]',
            'desc': 'i.[Item Desc]',
            'category': 'i.[Item Category Desc]',
            'subcategory': 'i.[Item Subcategory Desc]',
        },
        output_aliases={
            'key': 'item_key',
            'desc': 'product_name',
            'category': 'category',
            'subcategory': 'subcategory',
        }
    )

    # Region/Sales Organization schema
    REGION = TableSchema(
        table_name='dbo_D_Sales_Organization',
        alias='r',
        columns={
            'key': '[Sales Organization Key]',
            'name': '[Sales Org Hrchy L1 Name]',
        },
        refs={
            'key': 'r.[Sales Organization Key]',
            'name': 'r.[Sales Org Hrchy L1 Name]',
        },
        output_aliases={
            'key': 'region_key',
            'name': 'region_name',
        }
    )
