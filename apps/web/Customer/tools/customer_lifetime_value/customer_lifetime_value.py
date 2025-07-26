import pandas as pd
import numpy as np
from datetime import datetime
import sqlite3
import logging
from typing import Optional
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from ltv_utils import (
    prepare_features,
    train_model,
    predict_ltv,
    visualize_predictions
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def predict_customer_ltv(
    time_period: str = "quarterly",
    segment_id: Optional[int] = None,
    include_visualization: bool = False,
    training_epochs: int = 100,
    batch_size: int = 32
) -> str:
    """
    Predicts customer lifetime value using historical transaction data.
    """
    try:
        # Set database path using absolute path for reliability
        db_path = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database", "customers.db"))
        logger.info(f"Starting LTV prediction with parameters: time_period={time_period}, segment_id={segment_id}")
        
        # Connect to database
        db_connector = sqlite3.connect(db_path)
        
        # Parse time period
        start_date, end_date = _parse_time_period(time_period)
        logger.info(f"Using date range: {start_date} to {end_date}")
        
        # Simplified query with explicit handling of NULL values
        query = """
        SELECT 
            c.[Customer Key] as customer_id,
            c.[Customer Type Desc] as customer_type,
            c.[Customer State/Prov] as region,
            COALESCE(c.[Credit Limit Amount], 0) as credit_limit,
            COUNT(DISTINCT t.[Sales Txn Key]) as transaction_count,
            COALESCE(AVG(t.[Net Sales Amount]), 0) as avg_transaction_value,
            COALESCE(SUM(t.[Net Sales Amount]), 0) as total_spend,
            MAX(t.[Txn Date]) as last_purchase_date,
            MIN(t.[Txn Date]) as first_purchase_date
        FROM dbo_D_Customer c
        LEFT JOIN dbo_F_Sales_Transaction t 
            ON c.[Customer Key] = t.[Customer Key]
            AND t.[Txn Date] BETWEEN ? AND ?
        WHERE c.[Customer Key] > 0
        """
        
        if segment_id is not None:
            query += f" AND c.[Customer Category Hrchy Code] = '{segment_id}'"
            
        query += " GROUP BY c.[Customer Key], c.[Customer Type Desc], c.[Customer State/Prov], c.[Credit Limit Amount]"
        
        df = pd.read_sql_query(query, db_connector, params=(start_date, end_date))
        logger.info(f"Fetched {len(df)} customer records")
        
        # Debug: Check if we have any non-zero values
        logger.info(f"Total spend range: min={df['total_spend'].min()}, max={df['total_spend'].max()}, mean={df['total_spend'].mean()}")
        logger.info(f"Transaction count range: min={df['transaction_count'].min()}, max={df['transaction_count'].max()}, mean={df['transaction_count'].mean()}")
        
        if df.empty:
            return "No customer data found for the specified parameters."
            
        # Basic feature engineering
        try:
            # Convert date columns to datetime
            df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'])
            df['first_purchase_date'] = pd.to_datetime(df['first_purchase_date'])
            
            # Calculate days between purchases, handling edge cases
            df['days_between_purchases'] = (df['last_purchase_date'] - df['first_purchase_date']).dt.days
            df['days_between_purchases'] = df['days_between_purchases'].clip(1)  # Ensure at least 1 day
            
            # Calculate purchase frequency
            df['purchase_frequency'] = df['transaction_count'] / df['days_between_purchases']
            
            # Ensure all numeric columns are non-negative
            for col in ['credit_limit', 'transaction_count', 'avg_transaction_value', 'total_spend', 'purchase_frequency']:
                df[col] = df[col].clip(lower=0)
            
            # Simple feature set
            feature_cols = ['credit_limit', 'transaction_count', 'avg_transaction_value', 'purchase_frequency']
            X, y = prepare_features(df, feature_cols)
            
            # Debug: Check feature values
            logger.info(f"Feature ranges: {[(col, X[:, i].min(), X[:, i].max()) for i, col in enumerate(feature_cols)]}")
            logger.info(f"Target range: min={y.min()}, max={y.max()}, mean={y.mean()}")
            
            # Train model
            model, scaler = train_model(X, y)
            predictions = predict_ltv(model, scaler, X)
            
            # Debug: Check prediction values
            logger.info(f"Prediction range: min={predictions.min()}, max={predictions.max()}, mean={predictions.mean()}")
            
        except Exception as e:
            logger.error(f"Error in model training/prediction: {str(e)}")
            return f"Error in LTV prediction: {str(e)}"
        
        # Format results
        result = []
        result.append("# Customer Lifetime Value Analysis\n")
        result.append(f"Analysis Period: {start_date} to {end_date}")
        result.append(f"Total Customers Analyzed: {len(df):,}\n")
        
        result.append("## Overall LTV Metrics")
        result.append(f"Average Predicted LTV: ${predictions.mean():,.2f}")
        result.append(f"Median Predicted LTV: ${np.median(predictions):,.2f}")
        
        # Customer type analysis
        result.append("\n## LTV by Customer Type")
        for ctype in df['customer_type'].unique():
            if pd.notna(ctype):
                mask = df['customer_type'] == ctype
                avg_ltv = predictions[mask].mean()
                result.append(f"{ctype}: ${avg_ltv:,.2f}")
        
        # Region analysis
        result.append("\n## LTV by Region")
        for region in df['region'].unique():
            if pd.notna(region):
                mask = df['region'] == region
                avg_ltv = predictions[mask].mean()
                result.append(f"{region}: ${avg_ltv:,.2f}")
        
        # Add visualization if requested
        if include_visualization:
            try:
                viz_data = visualize_predictions(y, predictions)
                result.append("\n## Visualization")
                result.append(f"![LTV Prediction Visualization]({viz_data})")
            except Exception as e:
                logger.error(f"Error creating visualization: {str(e)}")
        
        return "\n".join(result)
        
    except Exception as e:
        logger.error(f"Error in predict_customer_ltv: {str(e)}")
        return f"Error predicting customer lifetime value: {str(e)}"

def _parse_time_period(time_period: str) -> tuple:
    """Parses the time period string into start and end dates."""
    if ":" in time_period:
        return time_period.split(":")
        
    end_date = datetime.now().strftime('%Y-%m-%d')
    if time_period == "monthly":
        start_date = (datetime.now() - pd.DateOffset(months=1)).strftime('%Y-%m-%d')
    elif time_period == "quarterly":
        start_date = (datetime.now() - pd.DateOffset(months=3)).strftime('%Y-%m-%d')
    elif time_period == "annual":
        start_date = (datetime.now() - pd.DateOffset(years=1)).strftime('%Y-%m-%d')
    else:
        start_date = (datetime.now() - pd.DateOffset(months=3)).strftime('%Y-%m-%d')
        
    return start_date, end_date 