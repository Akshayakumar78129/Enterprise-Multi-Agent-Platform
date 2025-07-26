"""
Module for mapping database column names to their corresponding display names and types.
"""

from typing import Dict, Any

def get_db_column(table_name: str, column_name: str) -> str:
    """
    Get the actual database column name for a given table and column.
    
    Args:
        table_name: Name of the database table
        column_name: Logical column name
        
    Returns:
        Actual database column name
    """
    column_mappings = {
        "sales": {
            "date": "Txn Date",
            "revenue": "Net Sales Amount",
            "units": "Net Sales Quantity",
            "customer_id": "Customer Key",
            "product_id": "Item Key",
            "region_id": "Sales Organization Key",
            "order_id": "Order ID",
            "deleted": "Deleted Flag",
            "excluded": "Excluded Flag"
        },
        "customer": {
            "id": "Customer Key",
            "name": "Customer Name",
            "region": "Customer Geography Hrchy L1 Name",
            "region_code": "Customer Geography Hrchy L1 Code"
        },
        "product": {
            "id": "Item Key",
            "name": "Item Desc",
            "category": "Item Category Desc",
            "subcategory": "Item Subcategory Desc"
        },
        "region": {
            "id": "Sales Organization Key",
            "name": "Sales Org Hrchy L1 Name",
            "code": "Sales Org Hrchy L1 Code",
            "parent_id": "Sales Org Hrchy Parent Key"
        }
    }
    
    return column_mappings.get(table_name, {}).get(column_name, column_name)

def get_column_type(table_name: str, column_name: str) -> str:
    """
    Get the data type for a given table and column.
    
    Args:
        table_name: Name of the database table
        column_name: Column name
        
    Returns:
        Data type of the column
    """
    type_mappings = {
        "sales": {
            "date": "DATE",
            "revenue": "DECIMAL",
            "units": "INTEGER",
            "customer_id": "INTEGER",
            "product_id": "INTEGER",
            "region_id": "INTEGER",
            "order_id": "INTEGER",
            "deleted": "BOOLEAN",
            "excluded": "BOOLEAN"
        },
        "customer": {
            "id": "INTEGER",
            "name": "TEXT",
            "region": "TEXT",
            "region_code": "TEXT"
        },
        "product": {
            "id": "INTEGER",
            "name": "TEXT",
            "category": "TEXT",
            "subcategory": "TEXT"
        },
        "region": {
            "id": "INTEGER",
            "name": "TEXT",
            "code": "TEXT",
            "parent_id": "INTEGER"
        }
    }
    
    return type_mappings.get(table_name, {}).get(column_name, "TEXT") 