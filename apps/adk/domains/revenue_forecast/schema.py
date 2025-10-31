"""Database schema configuration for Revenue Forecast domain"""

from typing import Dict


class GLAccountRefs:
    """GL Transaction table column references"""

    def __init__(self, alias: str = 't'):
        self.alias = alias
        self.refs = {
            'txn_date': f'{alias}."Txn Date"',
            'txn_amount': f'{alias}."Txn Amount"',
            'gl_account': f'{alias}."GL Account Number"',
            'company_code': f'{alias}."Company Code"',
            'document_number': f'{alias}."Document Number"',
            'cost_center': f'{alias}."Cost Center Code"',
            'profit_center': f'{alias}."Division Code"',
            'posting_key': f'{alias}."Posting Date"',
            'reference': f'{alias}."Document Type"'
        }


class CustomerRefs:
    """Customer dimension table column references"""

    def __init__(self, alias: str = 'c'):
        self.alias = alias
        self.refs = {
            'id': f'{alias}."Customer Key"',
            'name': f'{alias}."Customer Name"',
            'type': f'{alias}."Customer Type"',
            'region': f'{alias}."Customer State/Prov"',
            'category': f'{alias}."Customer Category Hrchy Code"',
            'segment': f'{alias}."Customer Segment"'
        }


class ItemRefs:
    """Item dimension table column references"""

    def __init__(self, alias: str = 'i'):
        self.alias = alias
        self.refs = {
            'id': f'{alias}."Item Key"',
            'number': f'{alias}."Item Number"',
            'description': f'{alias}."Item Description"',
            'category': f'{alias}."Item Category Desc"',
            'subcategory': f'{alias}."Item SubCategory Desc"',
            'family': f'{alias}."Item Family Desc"'
        }


class RevenueForecastSchema:
    """Schema configuration for Revenue Forecast domain"""

    def __init__(self):
        # Table names
        self.TABLES = {
            'gl_transaction': 'dbo_F_GL_Transaction',
            'customer': 'dbo_D_Customer',
            'item': 'dbo_D_Item',
            'transaction': 'dbo_F_Sales_Transaction'
        }

        # Table aliases
        self.ALIASES = {
            'gl_transaction': 't',
            'customer': 'c',
            'item': 'i',
            'transaction': 'st'
        }

        # Column references with aliases
        self.GL_TRANSACTION = GLAccountRefs(self.ALIASES['gl_transaction'])
        self.CUSTOMER = CustomerRefs(self.ALIASES['customer'])
        self.ITEM = ItemRefs(self.ALIASES['item'])

        # GL Account prefixes for revenue classification
        self.REVENUE_ACCOUNTS = {
            'product_revenue': ['41'],  # Product sales
            'service_revenue': ['42'],  # Service revenue
            'other_revenue': ['43', '44', '45'],  # Other revenue streams
            'cogs': ['51', '52'],  # Cost of goods sold
            'operating_expenses': ['61', '62', '63', '64', '65', '66'],  # OpEx
            'depreciation': ['67', '68'],  # D&A
            'interest': ['71', '72'],  # Interest expense/income
            'tax': ['81', '82']  # Tax expense
        }

    def get_revenue_filter(self) -> str:
        """Get SQL filter for revenue accounts"""
        all_revenue = self.REVENUE_ACCOUNTS['product_revenue'] + \
                     self.REVENUE_ACCOUNTS['service_revenue'] + \
                     self.REVENUE_ACCOUNTS['other_revenue']
        prefixes = "', '".join(all_revenue)
        return f"substr({self.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('{prefixes}')"

    def get_cogs_filter(self) -> str:
        """Get SQL filter for COGS accounts"""
        prefixes = "', '".join(self.REVENUE_ACCOUNTS['cogs'])
        return f"substr({self.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('{prefixes}')"

    def get_opex_filter(self) -> str:
        """Get SQL filter for operating expense accounts"""
        prefixes = "', '".join(self.REVENUE_ACCOUNTS['operating_expenses'])
        return f"substr({self.GL_TRANSACTION.refs['gl_account']}, 1, 2) IN ('{prefixes}')"
