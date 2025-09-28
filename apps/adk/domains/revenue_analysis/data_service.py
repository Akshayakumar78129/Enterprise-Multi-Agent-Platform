"""Data service for revenue analysis"""

import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import RevenueAnalysisSchema
import logging

logger = logging.getLogger(__name__)

class RevenueAnalysisDataService:
    """Data service for revenue analysis"""

    def __init__(self):
        self.schema = RevenueAnalysisSchema()
        self.filter_engine = FilterEngine()
        self.db = DatabaseConnection()

    async def get_revenue_summary(self, filters: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Get revenue summary data"""
        try:
            query = self.schema.build_revenue_summary_query()
            where_clause, params = self.filter_engine.build_where_clause(filters, self.schema)
            
            if where_clause:
                query += f" WHERE {where_clause}"
            
            result = await self.db.execute_query(query, params)
            
            if not result or not result[0]:
                return {}
            
            data = result[0]
            return {
                'total_revenue': float(data[0] or 0),
                'total_transactions': int(data[1] or 0),
                'avg_transaction_value': float(data[2] or 0),
                'unique_customers': int(data[3] or 0),
                'start_date': str(data[4]) if data[4] else None,
                'end_date': str(data[5]) if data[5] else None
            }
            
        except Exception as e:
            logger.error(f"Error fetching revenue summary: {str(e)}")
            raise

    async def get_revenue_breakdown(self, filters: Dict[str, Any] = {}) -> List[Dict[str, Any]]:
        """Get revenue breakdown by category/segment"""
        try:
            query = self.schema.build_revenue_breakdown_query()
            where_clause, params = self.filter_engine.build_where_clause(filters, self.schema)
            
            if where_clause:
                query += f" WHERE {where_clause}"
            
            query += " GROUP BY i.[Item Category Desc], c.[Customer Segment], r.[Sales Org Hrchy L1 Name]"
            
            result = await self.db.execute_query(query, params)
            
            if not result:
                return []
            
            breakdown = []
            for row in result:
                breakdown.append({
                    'category': str(row[0]) if row[0] else 'Unknown',
                    'segment': str(row[1]) if row[1] else 'Unknown',
                    'region': str(row[2]) if row[2] else 'Unknown',
                    'revenue': float(row[3] or 0),
                    'transaction_count': int(row[4] or 0),
                    'avg_value': float(row[5] or 0)
                })
            
            return breakdown
            
        except Exception as e:
            logger.error(f"Error fetching revenue breakdown: {str(e)}")
            raise
