"""Purchase frequency analysis tool for customer insights."""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sqlite3
import logging
import os
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_purchase_frequency(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    customer_segments: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Analyze customer purchase frequencies and patterns.
    
    Args:
        start_date (Optional[str]): Start date for analysis (YYYY-MM-DD)
        end_date (Optional[str]): End date for analysis (YYYY-MM-DD)
        customer_segments (Optional[List[str]]): List of customer segments to analyze
        
    Returns:
        Dict containing text-based analysis of purchase frequency patterns
    """
    try:
        # Connect to database
        db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
        conn = sqlite3.connect(db_path)
        
        # Build the query
        query = """
        SELECT 
            s."Customer Key" as customer_id,
            s."Txn Date" as transaction_date,
            CAST(s."Net Sales Amount" as FLOAT) as transaction_amount
        FROM "dbo_F_Sales_Transaction" s
        WHERE 1=1
        """
        
        if start_date:
            query += f" AND s.\"Txn Date\" >= '{start_date}'"
        if end_date:
            query += f" AND s.\"Txn Date\" <= '{end_date}'"
            
        # Execute query and load into DataFrame
        df = pd.read_sql(query, conn)
        conn.close()
        
        # Convert transaction_date to datetime
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        
        # Calculate key metrics
        customer_metrics = {}
        insights = []
        
        for customer_id, group in df.groupby('customer_id'):
            dates = group['transaction_date'].sort_values()
            intervals = dates.diff().dropna()
            
            metrics = {
                'total_purchases': len(dates),
                'avg_interval_days': intervals.dt.total_seconds().mean() / (24 * 3600) if len(intervals) > 0 else 0,
                'first_purchase': dates.min(),
                'last_purchase': dates.max(),
                'total_spent': group['transaction_amount'].sum(),
                'avg_transaction': group['transaction_amount'].mean()
            }
            
            customer_metrics[customer_id] = metrics
        
        # Convert to DataFrame for analysis
        metrics_df = pd.DataFrame(customer_metrics).T
        
        # Generate insights
        total_customers = len(metrics_df)
        if total_customers == 0:
            return {
                'status': 'success',
                'report': 'No transactions found for the specified date range.'
            }
            
        avg_purchase_frequency = metrics_df['total_purchases'].mean()
        avg_interval = metrics_df['avg_interval_days'].mean()
        
        insights.append(f"Analysis Period: {start_date or 'All time'} to {end_date or 'Present'}")
        insights.append(f"Total Customers Analyzed: {total_customers}")
        insights.append(f"Average Purchases per Customer: {avg_purchase_frequency:.2f}")
        insights.append(f"Average Days Between Purchases: {avg_interval:.1f}")
        
        # Frequency segments
        high_frequency = metrics_df[metrics_df['total_purchases'] > avg_purchase_frequency * 1.5]
        low_frequency = metrics_df[metrics_df['total_purchases'] < avg_purchase_frequency * 0.5]
        
        insights.append(f"\nCustomer Purchase Frequency Breakdown:")
        insights.append(f"- High Frequency Customers (>{avg_purchase_frequency * 1.5:.1f} purchases): {len(high_frequency)} ({len(high_frequency)/total_customers*100:.1f}%)")
        insights.append(f"- Low Frequency Customers (<{avg_purchase_frequency * 0.5:.1f} purchases): {len(low_frequency)} ({len(low_frequency)/total_customers*100:.1f}%)")
        
        # Recent purchase patterns
        recent_cutoff = pd.Timestamp.now() - pd.Timedelta(days=90)
        recent_customers = metrics_df[metrics_df['last_purchase'] >= recent_cutoff]
        insights.append(f"\nRecent Purchase Patterns (Last 90 Days):")
        insights.append(f"- Active Customers: {len(recent_customers)} ({len(recent_customers)/total_customers*100:.1f}%)")
        
        # Value analysis
        avg_transaction_mean = metrics_df['avg_transaction'].mean()
        high_value = metrics_df[metrics_df['avg_transaction'] > avg_transaction_mean * 1.5]
        insights.append(f"\nTransaction Value Patterns:")
        insights.append(f"- High Value Customers (Avg transaction > ${avg_transaction_mean * 1.5:.2f}): {len(high_value)} ({len(high_value)/total_customers*100:.1f}%)")
        
        return {
            'status': 'success',
            'report': '\n'.join(insights)
        }
        
    except Exception as e:
        logger.error(f"Error in purchase frequency analysis: {str(e)}")
        return {
            'status': 'error',
            'report': f"Failed to analyze purchase frequency: {str(e)}"
        } 