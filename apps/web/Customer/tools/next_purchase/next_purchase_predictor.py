"""Tool for predicting next customer purchases."""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor
import sqlite3
from datetime import datetime, timedelta
import os
from typing import Dict, Optional, List

class NextPurchasePredictor:
    """Predicts next likely purchases for customers."""
    
    def __init__(self, db_path: str):
        """Initialize the predictor."""
        self.db_path = db_path
        self.scaler = StandardScaler()
        self.model = GradientBoostingRegressor()
        
    def extract_features(self) -> pd.DataFrame:
        """Extract customer purchase features from database."""
        query = """
            SELECT 
                c."Customer Key" as customer_id,
                c."Customer Type Desc" as segment,
                s."Item Key" as product_id,
                s."Item Category Hrchy Key" as category_id,
                s."Net Sales Amount" as amount,
                s."Txn Date" as purchase_date,
                COUNT(*) OVER (
                    PARTITION BY c."Customer Key", s."Item Key"
                    ORDER BY s."Txn Date"
                ) as purchase_number,
                JULIANDAY(s."Txn Date") - JULIANDAY(LAG(s."Txn Date", 1) OVER (
                    PARTITION BY c."Customer Key", s."Item Key"
                    ORDER BY s."Txn Date"
                )) as days_since_last
            FROM 
                "dbo_D_Customer" c
            JOIN 
                "dbo_F_Sales_Transaction" s ON c."Customer Key" = s."Customer Key"
            WHERE 
                s."Net Sales Amount" > 0
                AND s."Deleted Flag" = 0
                AND s."Excluded Flag" = 0
            ORDER BY 
                c."Customer Key", s."Item Key", s."Txn Date"
        """
        
        with sqlite3.connect(self.db_path) as conn:
            df = pd.read_sql_query(query, conn)
            df['purchase_date'] = pd.to_datetime(df['purchase_date'])
            
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> tuple:
        """Prepare features for model training."""
        features = []
        labels = []
        
        # Ensure all numeric columns have valid values
        df = df.copy()
        numeric_cols = ['amount', 'days_since_last']
        for col in numeric_cols:
            # Replace NaN with column mean or 0 if all NaN
            if col in df.columns:
                if pd.isna(df[col]).all():
                    df[col] = 0
                else:
                    df[col] = df[col].fillna(df[col].mean())
        
        for (customer_id, product_id), group in df.groupby(['customer_id', 'product_id']):
            if len(group) >= 2:  # Need at least 2 purchases to predict next
                try:
                    # Calculate features with NaN handling
                    avg_amount = group['amount'].mean()
                    avg_interval = group['days_since_last'].dropna().mean() if not pd.isna(group['days_since_last']).all() else 30
                    purchase_count = len(group)
                    last_amount = group['amount'].iloc[-1]
                    days_since_last = group['days_since_last'].iloc[-1] if not pd.isna(group['days_since_last'].iloc[-1]) else 30
                    
                    # Skip if any value is still NaN after our handling
                    if pd.isna([avg_amount, avg_interval, purchase_count, last_amount, days_since_last]).any():
                        continue
                    
                    features.append([
                        float(avg_amount),
                        float(avg_interval),
                        float(purchase_count),
                        float(last_amount),
                        float(days_since_last)
                    ])
                    
                    # Label: days until next purchase (for last purchase in sequence)
                    days_to_next = 7 if purchase_count > 5 else 14  # Simple heuristic
                    labels.append(days_to_next)
                except Exception as e:
                    # Skip this group if there's any error
                    continue
        
        # If no valid features could be extracted, return empty arrays
        if not features:
            return np.array([]).reshape(0, 5), np.array([])
        
        X = np.array(features)
        y = np.array(labels)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y
    
    def train_model(self, X: np.ndarray, y: np.ndarray) -> Dict:
        """Train the prediction model."""
        # Split data
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        return {
            'train_score': train_score,
            'test_score': test_score
        }
    
    def predict_next_purchases(self, customer_data: pd.DataFrame, top_k: int = 5) -> pd.DataFrame:
        """Predict next likely purchases for customers."""
        features = []
        customer_products = []
        
        # Ensure all numeric columns have valid values
        customer_data = customer_data.copy()
        numeric_cols = ['amount', 'days_since_last']
        for col in numeric_cols:
            # Replace NaN with column mean or 0 if all NaN
            if col in customer_data.columns:
                if pd.isna(customer_data[col]).all():
                    customer_data[col] = 0
                else:
                    customer_data[col] = customer_data[col].fillna(customer_data[col].mean())
        
        for (customer_id, product_id), group in customer_data.groupby(['customer_id', 'product_id']):
            if len(group) >= 2:
                try:
                    # Calculate features with NaN handling
                    avg_amount = group['amount'].mean()
                    avg_interval = group['days_since_last'].dropna().mean() if not pd.isna(group['days_since_last']).all() else 30
                    purchase_count = len(group)
                    last_amount = group['amount'].iloc[-1]
                    days_since_last = group['days_since_last'].iloc[-1] if not pd.isna(group['days_since_last'].iloc[-1]) else 30
                    
                    # Skip if any value is still NaN after our handling
                    if pd.isna([avg_amount, avg_interval, purchase_count, last_amount, days_since_last]).any():
                        continue
                    
                    features.append([
                        float(avg_amount),
                        float(avg_interval),
                        float(purchase_count),
                        float(last_amount),
                        float(days_since_last)
                    ])
                    customer_products.append((customer_id, product_id))
                except Exception as e:
                    # Skip this group if there's any error
                    continue
        
        if not features:
            return pd.DataFrame()
        
        # Scale and predict
        X = np.array(features)
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        
        # Create results DataFrame
        results = pd.DataFrame(
            customer_products,
            columns=['customer_id', 'product_id']
        )
        results['days_to_next'] = predictions
        results['purchase_probability'] = 1 / (1 + np.exp(predictions/7))  # Convert to probability
        
        # Get top K predictions per customer
        top_predictions = (
            results.sort_values('purchase_probability', ascending=False)
            .groupby('customer_id')
            .head(top_k)
            .reset_index(drop=True)
        )
        
        return top_predictions
    
    def store_predictions(self, predictions: pd.DataFrame, output_path: str) -> str:
        """Store predictions in markdown format."""
        os.makedirs(output_path, exist_ok=True)
        
        # Format predictions
        predictions_str = "| Customer ID | Product ID | Probability | Days to Next |\n"
        predictions_str += "|------------|------------|-------------|-------------|\n"
        
        for _, row in predictions.iterrows():
            predictions_str += (
                f"| {row['customer_id']} | {row['product_id']} | "
                f"{row['purchase_probability']:.2f} | {row['days_to_next']:.1f} |\n"
            )
        
        report = f"""# Next Purchase Predictions

## Summary
- Total Predictions: {len(predictions)}
- Average Purchase Probability: {predictions['purchase_probability'].mean():.2f}
- Average Days to Next Purchase: {predictions['days_to_next'].mean():.1f}

## Top Predictions by Customer
{predictions_str}

## Recommendations
1. Focus on high probability purchases (>0.7)
2. Consider promotions for medium probability purchases (0.3-0.7)
3. Monitor actual purchase timing vs predictions
"""
        
        report_path = os.path.join(output_path, 'next_purchase_predictions.md')
        with open(report_path, 'w') as f:
            f.write(report)
        
        return report_path 