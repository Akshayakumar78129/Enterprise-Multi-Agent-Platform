import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import matplotlib.pyplot as plt
import seaborn as sns
import sqlite3
from datetime import datetime, timedelta
import json
import io
import base64
from typing import Dict, List, Optional, Union, Any
import os

def predict_churn_risk(
    time_period: str = "last_90_days",
    segment_id: Optional[str] = None,
    include_visualization: bool = True,
    training_epochs: int = 100,
    batch_size: int = 32
) -> str:
    """
    Predict customer churn risk using machine learning.
    
    Args:
        time_period: Analysis period ('last_30_days', 'last_90_days', 'last_180_days', 'last_year', or date range)
        segment_id: Optional customer segment to analyze
        include_visualization: Whether to include visualizations
        training_epochs: Number of training epochs for the ML model
        batch_size: Batch size for model training
        
    Returns:
        String containing the analysis results and visualizations
    """
    # Connect to the database
    db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
    
    # Initialize the predictor
    predictor = ChurnRiskPredictor(db_path)
    
    # Determine lookback days based on time period
    if time_period == "last_30_days":
        lookback_days = 30
    elif time_period == "last_90_days":
        lookback_days = 90
    elif time_period == "last_180_days":
        lookback_days = 180
    elif time_period == "last_year":
        lookback_days = 365
    else:
        # Default to 90 days if not specified
        lookback_days = 90
    
    # Extract customer data
    customer_data = predictor.extract_customer_data(lookback_days)
    
    # Filter by segment if specified
    if segment_id:
        # This would need to be adapted to your actual segment filtering logic
        segment_query = f"""
        SELECT customer_id FROM customer_segments 
        WHERE segment_id = '{segment_id}'
        """
        with sqlite3.connect(db_path) as conn:
            segment_customers = pd.read_sql(segment_query, conn)
            customer_data = customer_data[customer_data['customer_id'].isin(segment_customers['customer_id'])]
    
    # Prepare features
    feature_cols, features = predictor.prepare_features(customer_data)
    
    # Generate synthetic labels for demonstration (in a real system, you'd have actual churn data)
    # This is just for demonstration purposes
    np.random.seed(42)
    labels = np.random.binomial(1, 0.2, size=len(customer_data))
    
    # Train the model
    metrics = predictor.train_model(features, labels, feature_cols)
    
    # Predict churn risk
    predictions = predictor.predict_churn_risk(customer_data)
    
    # Generate visualizations if requested
    visualization_base64 = None
    if include_visualization:
        # Create a temporary buffer to save the figure
        buf = io.BytesIO()
        predictor.visualize_risk_distribution(predictions, buf)
        buf.seek(0)
        visualization_base64 = base64.b64encode(buf.read()).decode('utf-8')
    
    # Format the results
    risk_summary = predictions.groupby('risk_level').agg({
        'customer_id': 'count',
        'churn_probability': ['mean', 'min', 'max']
    }).round(3)
    
    # Format contributing factors
    factor_counts = pd.Series([
        factor for factors in predictions['contributing_factors'].apply(json.loads)
        for factor in factors
    ]).value_counts()
    
    # Create the result string
    result = f"""# Churn Risk Analysis Report

## Analysis Period: {time_period}
{f"Segment: {segment_id}" if segment_id else "All Customers"}

## Risk Distribution Summary

{risk_summary.to_string()}

## Top Contributing Factors

Most common factors leading to high churn risk:
{factor_counts.head().to_string()}

## Model Performance

ROC AUC Score: {metrics['roc_auc']:.3f}

## Recommendations

1. Focus on customers with 'Very High' risk level (churn probability > 0.8)
2. Address most common contributing factors:
   {', '.join(factor_counts.head().index)}
3. Monitor customers with 'High' risk level for deterioration
"""
    
    # Add visualization if available
    if visualization_base64:
        result += f"""

## Visualizations

![Churn Risk Distribution](data:image/png;base64,{visualization_base64})
"""
    
    return result

