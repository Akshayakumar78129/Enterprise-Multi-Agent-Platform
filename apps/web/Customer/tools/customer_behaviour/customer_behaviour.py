from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
# from google.adk.tools import tool
import pandas as pd
import logging
from datetime import datetime, timedelta
import sqlite3
import os
import sys
from pathlib import Path

# Import utilities - use absolute import instead of relative
import customer_analytics_utils

# Setup logger
logger = logging.getLogger(__name__)

# @tool
def analyze_customer_behavior(
    time_period: str = "quarterly",
    segment_id: Optional[int] = None,
    behavior_types: Optional[List[str]] = ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"],
    min_transactions: int = 2,
    include_visualization: bool = True
) -> str:
    """
    Analyzes customer behavior patterns from a SQLite database, including purchase patterns, 
    product preferences, channel usage, and engagement metrics.
    
    Args:
        time_period: Time period for analysis (e.g., 'monthly', 'quarterly', 'annual', or date range 'YYYY-MM-DD:YYYY-MM-DD')
        segment_id: Optional customer segment ID to filter analysis
        behavior_types: Types of behavior to analyze
        min_transactions: Minimum number of transactions required for a customer to be included in analysis
        include_visualization: Whether to include visualizations in the analysis
        
    Returns:
        Formatted analysis results as a string.
    """
    try:
        # Set database path using absolute path for reliability - fix the path
        db_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database", "customers.db"))
        print(db_path)
        logger.info(f"Starting analysis with parameters: time_period={time_period}, "
                   f"segment_id={segment_id}, behavior_types={behavior_types}")
        
        # Connect to database
        db_connector = sqlite3.connect(db_path)
        
        # Fetch customer data
        customer_data = _fetch_customer_data(db_connector, segment_id)
        logger.info(f"Fetched {len(customer_data)} customer records")
        
        # Fetch transaction data
        transaction_data = _fetch_transaction_data(db_connector, time_period, segment_id)
        logger.info(f"Fetched {len(transaction_data)} transaction records")
        
        # Preprocess data
        processed_data = customer_analytics_utils.preprocess_behavioral_data(
            customer_data, 
            transaction_data,
            min_transactions
        )
        logger.info(f"Preprocessed data for {len(processed_data)} customers")
        
        # Analyze purchase patterns
        purchase_patterns = customer_analytics_utils.analyze_purchase_patterns(processed_data, time_period)
        logger.info("Completed purchase pattern analysis")
        
        # Calculate behavioral metrics
        behavioral_metrics = customer_analytics_utils.calculate_behavioral_metrics(processed_data, behavior_types)
        logger.info("Completed behavioral metrics calculation")
        
        # Generate visualizations if requested
        visualizations = {}
        if include_visualization:
            visualizations = customer_analytics_utils.visualize_behavior_patterns(processed_data, behavior_types)
            logger.info("Generated visualizations")
        
        # Format results
        result = _format_results(purchase_patterns, behavioral_metrics, visualizations, time_period, segment_id)
        
        # Close the database connection
        if db_connector:
            db_connector.close()
            
        return result
        
    except Exception as e:
        logger.error(f"Error in analyze_customer_behavior: {str(e)}")
        return f"Error analyzing customer behavior: {str(e)}"

def _fetch_customer_data(db_connector: sqlite3.Connection, segment_id: Optional[int] = None) -> pd.DataFrame:
    """Fetch customer data from the database."""
    try:
        query = f"""
        SELECT DISTINCT
            c.[Customer Key] as customer_id,
            c.[Customer Name] as customer_name,
            c.[Customer Type Desc] as customer_type,
            c.[Customer Category Hrchy Code] as customer_category,
            c.[Customer Status] as customer_status,
            cl.[Loyalty Status] as loyalty_status,
            cl.[First Activity Date] as customer_since,
            cl.[Last Activity Date] as last_activity_date
        FROM dbo_D_Customer c
        LEFT JOIN dbo_F_Customer_Loyalty cl ON c.[Customer Key] = cl.[Entity Key]
        WHERE c.[Customer Key] > 0  -- Exclude invalid customer keys
        """
        
        if segment_id is not None:
            query += f" AND c.[Customer Category Hrchy Code] = '{segment_id}'"
            
        query += " LIMIT 1000"  # Limit for performance in large databases
        
        return pd.read_sql_query(query, db_connector)
        
    except Exception as e:
        logger.error(f"Error fetching customer data: {str(e)}")
        return pd.DataFrame()

def _fetch_transaction_data(db_connector: sqlite3.Connection, time_period: str, segment_id: Optional[int] = None) -> pd.DataFrame:
    """Fetch transaction data from the database."""
    try:
        start_date, end_date = _parse_time_period(time_period)
        
        query = f"""
        SELECT 
            [Customer Key] as customer_id,
            [Txn Date] as transaction_date,
            [Net Sales Amount] as sales_amount,
            [Net Sales Quantity] as quantity,
            [Item Key] as item_id,
            [Line Type] as sales_channel,
            [Item Category Hrchy Key] as product_category
        FROM dbo_F_Sales_Transaction
        WHERE [Txn Date] BETWEEN '{start_date}' AND '{end_date}'
            AND [Deleted Flag] = 0
            AND [Excluded Flag] = 0
            AND [Customer Key] > 0
            AND [Net Sales Amount] IS NOT NULL
            AND [Net Sales Quantity] IS NOT NULL
        """
        
        if segment_id is not None:
            query += f" AND [Customer Key] IN (SELECT [Customer Key] FROM dbo_D_Customer WHERE [Customer Category Hrchy Code] = '{segment_id}')"
            
        query += " LIMIT 10000"  # Limit for performance in large databases
        
        return pd.read_sql_query(query, db_connector)
        
    except Exception as e:
        logger.error(f"Error fetching transaction data: {str(e)}")
        return pd.DataFrame()
        
