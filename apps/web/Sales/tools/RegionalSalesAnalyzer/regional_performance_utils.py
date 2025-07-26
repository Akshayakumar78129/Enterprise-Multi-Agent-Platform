import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union, Tuple
import logging
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import sys
import os
from pathlib import Path
from Sales.database.column_mapping import get_db_column
import sqlite3

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import from other utility modules
from regional_data_utils import prepare_regional_data, apply_regional_filters

class RegionalPerformanceUtils:
    """Utility class for analyzing regional sales performance."""
    
    def __init__(self, db_path: str, logger: Optional[logging.Logger] = None):
        """Initialize the regional performance utilities.
        
        Args:
            db_path: Path to the SQLite database
            logger: Optional logger instance
        """
        self.db_path = db_path
        self.logger = logger or logging.getLogger(__name__)
        
    def analyze_regional_performance(self, data: pd.DataFrame, metric: str = 'revenue',
                                   top_n: int = 10, include_growth: bool = True,
                                   include_sub_regions: bool = False) -> Dict[str, Any]:
        """Analyze regional performance based on specified metric."""
        return analyze_regional_performance(data, metric, top_n, include_growth, include_sub_regions)
        
    def analyze_region_time_series(self, data: pd.DataFrame, region_code: str,
                                 metric: str = 'revenue', include_sub_regions: bool = False) -> Dict[str, Any]:
        """Analyze time series data for a specific region."""
        return analyze_region_time_series(data, region_code, metric, include_sub_regions)
        
    def compare_regions(self, data: pd.DataFrame, region_codes: List[str],
                       metric: str = 'revenue', include_sub_regions: bool = False) -> Dict[str, Any]:
        """Compare performance between multiple regions."""
        return compare_regions(data, region_codes, metric, include_sub_regions)
        
    def identify_regional_opportunities(self, data: pd.DataFrame,
                                     metric: str = 'revenue',
                                     growth_threshold: float = 10.0,
                                     include_sub_regions: bool = False) -> Dict[str, Any]:
        """Identify regional opportunities and risks based on growth rates."""
        return identify_regional_opportunities(data, metric, growth_threshold, include_sub_regions)

