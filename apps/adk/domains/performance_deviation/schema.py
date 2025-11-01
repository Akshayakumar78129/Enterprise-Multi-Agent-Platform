"""Database schema for Performance Deviation Analysis"""


class PerformanceSchema:
    """Database schema configuration for performance deviation analysis"""

    # Table definitions
    TABLES = {
        'sales': '"dbo_F_Sales_Transaction"',
        'loyalty': '"dbo_F_Customer_Loyalty"',
        'ar': '"dbo_F_AR_Detail"',
        'customers': '"dbo_D_Customer"'
    }

    # Aliases for SQL joins
    ALIASES = {
        'sales': 'st',
        'loyalty': 'cl',
        'ar': 'ar',
        'customers': 'cust'
    }

    # Column mappings for Sales Transaction
    class SALES:
        refs = {
            'date': '"Txn Date"',
            'document': '"Sales Txn Document"',
            'amount': '"Sales Amount"',
            'customer_key': '"Customer Key"',
            'product_group': '"Product Posting Group"',
            'quantity': '"Quantity"'
        }
        output_aliases = {
            'date': 'txn_date',
            'document': 'sales_document',
            'amount': 'sales_amount',
            'customer_key': 'customer_id',
            'product_group': 'product_category',
            'quantity': 'quantity'
        }

    # Column mappings for Customer Loyalty
    class LOYALTY:
        refs = {
            'date': '"Last Activity Date"',
            'customer_key': '"Customer Key"',
            'active_count': '"Active Customer Count"',
            'loyal_count': '"Loyal Customer Count"',
            'rfm_score': '"RFM Score"',
            'segment': '"Customer Segment"'
        }
        output_aliases = {
            'date': 'activity_date',
            'customer_key': 'customer_id',
            'active_count': 'active_customers',
            'loyal_count': 'loyal_customers',
            'rfm_score': 'rfm_score',
            'segment': 'customer_segment'
        }

    # Column mappings for AR Detail
    class AR:
        refs = {
            'date': '"Txn Date"',
            'detail_id': '"AR Detail Id"',
            'amount': '"Txn Amount"',
            'age_days': '"Age Band Days"',
            'customer_key': '"Customer Key"',
            'status': '"Status"'
        }
        output_aliases = {
            'date': 'ar_date',
            'detail_id': 'ar_detail_id',
            'amount': 'ar_amount',
            'age_days': 'age_band_days',
            'customer_key': 'customer_id',
            'status': 'ar_status'
        }

    # Column mappings for Customers
    class CUSTOMERS:
        refs = {
            'customer_key': '"Customer Key"',
            'customer_name': '"Customer Name"',
            'segment': '"Customer Segment"',
            'region': '"Region"',
            'industry': '"Industry"'
        }
        output_aliases = {
            'customer_key': 'customer_id',
            'customer_name': 'customer_name',
            'segment': 'customer_segment',
            'region': 'region',
            'industry': 'industry'
        }