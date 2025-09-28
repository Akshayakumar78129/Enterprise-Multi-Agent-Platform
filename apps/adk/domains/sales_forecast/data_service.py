"""Data service for sales forecast analysis"""

import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from database.connection import DatabaseConnection
from database.filter_engine import FilterEngine
from .schema import SalesForecastSchema
import logging

logger = logging.getLogger(__name__)


class SalesForecastDataService:
    """Data service for sales forecast analysis"""

    def __init__(self):
        self.schema = SalesForecastSchema()
        self.filter_engine = FilterEngine()
        self.db = DatabaseConnection()

    async def get_historical_data(self, filters: Dict[str, Any] = {}) -> pd.DataFrame:
        """Get historical sales data for forecasting"""
        try:
            base_query = self.schema.build_time_series_query()
            
            # Apply filters
            where_clause, params = self.filter_engine.build_where_clause(filters, self.schema)
            
            if where_clause:
                query = f"{base_query} WHERE {where_clause}"
            else:
                query = base_query
            
            query += " GROUP BY DATE(t.[Txn Date]) ORDER BY DATE(t.[Txn Date])"
            
            logger.info(f"Executing historical data query: {query[:200]}...")
            
            result = await self.db.execute_query(query, params)
            
            if not result:
                logger.warning("No historical data found")
                return pd.DataFrame()
            
            df = pd.DataFrame(result)
            logger.info(f"Retrieved {len(df)} days of historical data")
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching historical data: {str(e)}")
            raise

    async def get_time_series_features(self, filters: Dict[str, Any] = {}) -> pd.DataFrame:
        """Get time series data with additional features for forecasting"""
        try:
            query = f"""
            SELECT
                DATE(t.[Txn Date]) as date,
                SUM(t.[Net Sales Amount]) as revenue,
                SUM(t.[Net Sales Quantity]) as quantity,
                COUNT(DISTINCT t.[Customer Key]) as customers,
                COUNT(*) as transactions,
                AVG(t.[Net Sales Amount]) as avg_transaction_value,
                tm.[Month] as month,
                tm.[Quarter] as quarter,
                tm.[Year] as year,
                tm.[Week] as week
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            LEFT JOIN {self.schema.TABLES['time']} {self.schema.ALIASES['time']}
                ON {self.schema.TRANSACTION.refs['time_key']} = {self.schema.TIME.refs['key']}
            """
            
            # Apply filters
            where_clause, params = self.filter_engine.build_where_clause(filters, self.schema)
            
            if where_clause:
                query += f" WHERE {where_clause}"
            
            query += """
            GROUP BY DATE(t.[Txn Date]), tm.[Month], tm.[Quarter], tm.[Year], tm.[Week]
            ORDER BY DATE(t.[Txn Date])
            """
            
            logger.info(f"Executing time series features query")
            
            result = await self.db.execute_query(query, params)
            
            if not result:
                return pd.DataFrame()
            
            df = pd.DataFrame(result)
            
            # Convert date column to datetime
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                
                # Add additional time features
                df['day_of_week'] = df['date'].dt.dayofweek
                df['day_of_month'] = df['date'].dt.day
                df['day_of_year'] = df['date'].dt.dayofyear
                df['is_weekend'] = df['day_of_week'].isin([5, 6])
                df['is_month_start'] = df['date'].dt.is_month_start
                df['is_month_end'] = df['date'].dt.is_month_end
            
            logger.info(f"Generated time series features for {len(df)} records")
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching time series features: {str(e)}")
            raise

    async def get_seasonal_patterns(self, filters: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Analyze seasonal patterns in sales data"""
        try:
            query = f"""
            SELECT
                tm.[Month] as month,
                tm.[Quarter] as quarter,
                AVG(t.[Net Sales Amount]) as avg_revenue,
                STDDEV(t.[Net Sales Amount]) as revenue_std,
                SUM(t.[Net Sales Amount]) as total_revenue,
                COUNT(*) as transaction_count
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            LEFT JOIN {self.schema.TABLES['time']} {self.schema.ALIASES['time']}
                ON {self.schema.TRANSACTION.refs['time_key']} = {self.schema.TIME.refs['key']}
            """
            
            # Apply filters
            where_clause, params = self.filter_engine.build_where_clause(filters, self.schema)
            
            if where_clause:
                query += f" WHERE {where_clause}"
            
            query += """
            GROUP BY tm.[Month], tm.[Quarter]
            ORDER BY tm.[Month]
            """
            
            result = await self.db.execute_query(query, params)
            
            if not result:
                return {}
            
            df = pd.DataFrame(result)
            
            # Calculate seasonal indices
            overall_avg = df['avg_revenue'].mean()
            seasonal_data = {
                'monthly': {},
                'quarterly': {},
                'overall_average': float(overall_avg)
            }
            
            # Monthly patterns
            for _, row in df.iterrows():
                month = int(row['month'])
                seasonal_data['monthly'][month] = {
                    'avg_revenue': float(row['avg_revenue']),
                    'seasonal_index': float(row['avg_revenue'] / overall_avg),
                    'volatility': float(row['revenue_std'] or 0),
                    'total_revenue': float(row['total_revenue']),
                    'transaction_count': int(row['transaction_count'])
                }
            
            # Quarterly patterns
            quarterly_df = df.groupby('quarter').agg({
                'avg_revenue': 'mean',
                'total_revenue': 'sum',
                'transaction_count': 'sum'
            }).reset_index()
            
            for _, row in quarterly_df.iterrows():
                quarter = int(row['quarter'])
                seasonal_data['quarterly'][quarter] = {
                    'avg_revenue': float(row['avg_revenue']),
                    'seasonal_index': float(row['avg_revenue'] / overall_avg),
                    'total_revenue': float(row['total_revenue']),
                    'transaction_count': int(row['transaction_count'])
                }
            
            return seasonal_data
            
        except Exception as e:
            logger.error(f"Error analyzing seasonal patterns: {str(e)}")
            raise

    async def get_forecast_baseline(self, filters: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Get baseline metrics for forecast comparison"""
        try:
            # Get recent performance data
            query = f"""
            SELECT
                COUNT(*) as total_transactions,
                SUM(t.[Net Sales Amount]) as total_revenue,
                AVG(t.[Net Sales Amount]) as avg_revenue,
                STDDEV(t.[Net Sales Amount]) as revenue_std,
                COUNT(DISTINCT t.[Customer Key]) as unique_customers,
                MIN(t.[Txn Date]) as start_date,
                MAX(t.[Txn Date]) as end_date
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            """
            
            # Apply filters
            where_clause, params = self.filter_engine.build_where_clause(filters, self.schema)
            
            if where_clause:
                query += f" WHERE {where_clause}"
            
            result = await self.db.execute_query(query, params)
            
            if not result or not result[0]:
                return {}
            
            data = result[0]
            
            # Calculate additional metrics
            total_days = (pd.to_datetime(data[6]) - pd.to_datetime(data[5])).days + 1
            daily_avg_revenue = float(data[1]) / total_days if total_days > 0 else 0
            
            baseline = {
                'total_transactions': int(data[0] or 0),
                'total_revenue': float(data[1] or 0),
                'avg_revenue': float(data[2] or 0),
                'revenue_std': float(data[3] or 0),
                'unique_customers': int(data[4] or 0),
                'total_days': total_days,
                'daily_avg_revenue': daily_avg_revenue,
                'start_date': str(data[5]) if data[5] else None,
                'end_date': str(data[6]) if data[6] else None
            }
            
            return baseline
            
        except Exception as e:
            logger.error(f"Error getting forecast baseline: {str(e)}")
            raise

    async def get_product_forecast_data(self, filters: Dict[str, Any] = {}) -> pd.DataFrame:
        """Get product-level data for forecasting"""
        try:
            query = f"""
            SELECT
                DATE(t.[Txn Date]) as date,
                i.[Item Category Desc] as category,
                i.[Item Desc] as product_name,
                SUM(t.[Net Sales Amount]) as revenue,
                SUM(t.[Net Sales Quantity]) as quantity,
                COUNT(*) as transactions
            FROM {self.schema.TABLES['transaction']} {self.schema.ALIASES['transaction']}
            LEFT JOIN {self.schema.TABLES['item']} {self.schema.ALIASES['item']}
                ON {self.schema.TRANSACTION.refs['item_key']} = {self.schema.ITEM.refs['key']}
            """
            
            # Apply filters
            where_clause, params = self.filter_engine.build_where_clause(filters, self.schema)
            
            if where_clause:
                query += f" WHERE {where_clause}"
            
            query += """
            GROUP BY DATE(t.[Txn Date]), i.[Item Category Desc], i.[Item Desc]
            ORDER BY DATE(t.[Txn Date]), i.[Item Category Desc]
            """
            
            result = await self.db.execute_query(query, params)
            
            if not result:
                return pd.DataFrame()
            
            df = pd.DataFrame(result)
            
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching product forecast data: {str(e)}")
            raise
