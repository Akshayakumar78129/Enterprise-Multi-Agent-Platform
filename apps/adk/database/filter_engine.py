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
        if not filters or not any(filters.values()):
            return query, []

        where_clauses = []
        params = []

        # Date range filters
        if filters.get('dateFrom') and filters.get('dateTo'):
            where_clauses.append(f"{schema.TRANSACTION.refs['date']} >= ?")
            params.append(filters['dateFrom'])
            where_clauses.append(f"{schema.TRANSACTION.refs['date']} <= ?")
            params.append(filters['dateTo'])

        # Alternative date range format
        elif filters.get('datefrom') and filters.get('dateto'):
            where_clauses.append(f"{schema.TRANSACTION.refs['date']} >= ?")
            params.append(filters['datefrom'])
            where_clauses.append(f"{schema.TRANSACTION.refs['date']} <= ?")
            params.append(filters['dateto'])

        # Time range filter (7d, 30d, 90d)
        elif filters.get('timeRange'):
            # Skip timeRange if we already have date filters
            if not any(k in filters for k in ['dateFrom', 'dateTo', 'datefrom', 'dateto']):
                days_map = {
                    '7d': 7,
                    '30d': 30,
                    '90d': 90
                }
                days = days_map.get(filters['timeRange'])
                if days:
                    # Use actual current date for relative time periods
                    from datetime import datetime, timedelta
                    current_date = datetime.now()
                    start_date = current_date - timedelta(days=days)

                    # Format dates for SQL
                    where_clauses.append(f"{schema.TRANSACTION.refs['date']} >= ?")
                    where_clauses.append(f"{schema.TRANSACTION.refs['date']} <= ?")
                    params.extend([start_date.strftime('%Y-%m-%d'), current_date.strftime('%Y-%m-%d')])

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