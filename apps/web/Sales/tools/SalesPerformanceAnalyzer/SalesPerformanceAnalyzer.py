"""
Sales Performance Analyzer tool for analyzing sales performance across different dimensions.
"""

import pandas as pd
import numpy as np
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Union, Literal
from pydantic import Field
import os 
import sys
import sqlite3
import matplotlib.pyplot as plt
import io
import base64

# Make sure our project root is in the path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
sys.path.insert(0, project_root)

from Sales.database.connection import get_connection
from Sales.database.query_templates import get_date_range, get_latest_date
from visualization_utils import (
    save_matplotlib_plot,
    save_plotly_plot,
    create_performance_plot,
    generate_filename
)
from Sales.database import config

logger = logging.getLogger(__name__)

class SalesPerformanceAnalyzer:
    """
    Analyzes sales performance across different dimensions (products, channels, regions, time)
    and calculates key metrics such as revenue, units sold, growth rates, and contribution margins.
    """
    
    VALID_DIMENSIONS = ['product', 'category', 'channel', 'region', 'customer', 'time']
    VALID_METRICS = ['revenue', 'units', 'aov', 'growth', 'margin']
    VALID_TIME_PERIODS = ['last_7_days', 'last_30_days', 'last_90_days', 'last_year', 'custom']
    
    def __init__(self, dimension: str, time_period: str, metric: str, 
                 filters: Optional[Dict[str, Any]] = None,
                 comparison_mode: Optional[str] = None,
                 db_path: str = None,
                 include_visualization: bool = True):
        """
        Initialize the SalesPerformanceAnalyzer.
        
        Args:
            dimension: Primary dimension to analyze ('product', 'category', 'channel', 'region', 'customer', 'time')
            time_period: Time period to analyze ('last_7_days', 'last_30_days', 'last_90_days', 'last_year', 'custom')
            metric: Primary metric to analyze ('revenue', 'units', 'aov', 'growth', 'margin')
            filters: Optional filters to narrow down the analysis
            comparison_mode: Optional comparison mode ('period_over_period', 'year_over_year')
            db_path: Path to the SQLite database file
            include_visualization: Whether to include visualizations in the output
        """
        self.dimension = dimension
        self.time_period = time_period
        self.metric = metric
        self.filters = filters or {}
        self.comparison_mode = comparison_mode
        self.db_path = db_path or config.DATABASE['path']
        self.include_visualization = include_visualization
        
    def analyze_performance(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze sales performance for the given date range.
        
        Args:
            start_date: Start date in YYYY-MM-DD format, if None uses earliest available date
            end_date: End date in YYYY-MM-DD format, if None uses latest available date
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Validate inputs
            if self.dimension not in self.VALID_DIMENSIONS:
                return {
                    "status": "error",
                    "message": f"Invalid dimension. Must be one of {self.VALID_DIMENSIONS}"
                }
            if self.metric not in self.VALID_METRICS:
                return {
                    "status": "error",
                    "message": f"Invalid metric. Must be one of {self.VALID_METRICS}"
                }
            if self.time_period not in self.VALID_TIME_PERIODS:
                return {
                    "status": "error",
                    "message": f"Invalid time period. Must be one of {self.VALID_TIME_PERIODS}"
                }
            
            # Use specialized regional analysis if dimension is region
            if self.dimension == 'region':
                return self.analyze_regional_sales(start_date, end_date)
            
            # Get database connection
            conn, wrapper = get_connection()
            
            # Get date range if not specified
            if not end_date:
                end_date = get_latest_date(conn)
            if not start_date:
                if self.time_period == "custom":
                    return {
                        "status": "error",
                        "message": "start_date and end_date must be provided when using custom time period"
                    }
                start_date = (datetime.strptime(end_date, "%Y-%m-%d") - timedelta(days=30)).strftime("%Y-%m-%d")
            
            # Build query
            query = self._build_query()
            params = [start_date, end_date]
            
            # Add filter clause if filters are specified
            filter_clause = self._get_filter_clause()
            if filter_clause:
                query = query.replace("ORDER BY", f"{filter_clause} ORDER BY")
                for value in self.filters.values():
                    params.append(value)
            
            # Execute query with parameters
            results = wrapper.fetchall(query, params)
            
            if not results:
                return {
                    "status": "error",
                    "message": "No data found"
                }
            
            # Convert to DataFrame with column names
            columns = ['date', 'amount', 'quantity', 'customer_name', 'product_name', 
                      'category', 'subcategory', 'region_name']
            data = pd.DataFrame(results, columns=columns)
            
            # Group by dimension
            dimension_col = self._get_dimension_column()
            grouped = data.groupby(dimension_col)
            
            # Calculate metrics
            if self.metric == "revenue":
                result = grouped["amount"].sum()
            elif self.metric == "units":
                result = grouped["quantity"].sum()
            elif self.metric == "aov":
                result = grouped["amount"].sum() / grouped["quantity"].sum()
            elif self.metric == "growth":
                # Calculate growth rate
                result = grouped["amount"].sum().pct_change() * 100
            elif self.metric == "margin":
                # Calculate margin (assuming we have cost data)
                result = (grouped["amount"].sum() - grouped["quantity"].sum() * 10) / grouped["amount"].sum() * 100
            
            # Format result
            result_df = result.reset_index()
            result_df.columns = [dimension_col, 'value']
            
            # Create visualizations if requested
            visualization_paths = {}
            if self.include_visualization:
                try:
                    # Create performance plot
                    title = f"{self.metric.title()} by {self.dimension.title()}"
                    x_label = self.dimension.title()
                    y_label = self.metric.title()
                    
                    mpl_fig, plotly_fig = create_performance_plot(
                        result_df,
                        title=title,
                        x_label=x_label,
                        y_label=y_label,
                        plot_type="bar" if self.dimension != "time" else "line"
                    )
                    
                    # Save visualizations
                    filename = generate_filename(
                        f"{self.dimension}_{self.metric}",
                        f"_{start_date}_to_{end_date}"
                    )
                    
                    # Save matplotlib plot
                    png_path = save_matplotlib_plot(mpl_fig, filename)
                    
                    # Save plotly plot
                    html_path, plotly_png_path = save_plotly_plot(plotly_fig, filename)
                    
                    visualization_paths = {
                        "matplotlib": png_path,
                        "plotly_html": html_path,
                        "plotly_png": plotly_png_path
                    }
                    
                except Exception as e:
                    logger.error(f"Error creating visualizations: {str(e)}")
                    visualization_paths = {
                        "error": str(e)
                    }
            
            # Close connections
            conn.close()
            wrapper.close()
            
            return {
                "status": "success",
                "dimension": self.dimension,
                "metric": self.metric,
                "data": result_df.to_dict('records'),
                "visualizations": visualization_paths
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_performance: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    def _build_query(self) -> str:
        """Build the SQL query based on the analysis requirements."""
        base_query = """
            SELECT 
                t."Txn Date" as date,
                t."Net Sales Amount" as amount,
                t."Net Sales Quantity" as quantity,
                c."Customer Name" as customer_name,
                i."Item Desc" as product_name,
                i."Item Category Desc" as category,
                i."Item Subcategory Desc" as subcategory,
                r."Sales Org Hrchy L1 Name" as region_name
            FROM "dbo_F_Sales_Transaction" t
            LEFT JOIN "dbo_D_Customer" c ON t."Customer Key" = c."Customer Key"
            LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
            LEFT JOIN "dbo_D_Sales_Organization" r ON t."Sales Organization Key" = r."Sales Organization Key"
            WHERE t."Txn Date" BETWEEN ? AND ?
                AND t."Deleted Flag" = 0
                AND t."Excluded Flag" = 0
        """
        
        # Add dimension-specific grouping
        if self.dimension == 'product':
            base_query += """
                GROUP BY t."Item Key", i."Item Desc", i."Item Category Desc", i."Item Subcategory Desc"
                ORDER BY SUM(t."Net Sales Amount") DESC
            """
        elif self.dimension == 'category':
            base_query += """
                GROUP BY i."Item Category Desc"
                ORDER BY SUM(t."Net Sales Amount") DESC
            """
        elif self.dimension == 'region':
            base_query += """
                GROUP BY r."Sales Org Hrchy L1 Name"
                ORDER BY SUM(t."Net Sales Amount") DESC
            """
        elif self.dimension == 'customer':
            base_query += """
                GROUP BY c."Customer Name"
                ORDER BY SUM(t."Net Sales Amount") DESC
            """
        else:  # time dimension
            base_query += """
                GROUP BY t."Txn Date"
                ORDER BY t."Txn Date"
            """
        
        return base_query
    
    def _get_filter_clause(self) -> str:
        """Get SQL filter clause based on filters."""
        if not self.filters:
            return ""
        
        conditions = []
        for key, value in self.filters.items():
            if key == "product_category":
                conditions.append(f"i.\"Item Category Desc\" = ?")
            elif key == "region":
                conditions.append(f"r.\"Sales Org Hrchy L1 Name\" = ?")
            # Add more filter conditions as needed
        
        if conditions:
            return "AND " + " AND ".join(conditions)
        return ""
    
    def _get_dimension_column(self) -> str:
        """Get the column name for the specified dimension."""
        dimension_map = {
            "product": "product_name",
            "category": "category",
            "region": "region_name",
            "customer": "customer_name",
            "time": "date"
        }
        return dimension_map.get(self.dimension, "date")
    
    def _add_comparison(self, result: pd.DataFrame, original_data: pd.DataFrame) -> pd.DataFrame:
        """Add comparison data to the results."""
        if self.comparison_mode == "period_over_period":
            # Calculate previous period metrics
            prev_start = (datetime.strptime(self.time_period.split(":")[0], "%Y-%m-%d") - 
                        timedelta(days=30)).strftime("%Y-%m-%d")
            prev_end = self.time_period.split(":")[0]
            
            prev_result = self.analyze_performance(prev_start, prev_end)
            result["Previous_Period"] = prev_result[self.metric]
            result["Growth"] = ((result[self.metric] - result["Previous_Period"]) / 
                              result["Previous_Period"] * 100)
        
        return result
    
    def _format_result(self, result: pd.DataFrame) -> Dict[str, Any]:
        """Format the result for output."""
        if result.empty:
            return {"status": "error", "message": "No data found"}
        
        return {
            "status": "success",
            "dimension": self.dimension,
            "metric": self.metric,
            "time_period": self.time_period,
            "data": result.to_dict(orient="records")
        }

    def _create_visualization(self, data: pd.DataFrame, query_params: Optional[Dict] = None) -> None:
        """
        Create a visualization of sales performance metrics based on query parameters.
        
        Args:
            data: DataFrame containing sales data
            query_params: Dictionary containing query parameters that influence visualization
            
        Returns:
            None (prints Base64 URL instead)
        """
        try:
            # Create figure with multiple subplots
            fig = plt.figure(figsize=(15, 10))
            
            # Apply query-based transformations if provided
            if query_params:
                if 'group_by' in query_params:
                    data = data.groupby(query_params['group_by']).agg(query_params.get('agg_func', 'sum')).reset_index()
                if 'sort_by' in query_params:
                    data = data.sort_values(query_params['sort_by'], ascending=query_params.get('ascending', False))
                if 'filter' in query_params:
                    data = data.query(query_params['filter'])
                if 'limit' in query_params:
                    data = data.head(query_params['limit'])
            
            # Daily sales trend
            ax1 = plt.subplot(2, 2, 1)
            daily_sales = data.groupby('Txn Date')['Sales Amount'].sum()
            ax1.plot(daily_sales.index, daily_sales.values, marker='o', color='blue', alpha=0.7)
            ax1.set_title('Daily Sales Trend')
            ax1.set_xlabel('Date')
            ax1.set_ylabel('Sales Amount')
            plt.xticks(rotation=45)
            plt.grid(True, alpha=0.3)
            
            # Sales by dimension
            ax2 = plt.subplot(2, 2, 2)
            if self.dimension:
                dimension_sales = data.groupby(self.dimension)['Sales Amount'].sum()
                dimension_sales.plot(kind='bar', ax=ax2, color='green', alpha=0.7)
                ax2.set_title(f'Sales by {self.dimension}')
                ax2.set_xlabel(self.dimension)
                ax2.set_ylabel('Sales Amount')
                plt.xticks(rotation=45)
                plt.grid(True, alpha=0.3)
            
            # Sales distribution
            ax3 = plt.subplot(2, 2, 3)
            data['Sales Amount'].hist(ax=ax3, bins=20, color='purple', alpha=0.7)
            ax3.set_title('Sales Distribution')
            ax3.set_xlabel('Sales Amount')
            ax3.set_ylabel('Frequency')
            plt.grid(True, alpha=0.3)
            
            # Sales vs Quantity
            ax4 = plt.subplot(2, 2, 4)
            ax4.scatter(data['Quantity'], data['Sales Amount'], alpha=0.6, color='red')
            ax4.set_title('Sales Amount vs Quantity')
            ax4.set_xlabel('Quantity')
            ax4.set_ylabel('Sales Amount')
            plt.grid(True, alpha=0.3)
            
            # Save plot to buffer
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight', dpi=300)
            buffer.seek(0)
            
            # Convert to base64
            plot_data = base64.b64encode(buffer.read()).decode()
            
            # Close plot to free memory
            plt.close()
            
            # Print the Base64 URL instead of returning it
            print(f"data:image/png;base64,{plot_data}")
            
        except Exception as e:
            logger.error(f"Error creating visualization: {str(e)}")
            raise

    def analyze_regional_sales(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze regional sales performance using the correct table structure.
        
        Args:
            start_date: Start date in YYYY-MM-DD format, if None uses earliest available date
            end_date: End date in YYYY-MM-DD format, if None uses latest available date
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Get database connection
            conn = sqlite3.connect(self.db_path)
            
            # Get date range if not specified
            if not end_date:
                end_date = get_latest_date(conn)
            if not start_date:
                start_date = (datetime.strptime(end_date, "%Y-%m-%d") - timedelta(days=365)).strftime("%Y-%m-%d")
            
            # Build query for regional sales using SQLite syntax
            query = """
                SELECT 
                    g.[Customer Geography Hrchy L1 Name] as region_name,
                    g.[Customer Geography Hrchy L2 Name] as sub_region_name,
                    SUM(s.[Net Sales Amount]) as revenue,
                    SUM(s.[Net Sales Quantity]) as units,
                    SUM(s.[Gross Profit Amount]) as margin
                FROM dbo_F_Sales_Transaction s
                JOIN dbo_D_Customer_Geography_Hierarchy g 
                    ON s.[Customer Geography Hrchy Key] = g.[Customer Geography Hrchy Key]
                WHERE s.[Txn Date] BETWEEN ? AND ?
                    AND s.[Deleted Flag] = 0
                    AND g.[Deleted Flag] = 0
                GROUP BY g.[Customer Geography Hrchy L1 Name], g.[Customer Geography Hrchy L2 Name]
                ORDER BY revenue DESC
            """
            
            
            # Execute query
            df = pd.read_sql_query(query, conn, params=[start_date, end_date])
            
            if df.empty:
                return {
                    "status": "error",
                    "message": "No data found for the specified period"
                }
            
            # Calculate additional metrics
            df['margin_pct'] = (df['margin'] / df['revenue'] * 100).round(2)
            df['revenue_per_unit'] = (df['revenue'] / df['units']).round(2)
            
            # Calculate percentages
            total_revenue = df['revenue'].sum()
            total_units = df['units'].sum()
            df['revenue_pct'] = (df['revenue'] / total_revenue * 100).round(2)
            df['units_pct'] = (df['units'] / total_units * 100).round(2)
            
            # Format the results
            results = {
                "status": "success",
                "dimension": "region",
                "metric": "revenue",
                "data": df.to_dict('records'),
                "summary": {
                    "total_revenue": total_revenue,
                    "total_units": total_units,
                    "total_margin": df['margin'].sum(),
                    "overall_margin_pct": (df['margin'].sum() / total_revenue * 100).round(2)
                }
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Error in analyze_regional_sales: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
        finally:
            if 'conn' in locals():
                conn.close()


if __name__ == "__main__":
    # Test the analyzer with default parameters
    analyzer = SalesPerformanceAnalyzer(
        dimension="product",
        time_period="quarterly",
        metric="revenue"
    )
    result = analyzer.analyze_performance("2019-01-01", "2019-03-31")
    print(result) 