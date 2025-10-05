"""Filter engine for applying query filters - Port of Express filterEngine.ts"""

from typing import Dict, Tuple, List, Any
from datetime import datetime, timedelta


class FilterEngine:
    """Port of Express filter engine for SQL query filtering"""

    def apply_filters(self, query: str, filters: Dict[str, Any], schema: Any) -> Tuple[str, List[Any]]:
        """Apply filters to SQL query

        Args:
            query: Base SQL query
            filters: Filter dictionary from API
            schema: Schema object with table/column references

        Returns:
            Tuple of (modified query, parameters list)
        """
        # Initialize empty filters dict if None
        if filters is None:
            filters = {}

        where_clauses = []
        params = []

        # Check if the query includes the transaction table
        has_transaction_table = False
        if hasattr(schema, 'TABLES') and 'transaction' in schema.TABLES:
            # Check if the transaction table or its alias is in the query
            transaction_table = schema.TABLES['transaction']
            transaction_alias = schema.ALIASES.get('transaction', 't')
            if transaction_table in query or f" {transaction_alias}." in query or f"[{transaction_alias}]." in query:
                has_transaction_table = True

        # Check for date filters in various formats
        date_from = filters.get('dateFrom') or filters.get('datefrom') or filters.get('date_from')
        date_to = filters.get('dateTo') or filters.get('dateto') or filters.get('date_to')

        # Date range filters - DEFAULT TO 2021 if no dates provided
        if has_transaction_table:
            date_field = schema.TRANSACTION.refs.get('date', schema.TRANSACTION.refs.get('txn_date'))
            if date_field:
                # DEFAULT TO 2021 if no date filters provided
                if not date_from and not date_to and not filters.get('timeRange'):
                    date_from = '2021-01-01'
                    date_to = '2021-12-31'

                if date_from and date_to:
                    # Since dates are stored as YYYY-MM-DD strings, use direct string comparison
                    where_clauses.append(f"{date_field} >= ?")
                    params.append(date_from)
                    where_clauses.append(f"{date_field} <= ?")
                    params.append(date_to)

        # Time range filter (7d, 30d, 90d)
        if has_transaction_table and filters.get('timeRange') and not (date_from and date_to):
            # Only process timeRange if we don't already have explicit date filters
            days_map = {
                '7d': 7,
                '30d': 30,
                '90d': 90
            }
            days = days_map.get(filters['timeRange'])
            if days:
                # Use end of 2021 data as reference instead of current date
                # Since our data ends at 2021-12-31, calculate from there
                # Use 'txn_date' if 'date' doesn't exist in schema
                date_field = schema.TRANSACTION.refs.get('date', schema.TRANSACTION.refs.get('txn_date'))
                if date_field:
                    where_clauses.append(f"{date_field} >= date('2021-12-31', '-{days} days')")
                    where_clauses.append(f"{date_field} <= '2021-12-31'")

        # Segment filter - handle single value or array
        if filters.get('segment'):
            where_clauses.append(f"{schema.CUSTOMER.refs['type']} = ?")
            params.append(filters['segment'])
        elif filters.get('segments'):
            segments = filters['segments'] if isinstance(filters['segments'], list) else [filters['segments']]
            if segments:
                placeholders = ','.join(['?' for _ in segments])
                where_clauses.append(f"{schema.CUSTOMER.refs['type']} IN ({placeholders})")
                params.extend(segments)

        # Category filters - support both category and categories
        categories = filters.get('categories') or filters.get('category')
        if categories:
            if not isinstance(categories, list):
                categories = [categories]
            if categories and hasattr(schema, 'ITEM') and hasattr(schema.ITEM, 'refs'):
                category_field = schema.ITEM.refs.get('category')
                if category_field:
                    placeholders = ','.join(['?' for _ in categories])
                    where_clauses.append(f"{category_field} IN ({placeholders})")
                    params.extend(categories)

        # Subcategory filters - support both subcategory and subcategories
        subcategories = filters.get('subcategories') or filters.get('subcategory')
        if subcategories:
            if not isinstance(subcategories, list):
                subcategories = [subcategories]
            if subcategories and hasattr(schema, 'ITEM') and hasattr(schema.ITEM, 'refs'):
                subcategory_field = schema.ITEM.refs.get('subcategory')
                if subcategory_field:
                    placeholders = ','.join(['?' for _ in subcategories])
                    where_clauses.append(f"{subcategory_field} IN ({placeholders})")
                    params.extend(subcategories)

        # Product filters - support both product and products
        products = filters.get('products') or filters.get('product')
        if products:
            if not isinstance(products, list):
                products = [products]
            if products and hasattr(schema, 'ITEM') and hasattr(schema.ITEM, 'refs'):
                product_field = schema.ITEM.refs.get('desc') or schema.ITEM.refs.get('name')
                if product_field:
                    placeholders = ','.join(['?' for _ in products])
                    where_clauses.append(f"{product_field} IN ({placeholders})")
                    params.extend(products)

        # Region filters - support both region and regions
        regions = filters.get('regions') or filters.get('region')
        if regions:
            if not isinstance(regions, list):
                regions = [regions]
            if regions and hasattr(schema, 'REGION') and hasattr(schema.REGION, 'refs'):
                region_field = schema.REGION.refs.get('name')
                if region_field:
                    placeholders = ','.join(['?' for _ in regions])
                    where_clauses.append(f"{region_field} IN ({placeholders})")
                    params.extend(regions)

        # Customer filters - support both customer and customers
        customers = filters.get('customers') or filters.get('customer')
        if customers:
            if not isinstance(customers, list):
                customers = [customers]
            if customers and hasattr(schema, 'CUSTOMER') and hasattr(schema.CUSTOMER, 'refs'):
                customer_field = schema.CUSTOMER.refs.get('name')
                if customer_field:
                    placeholders = ','.join(['?' for _ in customers])
                    where_clauses.append(f"{customer_field} IN ({placeholders})")
                    params.extend(customers)

        # Margin filters - requires SALES schema with margin calculation support
        min_margin = filters.get('minMargin') or filters.get('min_margin')
        max_margin = filters.get('maxMargin') or filters.get('max_margin')
        if (min_margin is not None or max_margin is not None) and hasattr(schema, 'SALES'):
            # Note: Margin filtering requires the query to already have margin calculated
            # This is typically done in the SELECT clause as: (amount - cost) / amount * 100
            # We add a HAVING clause if the query has GROUP BY, otherwise WHERE
            if min_margin is not None:
                # Check if query has GROUP BY to determine if we should use HAVING
                margin_condition = f"((SUM({schema.SALES.refs.get('amount', 'amount')}) - SUM({schema.SALES.refs.get('quantity', 'quantity')} * {schema.SALES.refs.get('unit_cost', 'unit_cost')})) / NULLIF(SUM({schema.SALES.refs.get('amount', 'amount')}), 0) * 100) >= ?"
                where_clauses.append(margin_condition)
                params.append(min_margin)
            if max_margin is not None:
                margin_condition = f"((SUM({schema.SALES.refs.get('amount', 'amount')}) - SUM({schema.SALES.refs.get('quantity', 'quantity')} * {schema.SALES.refs.get('unit_cost', 'unit_cost')})) / NULLIF(SUM({schema.SALES.refs.get('amount', 'amount')}), 0) * 100) <= ?"
                where_clauses.append(margin_condition)
                params.append(max_margin)

        # Revenue filters
        min_revenue = filters.get('minRevenue') or filters.get('min_revenue')
        max_revenue = filters.get('maxRevenue') or filters.get('max_revenue')
        if has_transaction_table and (min_revenue is not None or max_revenue is not None):
            # Note: Revenue filtering on aggregated data requires special handling
            # For row-level filtering, we can use the amount field directly
            amount_field = None
            if hasattr(schema, 'TRANSACTION') and hasattr(schema.TRANSACTION, 'refs'):
                amount_field = schema.TRANSACTION.refs.get('amount')
            elif hasattr(schema, 'SALES') and hasattr(schema.SALES, 'refs'):
                amount_field = schema.SALES.refs.get('amount')

            if amount_field:
                if min_revenue is not None:
                    where_clauses.append(f"{amount_field} >= ?")
                    params.append(min_revenue)
                if max_revenue is not None:
                    where_clauses.append(f"{amount_field} <= ?")
                    params.append(max_revenue)

        # Product categories filter - based on customer behavior patterns
        # Note: Since product categories are derived from customer behavior rather than
        # stored directly, this filter would need to be applied at the application level
        # after retrieving customers and calculating their categories
        # For now, we skip SQL-level filtering for productCategories
        # The application layer will handle this using the category determination logic

        # Risk level to loyalty status mapping (from Express) - handle arrays
        risk_levels = []
        if filters.get('riskLevel'):
            risk_levels = [filters['riskLevel']]
        elif filters.get('riskLevels'):
            risk_levels = filters['riskLevels'] if isinstance(filters['riskLevels'], list) else [filters['riskLevels']]

        if risk_levels:
            risk_to_loyalty_map = {
                'Low': ['Active', 'Active, Loyal', 'Active, New'],
                'Medium': ['Prospect'],
                'High': ['Inactive'],
                'Very High': ['Lost']
            }

            # Combine loyalty statuses for all selected risk levels
            all_loyalty_statuses = []
            for risk_level in risk_levels:
                loyalty_statuses = risk_to_loyalty_map.get(risk_level, [])
                all_loyalty_statuses.extend(loyalty_statuses)

            if all_loyalty_statuses:
                # Remove duplicates
                all_loyalty_statuses = list(set(all_loyalty_statuses))
                placeholders = ','.join(['?' for _ in all_loyalty_statuses])
                where_clauses.append(f"{schema.LOYALTY.refs['loyalty_status']} IN ({placeholders})")
                params.extend(all_loyalty_statuses)

        # Build final query
        if where_clauses:
            # Check if query already has WHERE clause
            has_where = 'where' in query.lower()
            filter_clause = ' AND '.join(where_clauses)

            if has_where:
                query += f" AND {filter_clause}"
            else:
                query += f" WHERE {filter_clause}"

        return query, params

    def translate_filters(self, express_filters: Dict[str, Any]) -> Dict[str, Any]:
        """Translate Express-style filters to Python implementation

        Args:
            express_filters: Filters from frontend/Express format

        Returns:
            Dictionary with Python-compatible filter format
        """
        python_filters = {}

        # Date range handling
        if express_filters.get('dateFrom') and express_filters.get('dateTo'):
            date_from = datetime.fromisoformat(express_filters['dateFrom'])
            date_to = datetime.fromisoformat(express_filters['dateTo'])
            days_diff = (date_to - date_from).days

            python_filters['lookback_days'] = days_diff
            python_filters['date_from'] = express_filters['dateFrom']
            python_filters['date_to'] = express_filters['dateTo']

        # Time range (30d, 90d)
        elif express_filters.get('timeRange'):
            time_map = {
                '30d': 30,
                '90d': 90
            }
            python_filters['lookback_days'] = time_map.get(express_filters['timeRange'], 30)

        # Default lookback
        else:
            python_filters['lookback_days'] = 90

        # Segment filter
        if express_filters.get('segment'):
            python_filters['segment_id'] = express_filters['segment']

        # Risk level (for reference, not used in data queries)
        if express_filters.get('riskLevel'):
            python_filters['risk_level'] = express_filters['riskLevel']

        # Search term
        if express_filters.get('search'):
            python_filters['search'] = express_filters['search']

        return python_filters