class ChurnRiskPredictor:
    def __init__(self, db_path: str):
        """Initialize the ChurnRiskPredictor.
        
        Args:
            db_path: Path to SQLite database
        """
        self.db_path = db_path
        self.model = LogisticRegression(
            penalty='l1',
            solver='liblinear',
            random_state=42,
            class_weight='balanced'
        )
        self.scaler = StandardScaler()
        
    def extract_customer_data(self, lookback_days: int = 90) -> pd.DataFrame:
        """Extract customer data including engagement, satisfaction, and transaction metrics.
        
        Args:
            lookback_days: Number of days to look back for metrics
            
        Returns:
            DataFrame with customer features
        """
        cutoff_date = datetime.now() - timedelta(days=lookback_days)
        
        with sqlite3.connect(self.db_path) as conn:
            # Get customer loyalty metrics
            loyalty_query = """
            SELECT 
                cl."Customer Number" as customer_id,
                cl."Loyalty Status" as loyalty_status,
                cl."RFM Score" as rfm_score,
                cl."Days Since Last Activity" as days_since_last_activity,
                cl."Number Sales Txns" as transaction_count,
                cl."Avg Sales Amount" as avg_transaction_value,
                cl."LTD Sales Amount" as lifetime_sales,
                cl."At Risk Customer Count" as at_risk_count,
                cl."Lost Customer Count" as lost_count
            FROM dbo_F_Customer_Loyalty cl
            """
            
            # Get transaction metrics
            transaction_query = """
            SELECT 
                st."Customer Key" as customer_id,
                COUNT(DISTINCT st."Sales Txn Document") as unique_transactions,
                AVG(st."Sales Amount") as avg_sale_amount,
                SUM(st."Return Amount") as total_returns,
                COUNT(DISTINCT st."Item Number") as unique_products,
                MAX(st."Txn Date") as last_transaction_date
            FROM dbo_F_Sales_Transaction st
            WHERE date(st."Txn Date") >= date('now', ?)
            GROUP BY st."Customer Key"
            """
            
            # Get customer details
            customer_query = """
            SELECT 
                c."Customer Key" as customer_id,
                c."Customer Status" as status,
                c."Credit Status" as credit_status,
                c."Credit Limit Amount" as credit_limit,
                c."Year Acquired" as acquisition_year,
                c."Recency Band" as recency_band,
                c."Frequency Band" as frequency_band,
                c."Monetary Band" as monetary_band
            FROM dbo_D_Customer c
            """
            
            # Execute queries
            loyalty_df = pd.read_sql(loyalty_query, conn)
            transaction_df = pd.read_sql(transaction_query, conn, params=[f'-{lookback_days} days'])
            customer_df = pd.read_sql(customer_query, conn)
            
            # Merge all metrics
            customer_data = customer_df.merge(
                loyalty_df, on='customer_id', how='left'
            ).merge(
                transaction_df, on='customer_id', how='left'
            )
            
            # Fill missing values
            customer_data = customer_data.fillna({
                'loyalty_status': 'Unknown',
                'rfm_score': 0,
                'days_since_last_activity': lookback_days,
                'transaction_count': 0,
                'avg_transaction_value': 0,
                'lifetime_sales': 0,
                'at_risk_count': 0,
                'lost_count': 0,
                'unique_transactions': 0,
                'avg_sale_amount': 0,
                'total_returns': 0,
                'unique_products': 0,
                'credit_limit': 0,
                'acquisition_year': datetime.now().year
            })
            
            # Calculate days since last transaction if available
            customer_data['days_since_last_transaction'] = pd.to_datetime('now') - pd.to_datetime(customer_data['last_transaction_date'])
            customer_data['days_since_last_transaction'] = customer_data['days_since_last_transaction'].dt.days.fillna(lookback_days)
            
            return customer_data
            
    def prepare_features(self, customer_data: pd.DataFrame) -> tuple:
        """Prepare features for churn prediction.
        
        Args:
            customer_data: DataFrame with customer metrics
            
        Returns:
            Tuple of (feature_names, scaled_features)
        """
        feature_cols = [
            'rfm_score',
            'days_since_last_activity',
            'transaction_count',
            'avg_transaction_value',
            'lifetime_sales',
            'at_risk_count',
            'lost_count',
            'unique_transactions',
            'avg_sale_amount',
            'total_returns',
            'unique_products',
            'days_since_last_transaction',
            'credit_limit'
        ]
        
        # Fill NaN values with appropriate defaults
        customer_data = customer_data.fillna({
            'rfm_score': 0,
            'days_since_last_activity': 90,
            'transaction_count': 0,
            'avg_transaction_value': 0,
            'lifetime_sales': 0,
            'at_risk_count': 0,
            'lost_count': 0,
            'unique_transactions': 0,
            'avg_sale_amount': 0,
            'total_returns': 0,
            'unique_products': 0,
            'days_since_last_transaction': 90,
            'credit_limit': 0
        })
        
        # Scale features
        features = self.scaler.fit_transform(customer_data[feature_cols])
        
        return feature_cols, features
        
    def train_model(self, features: np.ndarray, labels: np.ndarray, feature_cols: list) -> dict:
        """Train the churn prediction model.
        
        Args:
            features: Scaled feature matrix
            labels: Binary churn labels
            feature_cols: List of feature column names
            
        Returns:
            Dictionary with model performance metrics
        """
        # Store feature columns
        self.feature_cols = feature_cols
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features, labels, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Get predictions
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        metrics = {
            'classification_report': classification_report(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_prob),
            'feature_importance': dict(zip(
                self.feature_cols,
                np.abs(self.model.coef_[0])
            ))
        }
        
        return metrics
        
    def predict_churn_risk(self, customer_data: pd.DataFrame) -> pd.DataFrame:
        """Predict churn risk for customers.
        
        Args:
            customer_data: DataFrame with customer metrics
            
        Returns:
            DataFrame with customer IDs and churn probabilities
        """
        # Prepare features
        self.feature_cols, features = self.prepare_features(customer_data)
        
        # Get predictions
        churn_prob = self.model.predict_proba(features)[:, 1]
        
        # Create results DataFrame
        results = pd.DataFrame({
            'customer_id': customer_data['customer_id'],
            'churn_probability': churn_prob,
            'risk_level': pd.cut(
                churn_prob,
                bins=[0, 0.3, 0.6, 0.8, 1],
                labels=['Low', 'Medium', 'High', 'Very High']
            )
        })
        
        # Add top contributing factors
        feature_importance = np.abs(self.model.coef_[0])
        for i, row in enumerate(features):
            # Get indices of top 3 contributing features
            top_features = np.argsort(row * feature_importance)[-3:]
            results.loc[i, 'contributing_factors'] = json.dumps([
                self.feature_cols[j] for j in top_features
            ])
            
        return results
        
    def visualize_risk_distribution(self, predictions: pd.DataFrame, output_path: str):
        """Create visualization of churn risk distribution.
        
        Args:
            predictions: DataFrame with churn predictions
            output_path: Path to save visualization
        """
        plt.figure(figsize=(12, 6))
        
        # Risk level distribution
        plt.subplot(1, 2, 1)
        risk_dist = predictions['risk_level'].value_counts()
        sns.barplot(x=risk_dist.index, y=risk_dist.values)
        plt.title('Distribution of Churn Risk Levels')
        plt.xlabel('Risk Level')
        plt.ylabel('Number of Customers')
        
        # Probability distribution
        plt.subplot(1, 2, 2)
        sns.histplot(data=predictions, x='churn_probability', bins=30)
        plt.title('Distribution of Churn Probabilities')
        plt.xlabel('Churn Probability')
        plt.ylabel('Number of Customers')
        
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close() 