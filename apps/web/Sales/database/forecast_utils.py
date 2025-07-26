"""
Forecast Utilities

This module provides utility functions for demand forecasting.
"""

import os
import sys

# Add the project root to the path consistently at the beginning
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../../"))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Standard library imports
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union, Tuple
from io import BytesIO
import base64

# Third-party imports
import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.arima.model import ARIMA
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt

# Attempt to import database connector
try:
    from .connector import DatabaseConnector, get_db_connector
    db_connector = get_db_connector()
    logger = logging.getLogger(__name__)
    logger.info("Successfully imported database connector in forecast_utils")
    HAS_DB_CONNECTOR = True
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"Failed to import database connector: {e}. Using fallback data generation.")
    HAS_DB_CONNECTOR = False
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"Error initializing database connector: {e}. Using fallback data generation.")
    HAS_DB_CONNECTOR = False

# Define necessary functions locally if they're causing circular imports
def fetch_sales_data(conn, start_date: str, end_date: str, product_id: Optional[str] = None, region: Optional[str] = None) -> pd.DataFrame:
    """Fetch sales data from the database."""
    try:
        # Build the query
        query = """
            SELECT 
                t.[Txn Date],
                t.[Item Key],
                t.[Sales Organization Key],
                SUM(t.[Net Sales Quantity]) as Quantity,
                SUM(t.[Net Sales Amount]) as [Net Sales Amount]
            FROM dbo_F_Sales_Transaction t
            WHERE t.[Txn Date] BETWEEN ? AND ?
        """
        
        # If end_date is None, get the latest date from the database
        if end_date is None:
            date_query = "SELECT MAX([Txn Date]) FROM dbo_F_Sales_Transaction"
            cursor = conn.cursor()
            cursor.execute(date_query)
            end_date = cursor.fetchone()[0]
            if end_date is None:
                logger.error("No data found in the database")
                return pd.DataFrame()
        
        params = [start_date, end_date]
        
        # Add product filter if specified
        if product_id:
            query += ' AND t.[Item Key] = ?'
            params.append(product_id)
            
        # Add region filter if specified
        if region:
            query += ' AND t.[Sales Organization Key] = ?'
            params.append(region)
            
        query += ' GROUP BY t.[Txn Date], t.[Item Key], t.[Sales Organization Key] ORDER BY t.[Txn Date]'
        
        # Execute query
        df = pd.read_sql(query, conn, params=params)
        if not df.empty:
            # Convert numeric columns to appropriate types
            df['Item Key'] = df['Item Key'].astype(int)
            df['Sales Organization Key'] = df['Sales Organization Key'].astype(int)
            df['Quantity'] = df['Quantity'].astype(float)
            df['Net Sales Amount'] = df['Net Sales Amount'].astype(float)
            
            logger.info(f"Fetched data from {start_date} to {end_date}")
            logger.info(f"Number of records: {len(df)}")
        return df
        
    except Exception as e:
        logger.error(f"Error fetching sales data: {str(e)}")
        # Return empty DataFrame with expected columns
        return pd.DataFrame(columns=['Txn Date', 'Item Key', 'Sales Organization Key', 'Quantity', 'Net Sales Amount'])

def get_dimension_column(dimension: str) -> str:
    """
    Get the column name for a given dimension.
    
    Args:
        dimension: Dimension name (e.g., 'product', 'customer', 'region')
        
    Returns:
        str: Column name
    """
    dimension_map = {
        'product': 'product_id',
        'customer': 'customer_id',
        'region': 'region',
        'date': 'date'
    }
    
    return dimension_map.get(dimension.lower(), dimension)

# Initialize logger
logger = logging.getLogger(__name__)

def prepare_time_series_data(data: pd.DataFrame) -> pd.DataFrame:
    """Prepare time series data for forecasting."""
    # Convert date column to datetime
    data['Txn Date'] = pd.to_datetime(data['Txn Date'])
    
    # Aggregate data by date
    daily_data = data.groupby('Txn Date').agg({
        'Quantity': 'sum',
        'Net Sales Amount': 'sum'
    }).reset_index()
    
    # Sort by date
    daily_data = daily_data.sort_values('Txn Date')
    
    # Fill any missing dates with 0
    date_range = pd.date_range(start=daily_data['Txn Date'].min(), end=daily_data['Txn Date'].max(), freq='D')
    daily_data = daily_data.set_index('Txn Date').reindex(date_range, fill_value=0).reset_index()
    daily_data = daily_data.rename(columns={'index': 'Txn Date'})
    
    return daily_data

