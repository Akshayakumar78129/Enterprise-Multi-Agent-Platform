"""
Sales Analyst Tools

This module provides tools for sales analysis and forecasting.
"""

from typing import Dict, Any, Optional, Literal, List
from .tools.DemandForecastEngine import DemandForecastEngine
from .tools.SalesTrendAnalyzer import SalesTrendAnalyzer
from .tools.SalesPerformanceAnalyzer import SalesPerformanceAnalyzer
from .tools.ProductPerformanceAnalyzer import ProductPerformanceAnalyzer
from .tools.RegionalSalesAnalyzer import analyze_regional_sales
from datetime import datetime, timedelta
import logging
from pathlib import Path
logger = logging.getLogger(__name__)

sales_agent_db_path = Path(__file__).parent.parent.parent.joinpath('database', 'sales_agent.db')

def register_tools():
    """Register sales analyst tools in priority order."""
    tools = []
    
    # Register regional sales analysis tool
    tools.append({
        "name": "analyze_regional_sales",
        "description": "Analyze regional sales data and performance across different dimensions",
        "function": analyze_regional_sales
    })
    
    # Register product performance analysis tool first (highest priority)
    def analyze_product_performance(metrics: List[Literal['sales', 'units', 'margin', 'price_bands']] = ['sales', 'units', 'margin', 'price_bands'],
                                  category_level: Literal['product', 'category', 'subcategory'] = 'product',
                                  min_sales_threshold: Optional[float] = None,
                                  include_visualization: bool = True,
                                  start_date: Optional[str] = None,
                                  end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze product performance metrics including sales, margins, inventory turns, and product mix.
        
        Args:
            metrics: List of metrics to analyze ('sales', 'units', 'margin', 'price_bands')
            category_level: Level of product categorization ('product', 'category', 'subcategory')
            min_sales_threshold: Optional minimum sales amount to include in analysis
            include_visualization: Whether to include visualizations in results
            start_date: Optional start date in YYYY-MM-DD format
            end_date: Optional end date in YYYY-MM-DD format
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Initialize analyzer
            analyzer = ProductPerformanceAnalyzer(
                metrics=metrics,
                category_level=category_level,
                min_sales_threshold=min_sales_threshold,
                include_visualization=include_visualization
            )
            
            # Analyze performance
            result = analyzer.analyze_performance(start_date=start_date, end_date=end_date)
            
            if result["status"] == "error":
                return result
                
            # Add metadata
            result["metadata"] = {
                "metrics": metrics,
                "category_level": category_level,
                "min_sales_threshold": min_sales_threshold,
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in product performance analysis: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    tools.append({
        "name": "analyze_product_performance",
        "description": "Analyze product performance metrics including sales, margins, inventory turns, and product mix",
        "function": analyze_product_performance
    })
    
    # Register sales performance analysis tool
    def analyze_sales_performance(dimension: Literal['product', 'category', 'channel', 'region', 'customer', 'time'],
                                time_period: Optional[Literal['last_7_days', 'last_30_days', 'last_90_days', 'last_year']] = None,
                                metric: Literal['revenue', 'units', 'aov', 'growth', 'margin'] = "revenue",
                                filters: Optional[Dict[str, Any]] = None,
                                comparison_mode: Optional[Literal['period_over_period', 'year_over_year']] = None,
                                start_date: Optional[str] = None,
                                end_date: Optional[str] = None,
                                include_visualization: bool = True) -> Dict[str, Any]:
        """
        Analyze sales performance across different dimensions.
        
        Args:
            dimension: Primary dimension to analyze ('product', 'category', 'channel', 'region', 'customer', 'time')
            time_period: Optional time period to analyze ('last_7_days', 'last_30_days', 'last_90_days', 'last_year')
            metric: Primary metric to analyze ('revenue', 'units', 'aov', 'growth', 'margin')
            filters: Optional filters to narrow down the analysis
            comparison_mode: Optional comparison mode ('period_over_period', 'year_over_year')
            start_date: Optional start date in YYYY-MM-DD format
            end_date: Optional end date in YYYY-MM-DD format
            include_visualization: Whether to include visualizations in the output
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Validate that either time_period or custom dates are provided
            if not time_period and not (start_date and end_date):
                return {
                    "status": "error",
                    "message": "Either time_period or both start_date and end_date must be provided"
                }
            
            # Initialize analyzer with database path
            analyzer = SalesPerformanceAnalyzer(
                dimension=dimension,
                time_period=time_period or "custom",  # Use "custom" as placeholder when using custom dates
                metric=metric,
                filters=filters,
                comparison_mode=comparison_mode,
                db_path=sales_agent_db_path,
                include_visualization=include_visualization
            )
            
            # Analyze performance
            result = analyzer.analyze_performance(start_date=start_date, end_date=end_date)
            
            if result["status"] == "error":
                return result
                
            # Add metadata
            result["metadata"] = {
                "dimension": dimension,
                "metric": metric,
                "time_period": time_period or f"custom ({start_date} to {end_date})",
                "filters": filters,
                "comparison_mode": comparison_mode,
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in sales performance analysis: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    tools.append({
        "name": "analyze_sales_performance",
        "description": "Analyze sales performance across different dimensions (product, category, channel, region, customer, time)",
        "function": analyze_sales_performance
    })
    
    # Register sales trends analysis tool
    def analyze_sales_trends(time_period: Optional[Literal['daily', 'weekly', 'monthly', 'quarterly', 'annual']] = 'monthly', 
                           metric: Literal['revenue', 'units', 'aov', 'margin'] = "revenue", 
                           dimension: Optional[Literal['product', 'category', 'channel', 'region', 'customer']] = None, 
                           top_n: int = 5,
                           filters: Optional[Dict[str, Any]] = None,
                           include_visualization: bool = True,
                           trend_periods: int = 12,
                           start_date: Optional[str] = None,
                           end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze sales trends over time.
        
        Args:
            time_period: Time period for analysis ('daily', 'weekly', 'monthly', 'quarterly', 'annual')
            metric: Metric to analyze ('revenue', 'units', 'aov', 'margin')
            dimension: Optional dimension to break down trends
            top_n: Number of top items to show in breakdown
            filters: Optional filters to narrow down the analysis
            include_visualization: Whether to include visualizations
            trend_periods: Number of periods to include in trend analysis
            start_date: Optional start date in YYYY-MM-DD format
            end_date: Optional end date in YYYY-MM-DD format
            
        Returns:
            Dictionary containing trend analysis results
        """
        try:
            # Initialize analyzer
            analyzer = SalesTrendAnalyzer(
                time_period=time_period,
                metric=metric,
                dimension=dimension,
                top_n=top_n,
                filters=filters,
                include_visualization=include_visualization,
                trend_periods=trend_periods
            )
            
            # Analyze trends
            result = analyzer.analyze_trends(start_date=start_date, end_date=end_date)
            
            if result["status"] == "error":
                return result
                
            # Add metadata
            result["metadata"] = {
                "time_period": time_period,
                "metric": metric,
                "dimension": dimension,
                "top_n": top_n,
                "trend_periods": trend_periods,
                "analysis_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in sales trend analysis: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    tools.append({
        "name": "analyze_sales_trends",
        "description": "Analyze sales trends over time with optional dimension breakdowns",
        "function": analyze_sales_trends
    })
    
    # Initialize the demand forecast engine
    forecast_engine = DemandForecastEngine()
    
    # Register demand forecast tool last (lowest priority)
    def demand_forecast(period_type: Literal['month', 'quarter', 'year'], 
                       product_id: Optional[str] = None, 
                       region: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate demand forecast for specified period type.
        
        Args:
            period_type: Type of forecast period ('month', 'quarter', or 'year')
            product_id: Optional product ID to filter by
            region: Optional region to filter by
            
        Returns:
            Dictionary containing forecast results
        """
        try:
            # Initialize forecast engine with database path
            forecast_engine.db_path = sales_agent_db_path
            
            # Generate forecast using the period-based method
            forecast = forecast_engine.generate_forecast_for_period(period_type, product_id, region)
            
            if 'error' in forecast:
                return forecast
                
            # Get historical data for patterns
            data = forecast_engine.prepare_demand_data()
            patterns = forecast_engine.analyze_demand_patterns(data)
            
            return {
                "patterns": patterns,
                "forecast": forecast,
                "visualization": forecast['visualization']
            }
            
        except Exception as e:
            logger.error(f"Error in demand forecast: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    tools.append({
        "name": "demand_forecast",
        "description": "Generate demand forecast for specified period type (month/quarter/year) with optional product and region filters",
        "function": demand_forecast
    })
    
    return tools 