# Define the utility functions
def analyze_regional_performance(
    data: pd.DataFrame,
    metric: str = 'revenue',
    top_n: int = 5,
    include_growth: bool = True,
    include_sub_regions: bool = False
) -> Dict[str, Any]:
    """Analyze regional performance metrics."""
    try:
        if data is None or data.empty:
            logger.warning("No data provided for regional performance analysis")
            return {"error": "No data available for analysis"}

        # Ensure required columns exist
        required_columns = ['region_name', 'revenue', 'units', 'margin']
        missing_columns = [col for col in required_columns if col not in data.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return {"error": f"Missing required columns: {missing_columns}"}

        # Create a copy of the data to avoid modifying the original
        data = data.copy()

        # Group by region and optionally sub-region
        group_cols = ['region_name']
        if include_sub_regions and 'sub_region_name' in data.columns:
            group_cols.append('sub_region_name')
            
        # Calculate performance metrics with proper aggregation
        agg_dict = {
            'revenue': 'sum',
            'units': 'sum',
            'margin': 'sum'
        }
        
        # Use groupby with proper aggregation
        performance = data.groupby(group_cols, as_index=False).agg(agg_dict)
        
        # Calculate additional metrics with proper error handling
        try:
            performance['margin_pct'] = (performance['margin'] / performance['revenue'].replace(0, np.nan)) * 100
            performance['revenue_per_unit'] = performance['revenue'] / performance['units'].replace(0, np.nan)
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            return {"error": f"Error calculating metrics: {str(e)}"}
        
        # Sort by selected metric
        if metric not in performance.columns:
            logger.error(f"Invalid metric: {metric}")
            return {"error": f"Invalid metric: {metric}"}
            
        performance = performance.sort_values(metric, ascending=False)
        
        # Get top performers
        top_performers = performance.head(top_n).copy()
        
        # Calculate growth if requested
        growth = None
        if include_growth and 'Txn Date' in data.columns:
            growth = calculate_growth_rates(data, group_cols)
            if growth is not None and not growth.empty:
                # Merge growth rates with performance data
                top_performers = top_performers.merge(
                    growth[group_cols + ['growth_rate']], 
                    on=group_cols, 
                    how='left'
                )
        
        # Convert numeric columns to float to avoid serialization issues
        numeric_cols = ['revenue', 'units', 'margin', 'margin_pct', 'revenue_per_unit']
        for col in numeric_cols:
            if col in top_performers.columns:
                top_performers[col] = top_performers[col].astype(float)
        
        return {
            "top_regions": top_performers.to_dict('records'),
            "total_metrics": {
                "total_revenue": float(performance['revenue'].sum()),
                "total_units": float(performance['units'].sum()),
                "total_margin": float(performance['margin'].sum()),
                "avg_margin_pct": float(performance['margin_pct'].mean()),
                "avg_revenue_per_unit": float(performance['revenue_per_unit'].mean())
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing regional performance: {str(e)}")
        return {"error": str(e)}

def calculate_growth_rates(
    data: pd.DataFrame,
    group_cols: List[str]
) -> Optional[pd.DataFrame]:
    """Calculate growth rates for regions."""
    try:
        if data is None or data.empty:
            logger.warning("No data provided for growth rate calculation")
            return None

        # Ensure required columns exist
        required_columns = group_cols + ['Txn Date', 'revenue']
        missing_columns = [col for col in required_columns if col not in data.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return None

        # Convert date column to datetime if needed
        if not pd.api.types.is_datetime64_any_dtype(data['Txn Date']):
            data['Txn Date'] = pd.to_datetime(data['Txn Date'])

        # Get the latest date in the data
        latest_date = data['Txn Date'].max()
        one_year_ago = latest_date - pd.DateOffset(years=1)

        # Filter data for the last two years
        mask = (data['Txn Date'] >= one_year_ago) & (data['Txn Date'] <= latest_date)
        recent_data = data.loc[mask].copy()

        if recent_data.empty:
            logger.warning("No data available for the specified time period")
            return None

        # Group by date and region to get monthly revenue
        monthly_data = recent_data.groupby(
            group_cols + [pd.Grouper(key='Txn Date', freq='M')],
            as_index=False
        )['revenue'].sum()

        # Calculate growth rates
        growth_rates = []
        for region in monthly_data[group_cols].drop_duplicates().itertuples(index=False):
            region_mask = True
            for i, col in enumerate(group_cols):
                region_mask &= (monthly_data[col] == region[i])
            
            region_data = monthly_data.loc[region_mask].sort_values('Txn Date')
            
            if len(region_data) >= 2:
                current_revenue = region_data['revenue'].iloc[-1]
                previous_revenue = region_data['revenue'].iloc[-2]
                growth_rate = ((current_revenue - previous_revenue) / previous_revenue) * 100
                
                growth_rates.append({
                    **{col: region[i] for i, col in enumerate(group_cols)},
                    'growth_rate': float(growth_rate)
                })

        if not growth_rates:
            logger.warning("No growth rates could be calculated")
            return None

        return pd.DataFrame(growth_rates)

    except Exception as e:
        logger.error(f"Error calculating growth rates: {str(e)}")
        return None

def analyze_region_time_series(
    data: pd.DataFrame,
    region_code: str,
    metric: str = 'revenue',
    include_sub_regions: bool = False
) -> Dict[str, Any]:
    """Analyze time series data for a specific region."""
    try:
        # Filter for specific region
        region_data = data[data['region_code'] == region_code]
        
        # Group by date and optionally sub-region
        group_cols = ['date']
        if include_sub_regions and 'sub_region_name' in data.columns:
            group_cols.append('sub_region_name')
            
        # Calculate time series metrics
        time_series = region_data.groupby(group_cols).agg({
            'revenue': 'sum',
            'units': 'sum',
            'margin': 'sum',
            'margin_pct': 'mean',
            'revenue_per_unit': 'mean'
        }).reset_index()
        
        return {
            "time_series": time_series.to_dict('records'),
            "summary": {
                "total_revenue": time_series['revenue'].sum(),
                "total_units": time_series['units'].sum(),
                "total_margin": time_series['margin'].sum(),
                "avg_margin_pct": time_series['margin_pct'].mean(),
                "avg_revenue_per_unit": time_series['revenue_per_unit'].mean()
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing region time series: {str(e)}")
        raise

def compare_regions(
    data: pd.DataFrame,
    region_codes: List[str],
    metric: str = 'revenue',
    include_sub_regions: bool = False
) -> Dict[str, Any]:
    """Compare performance between regions."""
    try:
        # Filter for specific regions
        comparison_data = data[data['region_code'].isin(region_codes)]
        
        # Group by region and optionally sub-region
        group_cols = ['region_name']
        if include_sub_regions and 'sub_region_name' in data.columns:
            group_cols.append('sub_region_name')
            
        # Calculate comparison metrics
        comparison = comparison_data.groupby(group_cols).agg({
            'revenue': ['sum', 'mean', 'std'],
            'units': ['sum', 'mean', 'std'],
            'margin': ['sum', 'mean', 'std'],
            'margin_pct': ['mean', 'std'],
            'revenue_per_unit': ['mean', 'std']
        }).reset_index()
        
        return {
            "comparison": comparison.to_dict('records'),
            "summary": {
                "total_revenue": comparison[('revenue', 'sum')].sum(),
                "total_units": comparison[('units', 'sum')].sum(),
                "total_margin": comparison[('margin', 'sum')].sum(),
                "avg_margin_pct": comparison[('margin_pct', 'mean')].mean(),
                "avg_revenue_per_unit": comparison[('revenue_per_unit', 'mean')].mean()
            }
        }
        
    except Exception as e:
        logger.error(f"Error comparing regions: {str(e)}")
        raise

def identify_regional_opportunities(
    data: pd.DataFrame,
    metric: str = 'revenue',
    growth_threshold: float = 10.0,
    include_sub_regions: bool = False
) -> Dict[str, Any]:
    """Identify regional opportunities based on growth and performance."""
    try:
        # Group by region and optionally sub-region
        group_cols = ['region_name']
        if include_sub_regions and 'sub_region_name' in data.columns:
            group_cols.append('sub_region_name')
            
        # Calculate growth rates
        growth = calculate_growth_rates(data, group_cols)
        
        # Identify opportunities
        opportunities = growth[growth['growth_rate'] >= growth_threshold]
        
        return {
            "opportunities": opportunities.to_dict('records'),
            "summary": {
                "total_opportunities": len(opportunities),
                "avg_growth_rate": opportunities['growth_rate'].mean(),
                "total_potential_revenue": opportunities['revenue'].sum()
            }
        }
        
    except Exception as e:
        logger.error(f"Error identifying regional opportunities: {str(e)}")
        raise

# For testing
if __name__ == "__main__":
    # Import for testing
    from .regional_data_utils import generate_sample_region_data, prepare_regional_data
    
    # Generate sample data
    sample_data = generate_sample_region_data()
    prepared_data = prepare_regional_data(sample_data)
    
    # Test regional performance analysis
    performance = analyze_regional_performance(
        prepared_data,
        metric='revenue',
        top_n=3,
        include_growth=True,
        include_sub_regions=False
    )
    
    # Test time series analysis
    time_series = analyze_region_time_series(
        prepared_data,
        region_code='NAM',
        metric='revenue',
        include_sub_regions=False
    )
    
    # Test region comparison
    comparison = compare_regions(
        prepared_data,
        region_codes=['NAM', 'APAC', 'WEU'],
        metric='revenue',
        include_sub_regions=False
    )
    
    # Test opportunity identification
    opportunities = identify_regional_opportunities(
        prepared_data,
        metric='revenue',
        growth_threshold=5.0,
        include_sub_regions=False
    )
    
    print(f"Performance analysis: {len(performance['top_regions'])} regions analyzed")
    print(f"Time series analysis: {len(time_series['time_series'])} time points analyzed")
    print(f"Region comparison: {len(comparison['comparison'])} regions compared")
    print(f"Opportunities found: {len(opportunities['opportunities'])}")
    print(f"Risks identified: {len(opportunities['opportunities'])}") 
 
 
 