def _parse_time_period(time_period: str) -> tuple:
    """Parses the time period string into start and end dates."""
    reference_date = datetime(2021, 1, 1)  # Use 2021 as reference since we have data from 2019-2021
    
    if ":" in time_period:  # Date range format
        dates = time_period.split(":")
        start_date = datetime.strptime(dates[0], "%Y-%m-%d")
        end_date = datetime.strptime(dates[1], "%Y-%m-%d")
    elif time_period == "monthly":
        start_date = reference_date - timedelta(days=30)
        end_date = reference_date
    elif time_period == "quarterly":
        start_date = reference_date - timedelta(days=90)
        end_date = reference_date
    elif time_period == "annual" or time_period == "yearly":
        start_date = reference_date - timedelta(days=365)
        end_date = reference_date
    else:
        # Default to last 90 days of 2020
        start_date = reference_date - timedelta(days=90)
        end_date = reference_date
        
    # Debug logging
    logger.info(f"Date range for analysis: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
    return start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")

def _format_results(purchase_patterns: Dict, behavioral_metrics: Dict, visualizations: Dict, time_period: str, segment_id: Optional[int] = None) -> str:
    """Format the analysis results into a readable string."""
    result = []
    
    # Add summary section
    result.append("=" * 80)
    result.append("CUSTOMER BEHAVIOR ANALYSIS REPORT")
    result.append("=" * 80)
    result.append(f"Analysis Period: {time_period}")
    if segment_id:
        result.append(f"Customer Segment: {segment_id}")
    result.append("=" * 80)
    
    # Add purchase patterns
    result.append("\nPURCHASE PATTERNS")
    result.append("-" * 40)
    result.append("Frequency Distribution:")
    for category, percentage in purchase_patterns.get('frequency_distribution', {}).items():
        result.append(f"  • {category}: {percentage:.2f}%")
    
    result.append(f"\nAverage Days Between Purchases: {purchase_patterns.get('avg_days_between_purchases', 0):.2f}")
    
    result.append("\nSpend Patterns:")
    spend_patterns = purchase_patterns.get('spend_patterns', {})
    result.append(f"  • Average Order Value: ${spend_patterns.get('avg_order_value', 0):.2f}")
    result.append(f"  • Median Order Value: ${spend_patterns.get('median_order_value', 0):.2f}")
    result.append(f"  • Average Items per Order: {spend_patterns.get('avg_items_per_order', 0):.2f}")
    
    # Add behavioral metrics
    result.append("\nBEHAVIORAL METRICS")
    result.append("-" * 40)
    
    # Product Preferences
    if "product_preferences" in behavioral_metrics:
        result.append("\nProduct Preferences:")
        prefs = behavioral_metrics["product_preferences"]
        
        result.append("\nCategory Distribution (Top 10):")
        category_dist = prefs.get("category_distribution", {})
        sorted_categories = sorted(category_dist.items(), key=lambda x: x[1], reverse=True)[:10]
        for category, percentage in sorted_categories:
            result.append(f"  • Category {category}: {percentage:.2f}%")
        
        result.append("\nAverage Spend by Category (Top 10):")
        spend_by_cat = prefs.get("avg_spend_by_category", {})
        sorted_spend = sorted(spend_by_cat.items(), key=lambda x: x[1], reverse=True)[:10]
        for category, amount in sorted_spend:
            result.append(f"  • Category {category}: ${amount:.2f}")
        
        if "insights" in prefs:
            result.append("\nKey Insights:")
            for insight in prefs["insights"]:
                result.append(f"  • {insight}")
    
    # Channel Usage
    if "channel_usage" in behavioral_metrics:
        result.append("\nChannel Usage:")
        channel_data = behavioral_metrics["channel_usage"]
        
        result.append("\nChannel Distribution:")
        for channel, percentage in channel_data.get("channel_distribution", {}).items():
            result.append(f"  • {channel}: {percentage:.2f}%")
        
        result.append("\nAverage Spend by Channel:")
        for channel, amount in channel_data.get("avg_spend_by_channel", {}).items():
            result.append(f"  • {channel}: ${amount:.2f}")
        
        if "insights" in channel_data:
            result.append("\nKey Insights:")
            for insight in channel_data["insights"]:
                result.append(f"  • {insight}")
    
    # Engagement Metrics
    if "engagement_metrics" in behavioral_metrics:
        result.append("\nEngagement Metrics:")
        engagement = behavioral_metrics["engagement_metrics"]
        
        result.append("\nRecency Distribution:")
        for status, percentage in engagement.get("recency_distribution", {}).items():
            result.append(f"  • {status}: {percentage:.2f}%")
        
        result.append("\nEngagement Level Distribution:")
        for level, percentage in engagement.get("engagement_distribution", {}).items():
            result.append(f"  • {level}: {percentage:.2f}%")
        
        result.append(f"\nAverage Engagement Score: {engagement.get('avg_engagement_score', 0):.2f}")
        result.append(f"Churn Risk Percentage: {engagement.get('churn_risk_percentage', 0):.2f}%")
    
    # Add visualizations if available
    if visualizations:
        result.append("\nVISUALIZATIONS")
        result.append("-" * 40)
        for viz_type, viz_data in visualizations.items():
            result.append(f"\n{viz_type.replace('_', ' ').title()}:")
            result.append(viz_data)
    
    return "\n".join(result)