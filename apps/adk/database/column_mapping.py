"""Database column mapping utilities"""

from typing import Dict, Any

# Column mapping between tool expected columns and actual DB columns
COLUMN_MAPPING = {
    'revenue': 'Sales Amount',
    'total_amount': 'Sales Amount',
    'net_revenue': 'Net Sales Amount',
    'cost': 'Cost Amount',
    'profit': 'Gross Profit Amount',
    'quantity': 'Sales Quantity',
    'net_quantity': 'Net Sales Quantity',
    'transaction_date': 'Txn Date',
    'product_id': 'Item Number',
    'product_key': 'Item Key',
    'customer_id': 'Customer Key',
    'region_id': 'Location Key',
    'channel_id': 'Sales Organization Key',
    'warehouse_id': 'Warehouse Key',
    'customer_name': 'Customer',
    'customer_category': 'Customer Category',
    'customer_region': 'Customer Geography',
    'customer_class': 'Customer Class',
    'customer_type': 'Customer Type',
    'product_name': 'Item',
    'product_category': 'Item Category',
    'product_subcategory': 'Item Subcategory',
    'unit_cost': 'Unit Cost',
    'unit_price': 'Unit Price',
    'region_name': 'Location',
    'country': 'Country',
    'region': 'Region',
    'state_province': 'State/Province',
    'units': 'Sales Quantity',
    'margin': 'Gross Profit Amount',
    'aov': 'Sales Amount',
    'discount': 'Discount Amount',
    'return_amount': 'Return Amount',
    'gross_margin': 'Gross Profit Amount',
    'gross_margin_pct': 'Gross Profit Amount',
    # Additional common mappings
    'date': 'Txn Date',
    'amount': 'Sales Amount',
    'sales_amount': 'Sales Amount',
    'sales_quantity': 'Sales Quantity',
    'item_number': 'Item Number',
    'item_key': 'Item Key',
    'customer_key': 'Customer Key',
    'location_key': 'Location Key',
    'sales_org_key': 'Sales Organization Key',
    'warehouse_key': 'Warehouse Key',
    'item': 'Item',
    'item_category': 'Item Category',
    'item_subcategory': 'Item Subcategory',
    'unit_cost': 'Unit Cost',
    'unit_price': 'Unit Price',
    'location': 'Location',
    'gross_profit': 'Gross Profit Amount',
    'discount_amount': 'Discount Amount',
    'return_amount': 'Return Amount',
}


def get_db_column(tool_column: str) -> str:
    """
    Get the actual database column name for a tool's expected column name.
    
    Args:
        tool_column: The column name expected by the tool
        
    Returns:
        The actual database column name, or the original if no mapping exists
    """
    return COLUMN_MAPPING.get(tool_column, tool_column)


def get_tool_column(db_column: str) -> str:
    """
    Get the tool expected column name for a database column name.
    
    Args:
        db_column: The actual database column name
        
    Returns:
        The tool expected column name, or the original if no reverse mapping exists
    """
    # Create reverse mapping
    reverse_mapping = {v: k for k, v in COLUMN_MAPPING.items()}
    return reverse_mapping.get(db_column, db_column)


def get_all_mappings() -> Dict[str, str]:
    """
    Get all column mappings.
    
    Returns:
        Dictionary of tool_column -> db_column mappings
    """
    return COLUMN_MAPPING.copy()


def add_mapping(tool_column: str, db_column: str) -> None:
    """
    Add a new column mapping.
    
    Args:
        tool_column: The tool expected column name
        db_column: The actual database column name
    """
    COLUMN_MAPPING[tool_column] = db_column


def remove_mapping(tool_column: str) -> None:
    """
    Remove a column mapping.
    
    Args:
        tool_column: The tool expected column name to remove
    """
    COLUMN_MAPPING.pop(tool_column, None)
