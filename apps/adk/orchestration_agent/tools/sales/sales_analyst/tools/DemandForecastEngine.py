"""
Demand Forecast Engine

This module provides demand forecasting capabilities using various models.
"""

import pandas as pd
import numpy as np
import logging
import sqlite3
import matplotlib.pyplot as plt
import io
import base64
from typing import Dict, Any, Optional
from pathlib import Path
import os 
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)
from datetime import datetime, timedelta
from .forecast_utils import (
    fetch_sales_data,
    prepare_time_series_data,
    detect_time_series_properties,
    train_forecast_model,
    generate_forecast,
    evaluate_forecast_model,
    format_forecast_results
)

class DemandForecastEngine:
    def __init__(self, db_path: str = None, logger: Optional[logging.Logger] = None):
        """Initialize the demand forecast engine."""
        self.db_path = db_path or Path(__file__).parent.parent.parent.parent.joinpath('database', 'sales_agent.db')
        self.logger = logger or logging.getLogger(__name__)
        self.conn = None
        
    def __enter__(self):
        """Context manager entry."""
        self.conn = self._get_connection()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
        
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
            
    def _get_connection(self):
        """Get database connection."""
        try:
            return sqlite3.connect(self.db_path)
        except Exception as e:
            self.logger.error(f"Error connecting to database: {str(e)}")
            raise
            
    def _get_latest_date(self) -> str:
        """Get the latest date from the database."""
        try:
            if not self.conn:
                self.conn = self._get_connection()
                
            cursor = self.conn.cursor()
            cursor.execute("SELECT MAX([Txn Date]) FROM dbo_F_Sales_Transaction")
            latest_date = cursor.fetchone()[0]
            
            if not latest_date:
                raise ValueError("No data found in the database")
                
            return latest_date
            
        except Exception as e:
            self.logger.error(f"Error getting latest date: {str(e)}")
            raise
            
    def prepare_demand_data(self, start_date: str = None, end_date: str = None, 
                          product_id: Optional[str] = None, region: Optional[str] = None) -> pd.DataFrame:
        """Prepare demand data for forecasting."""
        try:
            if not self.conn:
                self.conn = self._get_connection()
                
            # If end_date is not provided, use the latest date from the database
            if end_date is None:
                end_date = self._get_latest_date()
                
            # If start_date is not provided, use 90 days before end_date
            if start_date is None:
                end_date_dt = datetime.strptime(end_date, '%Y-%m-%d')
                start_date = (end_date_dt - timedelta(days=90)).strftime('%Y-%m-%d')
                
            # Fetch sales data
            data = fetch_sales_data(self.conn, start_date, end_date, product_id, region)
            
            if data.empty:
                self.logger.warning(f"No data found for the specified period: {start_date} to {end_date}")
                return pd.DataFrame()
                
            # Prepare time series data
            time_series = prepare_time_series_data(data)
            
            return time_series
            
        except Exception as e:
            self.logger.error(f"Error preparing demand data: {str(e)}")
            raise
            
    def analyze_demand_patterns(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Analyze demand patterns in the data."""
        if data.empty:
            return {}
            
        try:
            # Detect time series properties
            properties = detect_time_series_properties(data)
            
            return properties
            
        except Exception as e:
            self.logger.error(f"Error analyzing demand patterns: {str(e)}")
            raise
            
    def generate_forecast_for_period(self, period: str = 'month', 
                                   product_id: Optional[str] = None, 
                                   region: Optional[str] = None) -> Dict[str, Any]:
        """Generate forecast for a specific period."""
        try:
            # Determine forecast periods based on the period type
            period_map = {
                'week': 7,
                'month': 30,
                'quarter': 90,
                'year': 365
            }
            
            if period not in period_map:
                raise ValueError(f"Invalid period: {period}. Must be one of {list(period_map.keys())}")
                
            forecast_periods = period_map[period]
            
            # Prepare data
            data = self.prepare_demand_data(product_id=product_id, region=region)
            
            if data.empty:
                return {}
                
            # Analyze patterns
            patterns = self.analyze_demand_patterns(data)
            
            # Generate forecast
            model_result = train_forecast_model(data, 'moving_average', forecast_periods)
            forecast_df = generate_forecast(model_result, data, True, 0.95, forecast_periods)
            
            # Calculate average price per unit from historical data
            avg_price_per_unit = data['Net Sales Amount'].sum() / data['Quantity'].sum()
            
            # Add revenue predictions to forecast
            forecast_df['Revenue'] = forecast_df['Quantity'] * avg_price_per_unit
            forecast_df['Revenue_lower_bound'] = forecast_df['lower_bound'] * avg_price_per_unit
            forecast_df['Revenue_upper_bound'] = forecast_df['upper_bound'] * avg_price_per_unit
            
            # Evaluate model
            evaluation = evaluate_forecast_model(model_result, data, 'Quantity')
            
            # Calculate additional metrics
            total_forecast_revenue = forecast_df['Revenue'].sum()
            avg_daily_revenue = forecast_df['Revenue'].mean()
            revenue_growth = ((forecast_df['Revenue'].iloc[-1] - forecast_df['Revenue'].iloc[0]) / 
                            forecast_df['Revenue'].iloc[0]) * 100
            
            # Format results
            results = {
                'forecast': {
                    'dates': forecast_df['Txn Date'].dt.strftime('%Y-%m-%d').tolist(),
                    'values': forecast_df['Quantity'].tolist(),
                    'revenue': forecast_df['Revenue'].tolist(),
                    'lower_bound': forecast_df['lower_bound'].tolist(),
                    'upper_bound': forecast_df['upper_bound'].tolist(),
                    'revenue_lower_bound': forecast_df['Revenue_lower_bound'].tolist(),
                    'revenue_upper_bound': forecast_df['Revenue_upper_bound'].tolist()
                },
                'evaluation': evaluation,
                'patterns': patterns,
                'revenue_metrics': {
                    'total_forecast_revenue': total_forecast_revenue,
                    'average_daily_revenue': avg_daily_revenue,
                    'revenue_growth_percentage': revenue_growth,
                    'average_price_per_unit': avg_price_per_unit
                },
                'visualization': self._create_forecast_visualization(data, forecast_df)
            }
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error generating forecast for period {period}: {str(e)}")
            raise

    def _create_forecast_visualization(self, historical_data: pd.DataFrame, forecast_data: pd.DataFrame):
        """
        Prepare data for Nivo line chart (JS) for demand and revenue forecast.
        Returns a list of series dicts for Nivo, e.g.:
        [
          {"id": "Historical Demand", "data": [{"x": date, "y": value}, ...]},
          {"id": "Forecast", "data": [{"x": date, "y": value}, ...]},
          {"id": "Lower Bound", "data": [{"x": date, "y": value}, ...]},
          ...
        ]
        """
        result = []
        # Demand (Quantity)
        if 'Quantity' in historical_data.columns:
            result.append({
                "id": "Historical Demand",
                "data": [
                    {"x": int(date), "y": int(val)}
                    for date, val in zip(historical_data.index, historical_data['Quantity']) if int(val) > 0 and int(date) > 0
                ]
            })
        if 'Quantity' in forecast_data.columns:
            result.append({
                "id": "Forecast",
                "data": [
                    {"x": int(date), "y": int(val)}
                    for date, val in zip(forecast_data.index, forecast_data['Quantity']) if int(val) > 0 and int(date) > 0
                ]
            })
        if 'lower_bound' in forecast_data.columns:
            result.append({
                "id": "Lower Bound",
                "data": [
                    {"x": int(date), "y": int(val)}
                    for date, val in zip(forecast_data.index, forecast_data['lower_bound']) if int(val) > 0 and int(date) > 0
                ]
            })
        if 'upper_bound' in forecast_data.columns:
            result.append({
                "id": "Upper Bound",
                "data": [
                    {"x": int(date), "y": int(val)}
                    for date, val in zip(forecast_data.index, forecast_data['upper_bound']) if int(val) > 0 and int(date) > 0
                ]
            })
        # Revenue
        # if 'Net Sales Amount' in historical_data.columns:
        #     result.append({
        #         "id": "Historical Revenue",
        #         "data": [
        #             {"x": int(date), "y": int(val)}
        #             for date, val in zip(historical_data.index, historical_data['Net Sales Amount']) if int(val) > 0 and int(date) > 0
        #         ]
        #     })
        # if 'Revenue' in forecast_data.columns:
        #     result.append({
        #         "id": "Revenue Forecast",
        #         "data": [
        #             {"x": int(date), "y": int(val)}
        #             for date, val in zip(forecast_data.index, forecast_data['Revenue']) if int(val) > 0 and int(date) > 0 and int(val) < 83547
        #         ]
        #     })
        # if 'Revenue_lower_bound' in forecast_data.columns:
        #     result.append({
        #         "id": "Revenue Lower Bound",
        #         "data": [
        #             {"x": int(date), "y": int(val)}
        #             for date, val in zip(forecast_data.index, forecast_data['Revenue_lower_bound'])
        #         ]
        #     })
        # if 'Revenue_upper_bound' in forecast_data.columns:
        #     result.append({
        #         "id": "Revenue Upper Bound",
        #         "data": [
        #             {"x": int(date), "y": int(val)}
        #             for date, val in zip(forecast_data.index, forecast_data['Revenue_upper_bound'])
        #         ]
        #     })
        return result 