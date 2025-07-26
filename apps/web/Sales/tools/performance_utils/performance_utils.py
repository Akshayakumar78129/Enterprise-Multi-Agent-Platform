"""
Performance Analysis Utilities

This module provides utility functions for sales performance analysis.

Migration Note: Updated to use centralized database connector (get_db_connector) and added get_connection helper for compliance with migration rules.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging

# Add database connector import
from Sales.database.connector import get_db_connector

logger = logging.getLogger(__name__)

def get_connection():
    """Get a database connection using the centralized connector."""
    connector = get_db_connector()
    connector.connect()
    return connector.connection

def fetch_sales_data(conn, start_date: str, end_date: str, 
                    dimension: Optional[str] = None,
                    filters: Optional[Dict[str, Any]] = None) -> pd.DataFrame:
    """
    Fetch sales data from the database.
    
    Args:
        conn: Database connection
        start_date: Start date for analysis (YYYY-MM-DD)
        end_date: End date for analysis (YYYY-MM-DD)
        dimension: Optional dimension to group by
        filters: Optional filters to apply
        
    Returns:
        DataFrame containing sales data
    """
    try:
        # Use centralized connection if not provided
        if conn is None:
            conn = get_connection()
        # Base query
        query = """
            SELECT 
                t."Txn Date" as date,
                t."Net Sales Amount" as revenue,
                t."Net Sales Quantity" as units,
                i."Item Desc" as product_name,
                i."Item Category Desc" as category,
                c."Customer Name" as customer_name,
                r."Sales Org Hrchy L1 Name" as region_name
            FROM "dbo_F_Sales_Transaction" t
            LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
            LEFT JOIN "dbo_D_Customer" c ON t."Customer Key" = c."Customer Key"
            LEFT JOIN "dbo_D_Sales_Organization" r ON t."Sales Organization Key" = r."Sales Organization Key"
            WHERE t."Txn Date" BETWEEN ? AND ?
                AND t."Deleted Flag" = 0
                AND t."Excluded Flag" = 0
        """
        
        # Add filters if specified
        params = [start_date, end_date]
        if filters:
            for key, value in filters.items():
                if key == "product_category":
                    query += " AND i.\"Item Category Desc\" = ?"
                    params.append(value)
                elif key == "region":
                    query += " AND r.\"Sales Org Hrchy L1 Name\" = ?"
                    params.append(value)
        
        # Execute query
        data = pd.read_sql_query(query, conn, params=params)
        
        return data
        
    except Exception as e:
        logger.error(f"Error fetching sales data: {str(e)}")
        raise

def calculate_metrics(data: pd.DataFrame, metrics: List[str]) -> pd.DataFrame:
    """
    Calculate sales metrics from the data.
    
    Args:
        data: DataFrame containing sales data
        metrics: List of metrics to calculate
        
    Returns:
        DataFrame with calculated metrics
    """
    try:
        result = data.copy()
        
        # Calculate metrics
        if 'revenue' in metrics:
            result['revenue'] = result['revenue'].fillna(0)
            
        if 'units' in metrics:
            result['units'] = result['units'].fillna(0)
            
        if 'aov' in metrics:
            result['aov'] = result['revenue'] / result['units'].replace(0, np.nan)
            
        return result
        
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}")
        raise

def analyze_trends(data: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyze trends in the sales data.
    
    Args:
        data: DataFrame containing sales data
        
    Returns:
        Dictionary containing trend analysis results
    """
    try:
        trends = {}
        
        # Calculate growth rates
        for metric in ['revenue', 'units', 'aov']:
            if metric in data.columns:
                values = data[metric].values
                if len(values) > 1:
                    growth = ((values[-1] - values[0]) / values[0]) * 100
                    trends[f'{metric}_growth'] = growth
                    
        return trends
        
    except Exception as e:
        logger.error(f"Error analyzing trends: {str(e)}")
        raise

def compare_periods(data: pd.DataFrame, period1: str, period2: str) -> Dict[str, Any]:
    """
    Compare sales metrics between two periods.
    
    Args:
        data: DataFrame containing sales data
        period1: First period to compare
        period2: Second period to compare
        
    Returns:
        Dictionary containing comparison results
    """
    try:
        comparison = {}
        
        # Group data by period
        period1_data = data[data['date'].str.startswith(period1)]
        period2_data = data[data['date'].str.startswith(period2)]
        
        # Compare metrics
        for metric in ['revenue', 'units', 'aov']:
            if metric in data.columns:
                p1_value = period1_data[metric].sum()
                p2_value = period2_data[metric].sum()
                change = ((p2_value - p1_value) / p1_value) * 100
                comparison[f'{metric}_change'] = change
                
        return comparison
        
    except Exception as e:
        logger.error(f"Error comparing periods: {str(e)}")
        raise

def identify_outliers(data: pd.DataFrame) -> Dict[str, Any]:
    """
    Identify outliers in the sales data.
    
    Args:
        data: DataFrame containing sales data
        
    Returns:
        Dictionary containing outlier information
    """
    try:
        outliers = {}
        
        # Identify outliers for each metric
        for metric in ['revenue', 'units', 'aov']:
            if metric in data.columns:
                values = data[metric].values
                q1 = np.percentile(values, 25)
                q3 = np.percentile(values, 75)
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                
                outlier_data = data[
                    (data[metric] < lower_bound) | 
                    (data[metric] > upper_bound)
                ]
                
                if not outlier_data.empty:
                    outliers[metric] = outlier_data.to_dict('records')
                    
        return outliers
        
    except Exception as e:
        logger.error(f"Error identifying outliers: {str(e)}")
        raise

def generate_insights(data: pd.DataFrame, trends: Dict[str, Any], 
                     outliers: Dict[str, Any]) -> List[str]:
    """
    Generate insights from the sales data analysis.
    
    Args:
        data: DataFrame containing sales data
        trends: Dictionary containing trend analysis
        outliers: Dictionary containing outlier information
        
    Returns:
        List of insights
    """
    try:
        insights = []
        
        # Generate trend insights
        for metric, growth in trends.items():
            if 'growth' in metric:
                metric_name = metric.replace('_growth', '')
                if growth > 0:
                    insights.append(f"{metric_name.title()} has grown by {growth:.2f}%")
                else:
                    insights.append(f"{metric_name.title()} has declined by {abs(growth):.2f}%")
                    
        # Generate outlier insights
        for metric, outlier_data in outliers.items():
            if outlier_data:
                insights.append(f"Found {len(outlier_data)} outliers in {metric}")
                
        return insights
        
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise 