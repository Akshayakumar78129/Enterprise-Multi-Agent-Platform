import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, List, Optional, Union, Tuple
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import sys
import os

# Make sure our project root is in the path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
sys.path.insert(0, project_root)

# Set the database path explicitly
DB_PATH = os.path.abspath(os.path.join(project_root, 'Project', 'Sales', 'database', 'sales_agent.db'))
VISUALIZATION_PATH = Path(__file__).parent.parent.parent.parent.joinpath('output', 'visualizations')

# Import utility functions
from regional_data_utils import (
    prepare_regional_data, 
    get_regional_filters, 
    apply_regional_filters,
    create_geo_hierarchy
)
from regional_performance_utils import (
    analyze_regional_performance,
    analyze_region_time_series,
    compare_regions,
    identify_regional_opportunities
)
from regional_visualization_utils import (
    create_regional_map_visualization,
    create_region_time_series_chart,
    create_region_comparison_chart,
    create_region_growth_chart,
    create_region_treemap_visualization
)

logger = logging.getLogger(__name__)

# Add country name mapping
COUNTRY_NAME_MAPPING = {
    'USA': 'United States',
    'US': 'United States',
    'U.S.A.': 'United States',
    'U.S.': 'United States',
    'America': 'United States',
    'CAN': 'Canada',
    'CA': 'Canada',
    'MEX': 'Mexico',
    'MX': 'Mexico'
}

def get_db_connection():
    """Get a database connection using the centralized DB_PATH."""
    return sqlite3.connect(DB_PATH)

def get_latest_date(db_path: str = DB_PATH) -> str:
    """Get the latest date from the sales database."""
    try:
        conn = get_db_connection()
        query = """
            SELECT MAX([Txn Date]) as latest_date
            FROM dbo_F_Sales_Transaction
            WHERE [Txn Date] IS NOT NULL
        """
        result = pd.read_sql(query, conn)
        latest_date = pd.to_datetime(result['latest_date'].iloc[0])
        conn.close()
        return latest_date.strftime('%Y-%m-%d')
    except Exception as e:
        logger.error(f"Error getting latest date: {str(e)}")
        raise

def parse_date_range(time_period: str, start_date: str = None, end_date: str = None) -> Tuple[str, str]:
    """Parse date range based on time period or custom dates."""
    try:
        if start_date and end_date:
            # Validate and format dates
            start = pd.to_datetime(start_date).strftime('%Y-%m-%d')
            end = pd.to_datetime(end_date).strftime('%Y-%m-%d')
            return start, end
        
        # Get latest date from database
        conn = get_db_connection()
        query = """
            SELECT MAX([Txn Date]) as latest_date
            FROM dbo_F_Sales_Transaction
            WHERE [Deleted Flag] = 0
        """
        result = pd.read_sql(query, conn)
        conn.close()
        
        if result.empty or result['latest_date'].iloc[0] is None:
            logger.error("No date data found in database")
            return None, None
            
        latest_date = pd.to_datetime(result['latest_date'].iloc[0])
        
        if time_period == 'quarterly':
            # Get the start of the quarter for the latest date
            quarter_start = latest_date.replace(day=1)
            while quarter_start.month % 3 != 0:
                quarter_start = quarter_start.replace(day=1) - timedelta(days=1)
            return quarter_start.strftime('%Y-%m-%d'), latest_date.strftime('%Y-%m-%d')
        elif time_period == 'monthly':
            return latest_date.replace(day=1).strftime('%Y-%m-%d'), latest_date.strftime('%Y-%m-%d')
        elif time_period == 'annual':
            return latest_date.replace(month=1, day=1).strftime('%Y-%m-%d'), latest_date.strftime('%Y-%m-%d')
        elif time_period == 'last_2_years':
            return (latest_date - timedelta(days=730)).strftime('%Y-%m-%d'), latest_date.strftime('%Y-%m-%d')
        else:
            return latest_date.strftime('%Y-%m-%d'), latest_date.strftime('%Y-%m-%d')
            
    except Exception as e:
        logger.error(f"Error parsing date range: {str(e)}")
        return None, None

