"""Data service for demand forecast - SQL queries only"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import DemandForecastSchema


class DemandForecastDataService:
    """Data service for demand forecast analysis"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.schema = DemandForecastSchema()
        self.filter_engine = FilterEngine()

    async def get_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get demand forecast KPIs"""

        sql = """
        WITH MetricsData AS (
            SELECT
                COUNT(DISTINCT t."Item Number") as unique_items,
                COUNT(DISTINCT t."Customer Key") as unique_customers,
                SUM(t."Net Sales Amount") as total_value,
                SUM(t."Net Sales Quantity") as total_quantity,
                AVG(t."Net Sales Amount") as avg_value,
                COUNT(*) as transaction_count
            FROM "dbo_F_Sales_Transaction" t
            WHERE 1=1
        )
        SELECT * FROM MetricsData
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        if result and len(result) > 0:
            row = result[0]
            # Generate domain-specific KPIs based on the data
            kpis = {}
            kpis['forecastAccuracy'] = 95.0  # Placeholder for Forecast accuracy percentage
            kpis['demandVariability'] = 0  # Placeholder for Demand variability coefficient
            kpis['seasonalityIndex'] = 0  # Placeholder for Seasonality index
            kpis['trendDirection'] = 0  # Placeholder for Trend direction indicator
            kpis['confidenceInterval'] = 0  # Placeholder for Forecast confidence interval
            kpis['leadTimeRequirement'] = 7  # Placeholder for Lead time requirement days

            return kpis

        return {kpi: 0 for kpi in ['forecastAccuracy', 'demandVariability', 'seasonalityIndex', 'trendDirection', 'confidenceInterval', 'leadTimeRequirement']}

    async def get_detailed_data(self, filters: Dict[str, Any] = {}, limit: int = 20) -> List[Dict]:
        """Get detailed demand forecast data"""

        sql = f"""
        SELECT
            t."Item Number" as item,
            t."Product Posting Group" as category,
            SUM(t."Net Sales Quantity") as quantity,
            SUM(t."Net Sales Amount") as value,
            COUNT(*) as transactions
        FROM "dbo_F_Sales_Transaction" t
        WHERE 1=1
        GROUP BY t."Item Number", t."Product Posting Group"
        ORDER BY value DESC
        LIMIT {{limit}}
        """

        query, params = self.filter_engine.apply_filters(sql, filters, self.schema)
        result_dict = await self.db.query(query, params)
        result = result_dict.get('rows', [])

        return [{{
            'item': row.get('item', 'Unknown'),
            'category': row.get('category') or 'Unknown',
            'quantity': row.get('quantity', 0) or 0,
            'value': row.get('value', 0) or 0,
            'transactions': row.get('transactions', 0) or 0
        }} for row in result]
