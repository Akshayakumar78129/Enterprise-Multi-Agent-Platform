"""Data service for slow moving stock - SQL queries only"""

from typing import Dict, List, Any
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import SlowMovingStockSchema


class SlowMovingStockDataService:
    """Data service for slow moving stock analysis"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = SlowMovingStockSchema()
        self.filter_engine = FilterEngine()

    async def get_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get slow moving stock KPIs"""

        # Extract category filter
        filters_copy = filters.copy()
        categories = filters_copy.pop('category', None) or []

        # Build category filter for Item Number patterns
        category_filter = ""
        if categories and len(categories) > 0:
            category_conditions = []
            if "Bikes" in categories:
                category_conditions.append('t."Item Number" LIKE \'M-%\'')
            if "Racks" in categories:
                category_conditions.append('t."Item Number" LIKE \'R-%\'')
            if "Cargo" in categories:
                category_conditions.append('t."Item Number" LIKE \'CT-%\'')
            if "Other" in categories:
                category_conditions.append('(t."Item Number" NOT LIKE \'M-%\' AND t."Item Number" NOT LIKE \'R-%\' AND t."Item Number" NOT LIKE \'CT-%\')')

            if category_conditions:
                category_filter = " AND (" + " OR ".join(category_conditions) + ")"

        sql = f"""
        WITH StockMetrics AS (
            SELECT
                t."Item Number" as item,
                COUNT(DISTINCT t."Txn Date") as sale_days,
                SUM(t."Net Sales Quantity") as total_quantity,
                SUM(t."Net Sales Amount") as total_value,
                MAX(t."Txn Date") as last_sale_date,
                MIN(t."Txn Date") as first_sale_date,
                COUNT(*) as transaction_count
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1{category_filter}
            GROUP BY t."Item Number"
        ),
        DateRange AS (
            SELECT
                MIN(t."Txn Date") as min_date,
                MAX(t."Txn Date") as max_date,
                JULIANDAY(MAX(t."Txn Date")) - JULIANDAY(MIN(t."Txn Date")) as total_days
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
        )
        SELECT
            COUNT(DISTINCT sm.item) as total_items,
            SUM(sm.total_value) as total_inventory_value,
            AVG(CAST(sm.sale_days AS FLOAT) / NULLIF(dr.total_days, 0) * 365) as avg_turnover_rate,
            AVG(JULIANDAY(dr.max_date) - JULIANDAY(sm.last_sale_date)) as avg_days_since_last_sale,
            SUM(CASE WHEN CAST(sm.sale_days AS FLOAT) / NULLIF(dr.total_days, 0) * 365 < 2 THEN 1 ELSE 0 END) as slow_moving_items,
            SUM(CASE WHEN JULIANDAY(dr.max_date) - JULIANDAY(sm.last_sale_date) > 90 THEN sm.total_value ELSE 0 END) as carrying_cost
        FROM StockMetrics sm
        CROSS JOIN DateRange dr
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            row = result[0]
            return {
                'totalItems': row.get('total_items', 0) or 0,
                'totalInventoryValue': row.get('total_inventory_value', 0) or 0,
                'avgTurnoverRate': row.get('avg_turnover_rate', 0) or 0,
                'avgDaysSinceLastSale': row.get('avg_days_since_last_sale', 0) or 0,
                'slowMovingItems': row.get('slow_moving_items', 0) or 0,
                'carryingCost': row.get('carrying_cost', 0) or 0
            }

        return {
            'totalItems': 0,
            'totalInventoryValue': 0,
            'avgTurnoverRate': 0,
            'avgDaysSinceLastSale': 0,
            'slowMovingItems': 0,
            'carryingCost': 0
        }

    async def get_slow_moving_items(self, filters: Dict[str, Any] = {}, limit: int = 100) -> List[Dict]:
        """Get slow moving items with turnover rate < threshold"""

        # Extract turnover threshold and category filters
        filters_copy = filters.copy()
        turnover_threshold = filters_copy.pop('turnoverThreshold', None) or 30.0  # Default: < 30 turns/year
        categories = filters_copy.pop('category', None) or []

        # Build category filter for Item Number patterns
        category_filter = ""
        if categories and len(categories) > 0:
            category_conditions = []
            if "Bikes" in categories:
                category_conditions.append('t."Item Number" LIKE \'M-%\'')
            if "Racks" in categories:
                category_conditions.append('t."Item Number" LIKE \'R-%\'')
            if "Cargo" in categories:
                category_conditions.append('t."Item Number" LIKE \'CT-%\'')
            if "Other" in categories:
                category_conditions.append('(t."Item Number" NOT LIKE \'M-%\' AND t."Item Number" NOT LIKE \'R-%\' AND t."Item Number" NOT LIKE \'CT-%\')')

            if category_conditions:
                category_filter = " AND (" + " OR ".join(category_conditions) + ")"

        sql = f"""
        WITH DateRange AS (
            SELECT
                MIN(t."Txn Date") as min_date,
                MAX(t."Txn Date") as max_date,
                JULIANDAY(MAX(t."Txn Date")) - JULIANDAY(MIN(t."Txn Date")) as total_days
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
        ),
        StockMetrics AS (
            SELECT
                t."Item Number" as item_name,
                CASE
                    WHEN t."Item Number" LIKE 'M-%' THEN 'Bikes'
                    WHEN t."Item Number" LIKE 'R-%' THEN 'Racks'
                    WHEN t."Item Number" LIKE 'CT-%' THEN 'Cargo'
                    ELSE 'Other'
                END as category,
                COUNT(DISTINCT t."Txn Date") as sale_days,
                SUM(t."Net Sales Quantity") as total_quantity,
                SUM(t."Net Sales Amount") as total_value,
                MAX(t."Txn Date") as last_sale_date,
                MIN(t."Txn Date") as first_sale_date,
                COUNT(*) as transaction_count,
                dr.max_date,
                dr.total_days
            FROM "dbo_F_Sales_Transaction" t
            CROSS JOIN DateRange dr
            WHERE 1=1{category_filter}
            GROUP BY t."Item Number", dr.max_date, dr.total_days
        )
        SELECT
            item_name,
            category,
            total_quantity as current_stock,
            total_value as stock_value,
            CAST(sale_days AS FLOAT) / NULLIF(total_days, 0) * 365 as turnover_rate,
            JULIANDAY(max_date) - JULIANDAY(last_sale_date) as days_since_last_sale,
            last_sale_date,
            transaction_count
        FROM StockMetrics
        WHERE CAST(sale_days AS FLOAT) / NULLIF(total_days, 0) * 365 < {turnover_threshold}
        ORDER BY turnover_rate ASC, stock_value DESC
        LIMIT {limit}
        """

        query, params = self.filter_engine.apply_filters(sql, filters_copy, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'itemName': row.get('item_name', 'Unknown'),
            'category': row.get('category') or 'Uncategorized',
            'currentStock': int(row.get('current_stock', 0) or 0),
            'stockValue': row.get('stock_value', 0) or 0,
            'turnoverRate': round(row.get('turnover_rate', 0) or 0, 2),
            'daysSinceLastSale': int(row.get('days_since_last_sale', 0) or 0),
            'lastSaleDate': str(row.get('last_sale_date', '')),
            'transactionCount': row.get('transaction_count', 0) or 0
        } for row in result]

    async def get_turnover_distribution(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get distribution of items by turnover rate"""

        # Extract category filter
        filters_copy = filters.copy()
        categories = filters_copy.pop('category', None) or []

        # Build category filter for Item Number patterns
        category_filter = ""
        if categories and len(categories) > 0:
            category_conditions = []
            if "Bikes" in categories:
                category_conditions.append('t."Item Number" LIKE \'M-%\'')
            if "Racks" in categories:
                category_conditions.append('t."Item Number" LIKE \'R-%\'')
            if "Cargo" in categories:
                category_conditions.append('t."Item Number" LIKE \'CT-%\'')
            if "Other" in categories:
                category_conditions.append('(t."Item Number" NOT LIKE \'M-%\' AND t."Item Number" NOT LIKE \'R-%\' AND t."Item Number" NOT LIKE \'CT-%\')')

            if category_conditions:
                category_filter = " AND (" + " OR ".join(category_conditions) + ")"

        sql = f"""
        WITH DateRange AS (
            SELECT
                MIN(t."Txn Date") as min_date,
                MAX(t."Txn Date") as max_date,
                JULIANDAY(MAX(t."Txn Date")) - JULIANDAY(MIN(t."Txn Date")) as total_days
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
        ),
        StockMetrics AS (
            SELECT
                t."Item Number" as item,
                COUNT(DISTINCT t."Txn Date") as sale_days,
                SUM(t."Net Sales Amount") as total_value,
                dr.total_days
            FROM "dbo_F_Sales_Transaction" t
            CROSS JOIN DateRange dr
            WHERE 1=1{category_filter}
            GROUP BY t."Item Number", dr.total_days
        ),
        TurnoverCategories AS (
            SELECT
                CASE
                    WHEN CAST(sale_days AS FLOAT) / NULLIF(total_days, 0) * 365 >= 50 THEN 'Very Fast (50+ turns/year)'
                    WHEN CAST(sale_days AS FLOAT) / NULLIF(total_days, 0) * 365 >= 20 THEN 'Fast (20-50 turns/year)'
                    WHEN CAST(sale_days AS FLOAT) / NULLIF(total_days, 0) * 365 >= 10 THEN 'Medium (10-20 turns/year)'
                    ELSE 'Slow (<10 turns/year)'
                END as category,
                item,
                total_value
            FROM StockMetrics
        )
        SELECT
            category,
            COUNT(DISTINCT item) as item_count,
            SUM(total_value) as total_value
        FROM TurnoverCategories
        GROUP BY category
        ORDER BY
            CASE category
                WHEN 'Very Fast (50+ turns/year)' THEN 1
                WHEN 'Fast (20-50 turns/year)' THEN 2
                WHEN 'Medium (10-20 turns/year)' THEN 3
                ELSE 4
            END
        """

        query, params = self.filter_engine.apply_filters(sql, filters_copy, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'category': row.get('category', 'Uncategorized'),
            'itemCount': row.get('item_count', 0) or 0,
            'totalValue': row.get('total_value', 0) or 0
        } for row in result]

    async def get_aging_analysis(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get stock aging analysis - days since last sale"""

        # Extract category filter
        filters_copy = filters.copy()
        categories = filters_copy.pop('category', None) or []

        # Build category filter for Item Number patterns
        category_filter = ""
        if categories and len(categories) > 0:
            category_conditions = []
            if "Bikes" in categories:
                category_conditions.append('t."Item Number" LIKE \'M-%\'')
            if "Racks" in categories:
                category_conditions.append('t."Item Number" LIKE \'R-%\'')
            if "Cargo" in categories:
                category_conditions.append('t."Item Number" LIKE \'CT-%\'')
            if "Other" in categories:
                category_conditions.append('(t."Item Number" NOT LIKE \'M-%\' AND t."Item Number" NOT LIKE \'R-%\' AND t."Item Number" NOT LIKE \'CT-%\')')

            if category_conditions:
                category_filter = " AND (" + " OR ".join(category_conditions) + ")"

        sql = f"""
        WITH DateRange AS (
            SELECT MAX(t."Txn Date") as max_date
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
        ),
        StockMetrics AS (
            SELECT
                t."Item Number" as item,
                MAX(t."Txn Date") as last_sale_date,
                SUM(t."Net Sales Amount") as total_value,
                dr.max_date
            FROM "dbo_F_Sales_Transaction" t
            CROSS JOIN DateRange dr
            WHERE 1=1{category_filter}
            GROUP BY t."Item Number", dr.max_date
        ),
        AgingCategories AS (
            SELECT
                CASE
                    WHEN JULIANDAY(max_date) - JULIANDAY(last_sale_date) <= 30 THEN '0-30 days'
                    WHEN JULIANDAY(max_date) - JULIANDAY(last_sale_date) <= 60 THEN '31-60 days'
                    WHEN JULIANDAY(max_date) - JULIANDAY(last_sale_date) <= 90 THEN '61-90 days'
                    WHEN JULIANDAY(max_date) - JULIANDAY(last_sale_date) <= 180 THEN '91-180 days'
                    ELSE '180+ days'
                END as aging_period,
                item,
                total_value
            FROM StockMetrics
        )
        SELECT
            aging_period,
            COUNT(DISTINCT item) as item_count,
            SUM(total_value) as total_value
        FROM AgingCategories
        GROUP BY aging_period
        ORDER BY
            CASE aging_period
                WHEN '0-30 days' THEN 1
                WHEN '31-60 days' THEN 2
                WHEN '61-90 days' THEN 3
                WHEN '91-180 days' THEN 4
                ELSE 5
            END
        """

        query, params = self.filter_engine.apply_filters(sql, filters_copy, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'agingPeriod': row.get('aging_period', 'Unknown'),
            'itemCount': row.get('item_count', 0) or 0,
            'totalValue': row.get('total_value', 0) or 0
        } for row in result]

    async def get_category_analysis(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get slow moving analysis by category"""

        # Extract category filter
        filters_copy = filters.copy()
        categories = filters_copy.pop('category', None) or []

        # Build category filter for Item Number patterns
        category_filter = ""
        if categories and len(categories) > 0:
            category_conditions = []
            if "Bikes" in categories:
                category_conditions.append('t."Item Number" LIKE \'M-%\'')
            if "Racks" in categories:
                category_conditions.append('t."Item Number" LIKE \'R-%\'')
            if "Cargo" in categories:
                category_conditions.append('t."Item Number" LIKE \'CT-%\'')
            if "Other" in categories:
                category_conditions.append('(t."Item Number" NOT LIKE \'M-%\' AND t."Item Number" NOT LIKE \'R-%\' AND t."Item Number" NOT LIKE \'CT-%\')')

            if category_conditions:
                category_filter = " AND (" + " OR ".join(category_conditions) + ")"

        sql = f"""
        WITH DateRange AS (
            SELECT
                MIN(t."Txn Date") as min_date,
                MAX(t."Txn Date") as max_date,
                JULIANDAY(MAX(t."Txn Date")) - JULIANDAY(MIN(t."Txn Date")) as total_days
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
        ),
        StockMetrics AS (
            SELECT
                CASE
                    WHEN t."Item Number" LIKE 'M-%' THEN 'Bikes'
                    WHEN t."Item Number" LIKE 'R-%' THEN 'Racks'
                    WHEN t."Item Number" LIKE 'CT-%' THEN 'Cargo'
                    ELSE 'Other'
                END as category,
                t."Item Number" as item,
                COUNT(DISTINCT t."Txn Date") as sale_days,
                SUM(t."Net Sales Amount") as total_value,
                dr.total_days
            FROM "dbo_F_Sales_Transaction" t
            CROSS JOIN DateRange dr
            WHERE 1=1{category_filter}
            GROUP BY t."Item Number", dr.total_days
        )
        SELECT
            category,
            COUNT(DISTINCT item) as total_items,
            SUM(CASE WHEN CAST(sale_days AS FLOAT) / NULLIF(total_days, 0) * 365 < 30 THEN 1 ELSE 0 END) as slow_moving_items,
            SUM(total_value) as total_value,
            AVG(CAST(sale_days AS FLOAT) / NULLIF(total_days, 0) * 365) as avg_turnover_rate
        FROM StockMetrics
        GROUP BY category
        ORDER BY slow_moving_items DESC, total_value DESC
        LIMIT 10
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{
            'category': row.get('category') or 'Uncategorized',
            'totalItems': row.get('total_items', 0) or 0,
            'slowMovingItems': row.get('slow_moving_items', 0) or 0,
            'totalValue': row.get('total_value', 0) or 0,
            'avgTurnoverRate': round(row.get('avg_turnover_rate', 0) or 0, 2)
        } for row in result]
