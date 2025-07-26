"""
Sales Trend Analyzer Tool

This tool analyzes sales trends over time, identifying patterns, seasonality, and growth rates.
It can break down trends by various dimensions such as products, categories, channels, or regions.
"""

import sys
import os
from pathlib import Path

# Add the project root to the Python path
import os 
import sys

# Make sure our project root is in the path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
sys.path.insert(0, project_root)

import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Union, Tuple
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import io
import base64

from Sales.database.connection import get_connection
from Sales.database.query_templates import get_latest_date
from Sales.database import config

# Configure logging
logging.basicConfig(level=config.LOGGING['level'])
logger = logging.getLogger(__name__)

class SalesTrendAnalyzer:
    """
    Analyzes sales trends over time, identifying patterns, seasonality, and growth rates.
    """
    
    VALID_TIME_PERIODS = ['daily', 'weekly', 'monthly', 'quarterly', 'annual']
    VALID_METRICS = ['revenue', 'units', 'aov', 'margin']
    VALID_DIMENSIONS = ['product', 'category', 'channel', 'region', 'customer', None]
    
    def __init__(self, time_period: str = 'monthly', metric: str = "revenue", 
                 dimension: Optional[str] = None, top_n: int = 5,
                 filters: Optional[Dict[str, Any]] = None,
                 include_visualization: bool = True,
                 trend_periods: int = 12,
                 db_path: Optional[str] = None):
        """
        Initialize the SalesTrendAnalyzer.
        
        Args:
            time_period: Time period to analyze ('daily', 'weekly', 'monthly', 'quarterly', 'annual')
            metric: Metric to track over time ('revenue', 'units', 'aov', 'margin')
            dimension: Optional dimension to break down trends ('product', 'category', 'channel', 'region', 'customer')
            top_n: For dimension breakdowns, show only the top N performers
            filters: Optional filters to narrow down the analysis
            include_visualization: Whether to include trend visualization
            trend_periods: Number of periods to include in the trend analysis
            db_path: Optional path to the database file
        """
        if time_period not in self.VALID_TIME_PERIODS:
            raise ValueError(f"Invalid time period. Must be one of {self.VALID_TIME_PERIODS}")
        if metric.lower() not in self.VALID_METRICS:
            raise ValueError(f"Invalid metric. Must be one of {self.VALID_METRICS}")
        if dimension not in self.VALID_DIMENSIONS:
            raise ValueError(f"Invalid dimension. Must be one of {self.VALID_DIMENSIONS}")
            
        self.time_period = time_period
        self.metric = metric.lower()
        self.dimension = dimension
        self.top_n = top_n
        self.filters = filters or {}
        self.include_visualization = include_visualization
        self.trend_periods = trend_periods
        self.db_path = db_path or config.DATABASE['path']
        
        logger.info(f"Initialized SalesTrendAnalyzer with time_period={time_period}, metric={metric}, dimension={dimension}, trend_periods={trend_periods}")
    
    def get_available_date_range(self) -> Dict[str, str]:
        """Get the available date range in the database."""
        try:
            conn, wrapper = get_connection()
            
            query = """
                SELECT MIN("Txn Date") as min_date, MAX("Txn Date") as max_date
                FROM "dbo_F_Sales_Transaction"
                WHERE "Deleted Flag" = 0 AND "Excluded Flag" = 0
            """
            
            results = wrapper.fetchall(query)
            if not results:
                return {
                    "status": "error",
                    "message": "No data available in the database"
                }
            
            return {
                "status": "success",
                "min_date": results[0][0],
                "max_date": results[0][1]
            }
            
        except Exception as e:
            logger.error(f"Error getting date range: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
        finally:
            if conn:
                conn.close()
            if wrapper:
                wrapper.close()
    
    def analyze_trends(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze sales trends over time.
        
        Args:
            start_date: Optional start date for analysis (YYYY-MM-DD)
            end_date: Optional end date for analysis (YYYY-MM-DD)
            
        Returns:
            Dictionary containing trend analysis results
        """
        try:
            # Get database connection
            conn, wrapper = get_connection()
            
            # Get date range if not provided
            if not start_date or not end_date:
                date_range = self.get_available_date_range()
                if date_range["status"] == "error":
                    return {
                        "status": "error",
                        "message": date_range["message"]
                    }
                start_date = date_range["min_date"]
                end_date = date_range["max_date"]
            
            # Build and execute query
            query = self._build_query(start_date, end_date)
            
            # Prepare query parameters
            params = [start_date, end_date]
            if self.filters:
                for value in self.filters.values():
                    if isinstance(value, (list, tuple)):
                        params.extend(value)
                    else:
                        params.append(value)
            
            # Execute query
            results = wrapper.fetchall(query, tuple(params))
            if not results:
                return {
                    "status": "error",
                    "message": "No data found for the specified date range"
                }
            
            # Convert results to DataFrame
            columns = ['period', 'revenue', 'units', 'orders']
            if self.dimension:
                columns.extend(['dimension_id', 'dimension_name'])
            
            data = pd.DataFrame(results, columns=columns)
            
            # Analyze based on metric
            if self.metric == 'revenue':
                analysis = self._analyze_revenue(data)
            elif self.metric == 'units':
                analysis = self._analyze_volume(data)
            elif self.metric == 'aov':
                analysis = self._analyze_aov(data)
            else:  # margin
                analysis = self._analyze_margin(data)
            
            # Add visualization if requested
            if self.include_visualization:
                visualization = self._create_trend_visualization(data)
                analysis['visualization'] = visualization
            
            return {
                "status": "success",
                "analysis": analysis,
                "time_period": self.time_period,
                "metric": self.metric,
                "dimension": self.dimension,
                "start_date": start_date,
                "end_date": end_date
            }
            
        except Exception as e:
            logger.error(f"Error analyzing trends: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
        finally:
            if conn:
                conn.close()
            if wrapper:
                wrapper.close()
    
    def _build_query(self, start_date: str, end_date: str) -> str:
        """
        Build SQL query for trend analysis.
        
        Args:
            start_date: Start date for analysis (YYYY-MM-DD)
            end_date: End date for analysis (YYYY-MM-DD)
            
        Returns:
            SQL query string
        """
        time_group = self._get_time_grouping()
        
        # Base query with dimension fields
        dimension_field = None
        if self.dimension:
            dimension_field = {
                'product': ('Item Key', 'Item Number'),
                'category': ('Item Category Hrchy Key', 'Product Posting Group'),
                'channel': ('Sales Organization Key', 'Business Unit Key'),
                'region': ('Customer Geography Hrchy Key', 'Customer Geography Hrchy Key'),
                'customer': ('Customer Key', 'Customer Key')
            }.get(self.dimension)
        
        # Build SELECT clause
        select_clause = [
            f"{time_group} as period",
            'SUM("Net Sales Amount") as revenue',
            'SUM("Net Sales Quantity") as units',
            'COUNT(DISTINCT "Sales Txn Number") as orders'
        ]
        
        if dimension_field:
            select_clause.extend([
                f'"{dimension_field[0]}" as dimension_id',
                f'"{dimension_field[1]}" as dimension_name'
            ])
        
        query = f"""
            SELECT {', '.join(select_clause)}
            FROM "dbo_F_Sales_Transaction"
            WHERE "Txn Date" BETWEEN ? AND ?
                AND "Deleted Flag" = 0
                AND "Excluded Flag" = 0
        """
        
        # Add filters if specified
        if self.filters:
            for field, value in self.filters.items():
                if isinstance(value, (list, tuple)):
                    placeholders = ','.join(['?' for _ in value])
                    query += f' AND "{field}" IN ({placeholders})'
                else:
                    query += f' AND "{field}" = ?'
        
        # Add GROUP BY and ORDER BY
        group_by = [time_group]
        order_by = [time_group]
        
        if dimension_field:
            group_by.extend([f'"{dimension_field[0]}"', f'"{dimension_field[1]}"'])
            order_by.extend([f'"{dimension_field[0]}"'])
        
        query += f"""
            GROUP BY {', '.join(group_by)}
            ORDER BY {', '.join(order_by)}
        """
        
        return query
    
    def _get_time_grouping(self) -> str:
        """Get the SQL time grouping based on the time period."""
        if self.time_period == 'daily':
            return 'date("Txn Date")'
        elif self.time_period == 'weekly':
            return "strftime('%Y-%W', \"Txn Date\")"
        elif self.time_period == 'monthly':
            return "strftime('%Y-%m', \"Txn Date\")"
        elif self.time_period == 'quarterly':
            return "strftime('%Y-Q' || CAST((CAST(strftime('%m', \"Txn Date\") AS INTEGER) + 2) / 3 AS TEXT), \"Txn Date\")"
        else:  # annual
            return "strftime('%Y', \"Txn Date\")"
    
    def _analyze_revenue(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze revenue trends.
        
        Args:
            data: DataFrame containing sales data
            
        Returns:
            Dictionary containing revenue analysis results
        """
        try:
            # Calculate metrics
            total_revenue = data['revenue'].sum()
            avg_daily_revenue = data['revenue'].mean()
            revenue_growth = self._calculate_growth(data['revenue'])
            
            # Calculate top performers if dimension is specified
            top_performers = None
            if self.dimension and 'dimension_id' in data.columns:
                # Group by dimension and calculate total revenue
                dimension_totals = data.groupby(['dimension_id', 'dimension_name'])['revenue'].sum()
                top_performers = [
                    {
                        "id": idx[0],
                        "name": idx[1],
                        "value": val,
                        "share": (val / total_revenue) * 100
                    }
                    for idx, val in dimension_totals.nlargest(self.top_n).items()
                ]
            
            return {
                "status": "success",
                "total_revenue": total_revenue,
                "avg_daily_revenue": avg_daily_revenue,
                "revenue_growth": revenue_growth,
                "top_performers": top_performers
            }
            
        except Exception as e:
            logger.error(f"Error analyzing revenue: {str(e)}")
            raise
    
    def _analyze_volume(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze sales volume trends.
        
        Args:
            data: DataFrame containing sales data
            
        Returns:
            Dictionary containing volume analysis results
        """
        try:
            # Calculate metrics
            total_units = data['units'].sum()
            avg_daily_units = data['units'].mean()
            volume_growth = self._calculate_growth(data['units'])
            
            # Calculate top performers if dimension is specified
            top_performers = None
            if self.dimension:
                top_performers = self._get_top_performers(data, 'units')
            
            return {
                "status": "success",
                "total_units": total_units,
                "avg_daily_units": avg_daily_units,
                "volume_growth": volume_growth,
                "top_performers": top_performers
            }
            
        except Exception as e:
            logger.error(f"Error analyzing volume: {str(e)}")
            raise
    
    def _analyze_aov(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze average order value trends.
        
        Args:
            data: DataFrame containing sales data
            
        Returns:
            Dictionary containing AOV analysis results
        """
        try:
            # Calculate AOV
            data['aov'] = data['revenue'] / data['orders']
            avg_aov = data['aov'].mean()
            aov_growth = self._calculate_growth(data['aov'])
            
            return {
                "status": "success",
                "avg_aov": avg_aov,
                "aov_growth": aov_growth
            }
            
        except Exception as e:
            logger.error(f"Error analyzing AOV: {str(e)}")
            raise
    
    def _analyze_margin(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze margin trends.
        
        Args:
            data: DataFrame containing sales data
            
        Returns:
            Dictionary containing margin analysis results
        """
        try:
            # Calculate margin (assuming we have cost data)
            data['margin'] = data['revenue'] - data['cost']
            data['margin_pct'] = data['margin'] / data['revenue']
            
            avg_margin = data['margin'].mean()
            avg_margin_pct = data['margin_pct'].mean()
            margin_growth = self._calculate_growth(data['margin'])
            
            return {
                "status": "success",
                "avg_margin": avg_margin,
                "avg_margin_pct": avg_margin_pct,
                "margin_growth": margin_growth
            }
            
        except Exception as e:
            logger.error(f"Error analyzing margin: {str(e)}")
            raise
    
    def _calculate_growth(self, series: pd.Series) -> float:
        """
        Calculate growth rate between first and last period.
        
        Args:
            series: Series of values
            
        Returns:
            Growth rate as a percentage
        """
        if len(series) < 2:
            return 0.0
        
        first_value = series.iloc[0]
        last_value = series.iloc[-1]
        
        if first_value == 0:
            return 0.0
        
        return ((last_value - first_value) / first_value) * 100
    
    def _get_top_performers(self, data: pd.DataFrame, metric: str) -> List[Dict[str, Any]]:
        """
        Get top performers for the specified dimension and metric.
        
        Args:
            data: DataFrame containing sales data
            metric: Metric to rank by
            
        Returns:
            List of top performers with their metrics
        """
        if self.dimension == "product":
            group_col = "Item ID"
        elif self.dimension == "region":
            group_col = "Region ID"
        else:
            return []
        
        top_performers = data.groupby(group_col)[metric].sum().nlargest(self.top_n)
        
        return [
            {
                "id": idx,
                "value": val,
                "share": (val / data[metric].sum()) * 100
            }
            for idx, val in top_performers.items()
        ]
    
    def _create_trend_visualization(self, trend_data: pd.DataFrame) -> str:
        """
        Create a visualization of sales trends.
        
        Args:
            trend_data: DataFrame containing sales trend data
            
        Returns:
            Base64 encoded image string
        """
        try:
            plt.figure(figsize=(15, 10))
            
            # Plot overall trend
            plt.subplot(2, 2, 1)
            plt.plot(trend_data['period'], trend_data['revenue'], 
                    label='Revenue Trend', color='blue', alpha=0.7)
            plt.title('Overall Revenue Trend')
            plt.xlabel('Date')
            plt.ylabel('Revenue')
            plt.grid(True, alpha=0.3)
            plt.legend()
            
            # Plot seasonal patterns
            plt.subplot(2, 2, 2)
            # Calculate seasonal component using moving average
            seasonal = trend_data['revenue'].rolling(window=12).mean()
            plt.plot(trend_data['period'], seasonal, 
                    label='Seasonal Pattern', color='green', alpha=0.7)
            plt.title('Seasonal Patterns')
            plt.xlabel('Date')
            plt.ylabel('Seasonal Component')
            plt.grid(True, alpha=0.3)
            plt.legend()
            
            # Plot trend component
            plt.subplot(2, 2, 3)
            # Calculate trend using polynomial fit
            x = np.arange(len(trend_data))
            z = np.polyfit(x, trend_data['revenue'], 1)
            p = np.poly1d(z)
            plt.plot(trend_data['period'], p(x), 
                    label='Trend Component', color='red', alpha=0.7)
            plt.title('Trend Component')
            plt.xlabel('Date')
            plt.ylabel('Trend Value')
            plt.grid(True, alpha=0.3)
            plt.legend()
            
            # Plot residuals
            plt.subplot(2, 2, 4)
            residuals = trend_data['revenue'] - p(x)
            plt.scatter(trend_data['period'], residuals, 
                       label='Residuals', color='purple', alpha=0.5)
            plt.axhline(y=0, color='black', linestyle='--', alpha=0.3)
            plt.title('Residuals')
            plt.xlabel('Date')
            plt.ylabel('Residual Value')
            plt.grid(True, alpha=0.3)
            plt.legend()
            
            plt.tight_layout()
            
            # Save plot to buffer
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight', dpi=300)
            buffer.seek(0)
            
            # Convert to base64
            plot_data = base64.b64encode(buffer.read()).decode()
            
            # Close plot to free memory
            plt.close()
            
            return f"data:image/png;base64,{plot_data}"
            
        except Exception as e:
            logger.error(f"Error creating trend visualization: {str(e)}")
            raise 