def detect_time_series_properties(data: pd.DataFrame) -> Dict[str, Any]:
    """Detect properties of the time series data."""
    if data.empty:
        return {}
    
    # Calculate basic statistics
    stats = {
        'mean': data['Quantity'].mean(),
        'std': data['Quantity'].std(),
        'min': data['Quantity'].min(),
        'max': data['Quantity'].max(),
        'count': len(data)
    }
    
    # Check for seasonality
    daily_avg = data.groupby(data['Txn Date'].dt.dayofweek)['Quantity'].mean()
    monthly_avg = data.groupby(data['Txn Date'].dt.month)['Quantity'].mean()
    
    stats['daily_seasonality'] = daily_avg.to_dict()
    stats['monthly_seasonality'] = monthly_avg.to_dict()
    
    return stats

def train_forecast_model(time_series: pd.DataFrame, model_type: str = 'moving_average', forecast_periods: int = 30) -> Dict[str, Any]:
    """Train a forecasting model."""
    if model_type == 'moving_average':
        # Calculate different window sizes based on forecast period
        if forecast_periods <= 7:  # Weekly
            window_size = 7
        elif forecast_periods <= 30:  # Monthly
            window_size = 30
        elif forecast_periods <= 90:  # Quarterly
            window_size = 90
        else:  # Yearly
            window_size = 365
            
        window_size = min(window_size, len(time_series))
        
        # Calculate moving average and standard deviation
        moving_avg = time_series['Quantity'].rolling(window=window_size).mean().iloc[-1]
        std_dev = time_series['Quantity'].rolling(window=window_size).std().iloc[-1]
        
        return {
            'model_type': 'moving_average',
            'window_size': window_size,
            'moving_avg': moving_avg,
            'std_dev': std_dev
        }
    else:
        raise ValueError(f"Unsupported model type: {model_type}")

def generate_forecast(model_result: Dict[str, Any], original_series: pd.DataFrame, 
                     prediction_intervals: bool = True, confidence_level: float = 0.95,
                     forecast_periods: int = 30) -> pd.DataFrame:
    """Generate forecast using the trained model."""
    if model_result['model_type'] == 'moving_average':
        # Create date range for forecast
        last_date = original_series['Txn Date'].max()
        forecast_dates = pd.date_range(
            start=last_date + pd.Timedelta(days=1),
            periods=forecast_periods,
            freq='D'
        )
        
        # Calculate trend from historical data
        historical_values = original_series['Quantity'].values
        if len(historical_values) > 1:
            trend = (historical_values[-1] - historical_values[0]) / len(historical_values)
        else:
            trend = 0
            
        # Generate forecast values with trend and random variation
        base_value = model_result['moving_avg']
        forecast_values = []
        for i in range(forecast_periods):
            # Add trend component
            trend_component = trend * (i + 1)
            # Add random variation within 1 standard deviation
            random_variation = np.random.normal(0, model_result['std_dev'] * 0.5)
            forecast_value = base_value + trend_component + random_variation
            # Ensure forecast value is non-negative
            forecast_value = max(0, forecast_value)
            forecast_values.append(forecast_value)
        
        # Create DataFrame with forecast
        forecast_df = pd.DataFrame({
            'Txn Date': forecast_dates,
            'Quantity': forecast_values
        })
        
        if prediction_intervals:
            z_score = 1.96  # For 95% confidence interval
            forecast_df['lower_bound'] = forecast_df['Quantity'] - z_score * model_result['std_dev']
            forecast_df['upper_bound'] = forecast_df['Quantity'] + z_score * model_result['std_dev']
            
        return forecast_df
    else:
        raise ValueError(f"Unsupported model type: {model_result['model_type']}")

def evaluate_forecast_model(model_result: Dict[str, Any], test_data: pd.DataFrame, column: str) -> Dict[str, Any]:
    """Evaluate the performance of the forecasting model."""
    if model_result['model_type'] == 'moving_average':
        actual_values = test_data[column].values
        predicted_values = [model_result['moving_avg']] * len(actual_values)
        
        mae = np.mean(np.abs(actual_values - predicted_values))
        mse = np.mean((actual_values - predicted_values) ** 2)
        rmse = np.sqrt(mse)
        
        return {
            'mae': mae,
            'mse': mse,
            'rmse': rmse
        }
    else:
        raise ValueError(f"Unsupported model type: {model_result['model_type']}")

