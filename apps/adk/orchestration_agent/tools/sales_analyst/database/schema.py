"""
Database schema documentation for the Sales Analytics Multi-Agent System.
"""

# Fact Tables
SALES_TRANSACTION_SCHEMA = {
    'table_name': 'dbo_F_Sales_Transaction',
    'description': 'Core sales transaction data',
    'columns': {
        'TransactionID': 'Primary key, unique identifier for each transaction',
        'OrderID': 'Foreign key to Sales Order table',
        'CustomerID': 'Foreign key to Customer table',
        'ItemID': 'Foreign key to Item table',
        'RegionID': 'Foreign key to Sales Organization table',
        'TransactionDate': 'Date of the transaction',
        'Amount': 'Transaction amount',
        'Quantity': 'Number of items sold',
        'UnitPrice': 'Price per unit',
        'Discount': 'Discount amount if applicable'
    }
}

SALES_ORDER_SCHEMA = {
    'table_name': 'dbo_F_Sales_Order',
    'description': 'Sales order header information',
    'columns': {
        'OrderID': 'Primary key, unique identifier for each order',
        'CustomerID': 'Foreign key to Customer table',
        'OrderDate': 'Date the order was placed',
        'TotalAmount': 'Total order amount',
        'Status': 'Order status (e.g., Completed, Pending, Cancelled)'
    }
}

# Dimension Tables
CUSTOMER_SCHEMA = {
    'table_name': 'dbo_D_Customer',
    'description': 'Customer master data',
    'columns': {
        'CustomerID': 'Primary key, unique identifier for each customer',
        'CustomerName': 'Name of the customer',
        'CustomerCategory': 'Customer segmentation category',
        'GeographyID': 'Foreign key to Geography table',
        'JoinDate': 'Date customer first made a purchase'
    }
}

ITEM_SCHEMA = {
    'table_name': 'dbo_D_Item',
    'description': 'Product master data',
    'columns': {
        'ItemID': 'Primary key, unique identifier for each product',
        'ProductName': 'Name of the product',
        'Category': 'Product category',
        'SubCategory': 'Product subcategory',
        'UnitCost': 'Cost per unit'
    }
}

SALES_ORGANIZATION_SCHEMA = {
    'table_name': 'dbo_D_Sales_Organization',
    'description': 'Sales territory and organizational structure',
    'columns': {
        'RegionID': 'Primary key, unique identifier for each region',
        'RegionName': 'Name of the region',
        'ManagerID': 'ID of the regional manager',
        'ParentRegionID': 'Hierarchical relationship to parent region'
    }
}

# Helper function to get table schema
def get_table_schema(table_name):
    """Get the schema for a specific table."""
    schemas = {
        'dbo_F_Sales_Transaction': SALES_TRANSACTION_SCHEMA,
        'dbo_F_Sales_Order': SALES_ORDER_SCHEMA,
        'dbo_D_Customer': CUSTOMER_SCHEMA,
        'dbo_D_Item': ITEM_SCHEMA,
        'dbo_D_Sales_Organization': SALES_ORGANIZATION_SCHEMA
    }
    
    if table_name not in schemas:
        raise ValueError(f"Unknown table: {table_name}")
    
    return schemas[table_name] 