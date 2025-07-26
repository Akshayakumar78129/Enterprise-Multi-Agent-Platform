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
}

def get_db_column(tool_column):
    """
    Get the actual database column name for a tool's expected column name.
    """
    return COLUMN_MAPPING.get(tool_column, tool_column)