def format_forecast_results(forecast_result: Dict[str, Any], evaluation: Dict[str, Any],
                          column_name: str, time_period: str) -> Dict[str, Any]:
    """Format forecast results for display."""
    return {
        'forecast': forecast_result,
        'evaluation': evaluation,
        'column_name': column_name,
        'time_period': time_period
    }

def create_forecast_visualization(
    forecast_result: Dict[str, Any],
    original_series: pd.DataFrame = None,
    column: str = None,
    title: str = "Sales Forecast",
    show_intervals: bool = True
) -> str:
    """
    Creates visualization of the forecast.
    
    Args:
        forecast_result: Dictionary with forecast results
        original_series: Original time series data for comparison
        column: Column name to visualize
        title: Title for the visualization
        show_intervals: Whether to show prediction intervals
        
    Returns:
        str: Empty string (URL is printed instead)
    """
    # Check for errors in forecast
    if 'error' in forecast_result and forecast_result['error']:
        logger.error(f"Cannot create visualization: {forecast_result['error']}")
        return ""
    
    # Get forecast information
    point_forecast = forecast_result.get('point_forecast', [])
    lower_bound = forecast_result.get('lower_bound', [])
    upper_bound = forecast_result.get('upper_bound', [])
    forecast_dates = forecast_result.get('forecast_dates', [])
    model_type = forecast_result.get('model_type', 'unknown')
    
    if not point_forecast:
        logger.error("Cannot create visualization: No forecast data")
        return ""
    
    # Create figure and axis
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Plot original data if available
    has_original = False
    original_dates = []
    original_values = []
    
    if original_series is not None and column in original_series.columns:
        has_original = True
        original_dates = original_series.index
        original_values = original_series[column]
        ax.plot(original_dates, original_values, 'b-', label='Historical Data')
    
    # Plot forecast
    ax.plot(forecast_dates, point_forecast, 'r--', label='Forecast')
    
    # Plot prediction intervals if available
    if show_intervals and lower_bound and upper_bound:
        ax.fill_between(forecast_dates, lower_bound, upper_bound, color='r', alpha=0.2, label='Prediction Interval')
    
    # Customize the plot
    ax.set_title(f"{title} ({model_type})")
    ax.set_xlabel('Date')
    ax.set_ylabel(column or 'Value')
    ax.grid(True)
    ax.legend()
    
    # Save the plot to a bytes buffer
    buf = BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    
    # Convert to base64
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    base64_url = f"data:image/png;base64,{img_str}"
    print(f"Base64 Image URL: {base64_url}")
    
    # Close the plot
    plt.close()
    
    return ""

# For testing
if __name__ == "__main__":
    # Generate sample time series data
    dates = pd.date_range(start='2022-01-01', periods=24, freq='M')
    values = np.array([100, 120, 140, 160, 180, 200, 220, 200, 180, 160, 140, 120,
                       110, 130, 150, 170, 190, 210, 230, 210, 190, 170, 150, 130])
    
    # Create sample DataFrame
    sample_data = pd.DataFrame({'revenue': values}, index=dates)
    
    # Prepare time series data
    prepared_data = prepare_time_series_data(
        sample_data.reset_index().rename(columns={'index': 'date'}),
        time_column='date',
        value_column='revenue',
        freq='M'
    )
    
    # Detect time series properties
    properties = detect_time_series_properties(prepared_data, 'revenue')
    
    # Train a forecast model
    model_result = train_forecast_model(
        prepared_data,
        model_type='holt_winters',
        column='revenue',
        forecast_periods=6
    )
    
    # Generate forecast
    forecast = generate_forecast(
        model_result,
        original_series=prepared_data,
        prediction_intervals=True
    )
    
    # Create visualization
    visualization = create_forecast_visualization(
        forecast,
        original_series=prepared_data,
        column='revenue',
        title="Revenue Forecast"
    )
    
    # Format results
    formatted_results = format_forecast_results(
        forecast,
        column_name='revenue',
        time_period='monthly'
    )
    
    print("Time Series Properties:")
    for key, value in properties.items():
        print(f"  {key}: {value}")
    
    print("\nForecast:")
    for i, value in enumerate(forecast['point_forecast']):
        print(f"  Period {i+1}: {value:.2f}")
    
    print(f"\nVisualization created: {len(visualization)} bytes")
    
    print("\nFormatted Results:")
    print(formatted_results)