def get_sales_data(time_period: str = None,
                  region_codes: List[str] = None,
                  country_codes: List[str] = None,
                  sub_region_codes: List[str] = None,
                  include_sub_regions: bool = False,
                  start_date: str = None,
                  end_date: str = None) -> pd.DataFrame:
    """Get sales data for the specified time period and filters."""
    try:
        logger.info("Starting get_sales_data function")
        logger.info(f"Initial Parameters: time_period={time_period}, country_codes={country_codes}")
        
        # Map country codes to their standardized names
        if country_codes:
            logger.info(f"Processing country codes: {country_codes}")
            mapped_country_codes = []
            for code in country_codes:
                original_code = code
                code = code.upper()  # Convert to uppercase for mapping
                mapped_code = COUNTRY_NAME_MAPPING.get(code, code)
                if mapped_code != code:
                    logger.info(f"Mapping country code {original_code} to {mapped_code}")
                mapped_country_codes.append(mapped_code)
            country_codes = mapped_country_codes
            logger.info(f"Final mapped country codes: {country_codes}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Parse date range
        query_start_date, query_end_date = parse_date_range(time_period, start_date, end_date)
        logger.info(f"Parsed date range: {query_start_date} to {query_end_date}")
        
        if not query_start_date or not query_end_date:
            logger.error("Invalid date range")
            return None
        
        # Build the base query with correct column names and joins
        query = """
            SELECT 
                s.[Txn Date] as transaction_date,
                s.[gpb Net Sales Amount] as net_sales_amount,
                s.[gpb Net Sales Quantity] as net_sales_quantity,
                s.[gpb Gross Profit Amount] as gross_profit_amount,
                g.[Customer Geography Hrchy L1 Name] as region_name,
                g.[Customer Geography Hrchy L1 Code] as region_code,
                g.[Customer Geography Hrchy L2 Name] as sub_region_name,
                g.[Customer Geography Hrchy L2 Code] as sub_region_code
            FROM dbo_F_Sales_Transaction s
            JOIN dbo_D_Customer_Geography_Hierarchy g 
                ON s.[Customer Geography Hrchy Key] = g.[Customer Geography Hrchy Key]
            WHERE g.[Deleted Flag] = 0
            AND s.[Deleted Flag] = 0
            AND s.[Txn Date] BETWEEN ? AND ?
        """
        
        params = [query_start_date, query_end_date]
        
        # Add region filters
        if region_codes:
            placeholders = ','.join(['?' for _ in region_codes])
            query += f" AND g.[Customer Geography Hrchy L1 Code] IN ({placeholders})"
            params.extend(region_codes)
            logger.info(f"Added region codes filter: {region_codes}")
            
        if country_codes:
            placeholders = ','.join(['?' for _ in country_codes])
            query += f" AND g.[Customer Geography Hrchy L1 Name] IN ({placeholders})"
            params.extend(country_codes)
            logger.info(f"Added country codes filter: {country_codes}")
            
        if sub_region_codes:
            placeholders = ','.join(['?' for _ in sub_region_codes])
            query += f" AND g.[Customer Geography Hrchy L2 Code] IN ({placeholders})"
            params.extend(sub_region_codes)
            logger.info(f"Added sub-region codes filter: {sub_region_codes}")
            
        logger.info("Executing SQL query")
        logger.info(f"Query: {query}")
        logger.info(f"Parameters: {params}")
        
        df = pd.read_sql_query(query, conn, params=params)
        
        if df.empty:
            logger.warning("No data found for the specified criteria")
            return None
            
        logger.info(f"Retrieved {len(df)} rows from database")
        
        # Ensure date column is properly formatted
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        
        # Calculate additional metrics with proper error handling
        try:
            logger.info("Calculating additional metrics")
            df['margin_pct'] = (df['gross_profit_amount'] / df['net_sales_amount'].replace(0, np.nan)) * 100
            df['revenue_per_unit'] = df['net_sales_amount'] / df['net_sales_quantity'].replace(0, np.nan)
            logger.info("Successfully calculated additional metrics")
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            return None
        
        # Rename columns to match expected format
        df = df.rename(columns={
            'net_sales_amount': 'revenue',
            'net_sales_quantity': 'units',
            'gross_profit_amount': 'margin',
            'transaction_date': 'Txn Date'
        })
        
        # Ensure all required columns exist
        required_columns = ['region_name', 'revenue', 'units', 'margin', 'Txn Date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logger.error(f"Missing required columns after processing: {missing_columns}")
            return None
            
        logger.info("Successfully prepared sales data")
        return df
        
    except sqlite3.Error as e:
        logger.error(f"Database error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error getting sales data: {str(e)}")
        return None
    finally:
        if 'conn' in locals():
            conn.close()
            logger.info("Database connection closed")

def save_visualization(fig: plt.Figure, filename: str) -> str:
    """Save visualization to the specified path and return the file path."""
    try:
        os.makedirs(VISUALIZATION_PATH, exist_ok=True)
        filepath = os.path.join(VISUALIZATION_PATH, filename)
        fig.savefig(filepath, bbox_inches='tight', dpi=300)
        plt.close(fig)
        return filepath
    except Exception as e:
        logger.error(f"Error saving visualization: {str(e)}")
        return None

def analyze_regional_sales(time_period: str = "annual",
                         analysis_type: str = "performance",
                         metric: str = "revenue",
                         region_codes: Optional[List[str]] = None,
                         country_codes: Optional[List[str]] = None,
                         sub_region_codes: Optional[List[str]] = None,
                         include_sub_regions: bool = False,
                         start_date: Optional[str] = None,
                         end_date: Optional[str] = None) -> Dict[str, Any]:
    try:
        # Validate inputs
        if not time_period or not analysis_type or not metric:
            return {"error": "Missing required parameters: time_period, analysis_type, or metric"}
            
        # Get sales data
        df = get_sales_data(
            time_period=time_period,
            region_codes=region_codes,
            country_codes=country_codes,
            sub_region_codes=sub_region_codes,
            include_sub_regions=include_sub_regions,
            start_date=start_date,
            end_date=end_date
        )
        
        if df is None or df.empty:
            return {"error": "No data available for the specified criteria"}
            
        # Prepare regional data
        prepared_data = prepare_regional_data(df, include_sub_regions)
        if prepared_data is None or prepared_data.empty:
            return {"error": "Failed to prepare regional data"}
            
        # Analyze performance
        if analysis_type == "performance":
            result = analyze_regional_performance(
                prepared_data,
                metric=metric,
                include_growth=True,
                include_sub_regions=include_sub_regions
            )
            
            if "error" in result:
                return result
                
            # Create visualizations
            try:
                # Create regional map visualization
                map_viz = create_regional_map_visualization(prepared_data, metric)
                if map_viz:
                    result["map_visualization"] = map_viz
                    
                # Create time series chart
                time_series_viz = create_region_time_series_chart(prepared_data, metric)
                if time_series_viz:
                    result["time_series_visualization"] = time_series_viz
                    
                # Create comparison chart
                comparison_viz = create_region_comparison_chart(prepared_data, metric)
                if comparison_viz:
                    result["comparison_visualization"] = comparison_viz
                    
                # Create growth chart
                growth_viz = create_region_growth_chart(prepared_data, metric)
                if growth_viz:
                    result["growth_visualization"] = growth_viz
                    
                # Create treemap visualization
                treemap_viz = create_region_treemap_visualization(prepared_data, metric)
                if treemap_viz:
                    result["treemap_visualization"] = treemap_viz
                    
            except Exception as e:
                logger.error(f"Error creating visualizations: {str(e)}")
                # Continue without visualizations
                
            return result
            
        elif analysis_type == "time_series":
            # Analyze time series for each region
            time_series_results = {}
            for region in prepared_data['region_name'].unique():
                region_result = analyze_region_time_series(
                    prepared_data,
                    region,
                    metric=metric,
                    include_sub_regions=include_sub_regions
                )
                time_series_results[region] = region_result
                
            return {"time_series_analysis": time_series_results}
            
        elif analysis_type == "comparison":
            # Compare regions
            return compare_regions(
                prepared_data,
                region_codes or prepared_data['region_name'].unique().tolist(),
                metric=metric,
                include_sub_regions=include_sub_regions
            )
            
        elif analysis_type == "opportunities":
            # Identify regional opportunities
            return identify_regional_opportunities(
                prepared_data,
                metric=metric,
                include_sub_regions=include_sub_regions
            )
            
        else:
            return {"error": f"Invalid analysis type: {analysis_type}"}
            
    except Exception as e:
        logger.error(f"Error in analyze_regional_sales: {str(e)}")
        return {"error": str(e)}

def test_regional_sales_analysis():
    """Test function to identify where errors might be occurring in regional sales analysis."""
    try:
        logger.info("Starting regional sales analysis test")
        
        # Test 1: Get sales data
        logger.info("Testing get_sales_data...")
        df = get_sales_data(
            time_period="annual",
            start_date="2019-01-01",
            end_date="2019-12-31"
        )
        
        if df is None or df.empty:
            logger.error("Failed to get sales data")
            return {"error": "Failed to get sales data"}
            
        logger.info(f"Successfully retrieved sales data with {len(df)} rows")
        
        # Test 2: Prepare regional data
        logger.info("Testing prepare_regional_data...")
        from orchestration_agent.tools.sales_analyst.utils.regional_data_utils import prepare_regional_data
        prepared_data = prepare_regional_data(df)
        
        if prepared_data is None or prepared_data.empty:
            logger.error("Failed to prepare regional data")
            return {"error": "Failed to prepare regional data"}
            
        logger.info(f"Successfully prepared regional data with {len(prepared_data)} rows")
        
        # Test 3: Analyze regional performance
        logger.info("Testing analyze_regional_performance...")
        from orchestration_agent.tools.sales_analyst.utils.regional_performance_utils import analyze_regional_performance
        result = analyze_regional_performance(
            prepared_data,
            metric="revenue",
            include_growth=True
        )
        
        if "error" in result:
            logger.error(f"Error in analyze_regional_performance: {result['error']}")
            return result
            
        logger.info("Successfully completed regional performance analysis")
        return result
        
    except Exception as e:
        logger.error(f"Error in test_regional_sales_analysis: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Run the test
    result = test_regional_sales_analysis()
    print("Test Result:", result)

def _create_visualization(self, data: pd.DataFrame) -> None:
    """
    Create a visualization of regional sales data.
    
    Args:
        data: DataFrame containing regional sales data
        
    Returns:
        None (prints Base64 URL instead)
    """
    try:
        # Create figure with multiple subplots
        fig = plt.figure(figsize=(15, 10))
        
        # Regional sales distribution
        ax1 = plt.subplot(2, 2, 1)
        region_sales = data.groupby('Region')['Sales Amount'].sum()
        region_sales.plot(kind='bar', ax=ax1, color='blue', alpha=0.7)
        ax1.set_title('Sales by Region')
        ax1.set_xlabel('Region')
        ax1.set_ylabel('Sales Amount')
        plt.xticks(rotation=45)
        plt.grid(True, alpha=0.3)
        
        # Sales trend by region
        ax2 = plt.subplot(2, 2, 2)
        for region in data['Region'].unique():
            region_data = data[data['Region'] == region]
            daily_sales = region_data.groupby('Txn Date')['Sales Amount'].sum()
            ax2.plot(daily_sales.index, daily_sales.values, marker='o', alpha=0.7, label=region)
        ax2.set_title('Daily Sales Trend by Region')
        ax2.set_xlabel('Date')
        ax2.set_ylabel('Sales Amount')
        plt.xticks(rotation=45)
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Regional performance metrics
        ax3 = plt.subplot(2, 2, 3)
        metrics = ['Sales Amount', 'Quantity', 'Profit']
        region_metrics = data.groupby('Region')[metrics].sum()
        region_metrics.plot(kind='bar', ax=ax3, alpha=0.7)
        ax3.set_title('Regional Performance Metrics')
        ax3.set_xlabel('Region')
        ax3.set_ylabel('Value')
        plt.xticks(rotation=45)
        plt.grid(True, alpha=0.3)
        
        # Regional customer distribution
        ax4 = plt.subplot(2, 2, 4)
        region_customers = data.groupby('Region')['Customer ID'].nunique()
        region_customers.plot(kind='pie', ax=ax4, autopct='%1.1f%%', startangle=90)
        ax4.set_title('Customer Distribution by Region')
        ax4.set_ylabel('')
        
        plt.tight_layout()
        
        # Save plot to buffer
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', dpi=150)
        buffer.seek(0)
        
        # Convert to base64
        plot_data = base64.b64encode(buffer.read()).decode()
        
        # Close plot to free memory
        plt.close()
        
        # Print the Base64 URL instead of returning it
        print(f"data:image/png;base64,{plot_data}")
        
    except Exception as e:
        self.logger.error(f"Error creating visualization: {str(e)}")
        raise
 
 
 