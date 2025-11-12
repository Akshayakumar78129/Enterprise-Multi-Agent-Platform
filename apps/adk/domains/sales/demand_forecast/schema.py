"""Database schema configuration for demand forecast domain"""

from typing import Dict, List


class DemandForecastSchema:
    """Schema configuration for demand forecast queries"""

    def __init__(self):
        # Main table
        self.sales_table = "dbo_F_Sales_Transaction"
        self.customer_table = "dbo_D_Customer"

        # Column mappings
        self.columns = {
            # Sales Transaction columns
            "transaction_date": '"Txn Date"',
            "item_number": '"Item Number"',
            "quantity": '"Net Sales Quantity"',
            "amount": '"Net Sales Amount"',
            "product_group": '"Product Posting Group"',
            "customer_key": '"Customer Key"',

            # Customer columns
            "customer_name": '"Customer Name"',
            "customer_type": '"Customer Type Desc"',
        }

        # Available filter columns
        self.filter_columns = {
            "dateRange": {
                "start": self.columns["transaction_date"],
                "end": self.columns["transaction_date"]
            },
            "category": self.columns["product_group"],
            "item": self.columns["item_number"],
        }

    def get_column(self, name: str) -> str:
        """Get the actual database column name"""
        return self.columns.get(name, name)

    def get_filter_column(self, filter_name: str) -> str:
        """Get the column used for filtering"""
        return self.filter_columns.get(filter_name, filter_name)
