import unittest
import os
import sys
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the module to test
from churn_prediction import predict_churn_risk, ChurnRiskPredictor

class TestChurnPrediction(unittest.TestCase):
    """Test cases for the churn prediction tool."""
    
    def setUp(self):
        """Set up test environment."""
        self.db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
        self.predictor = ChurnRiskPredictor(self.db_path)
    
    def test_database_connection(self):
        """Test that the database connection works."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if required tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        self.assertTrue(len(tables) > 0, "Database should contain tables")
        self.assertIn("dbo_D_Customer", tables, "Customer table should exist")
        self.assertIn("dbo_F_Sales_Transaction", tables, "Sales transaction table should exist")
        self.assertIn("dbo_F_Customer_Loyalty", tables, "Customer loyalty table should exist")
        
        # Check if customer data exists
        cursor.execute("SELECT COUNT(*) FROM dbo_D_Customer")
        customer_count = cursor.fetchone()[0]
        self.assertTrue(customer_count > 0, "Customer table should contain data")
        
        conn.close()
    
    def test_extract_customer_data(self):
        """Test extracting customer data from the database."""
        # Extract customer data with a short lookback period
        customer_data = self.predictor.extract_customer_data(lookback_days=90)
        
        # Check if any data was returned
        self.assertIsInstance(customer_data, pd.DataFrame)
        
        # Check if at least some fields are present (may vary based on data availability)
        self.assertIn('customer_id', customer_data.columns, "customer_id column should exist")
    
    def test_prepare_features(self):
        """Test preparing features for model training."""
        # Extract customer data
        customer_data = self.predictor.extract_customer_data(lookback_days=90)
        
        # If no customer data is found, create minimal test data
        if customer_data.empty:
            customer_data = pd.DataFrame({
                'customer_id': [1, 2, 3],
                'rfm_score': [5, 3, 1],
                'days_since_last_activity': [10, 30, 60],
                'transaction_count': [50, 20, 5],
                'avg_transaction_value': [100, 50, 25]
            })
        
        # Prepare features
        feature_cols, features = self.predictor.prepare_features(customer_data)
        
        # Check that feature columns and features were created
        self.assertIsInstance(feature_cols, list)
        self.assertIsInstance(features, np.ndarray)
        self.assertTrue(len(feature_cols) > 0, "Should have at least one feature column")
        
        if len(customer_data) > 0:
            self.assertEqual(len(features), len(customer_data), 
                            "Features should have same number of rows as customer data")
    
    def test_train_model(self):
        """Test training the churn prediction model."""
        # Extract and prepare features
        customer_data = self.predictor.extract_customer_data(lookback_days=90)
        
        # If no customer data is found, create minimal test data
        if customer_data.empty:
            customer_data = pd.DataFrame({
                'customer_id': [1, 2, 3, 4, 5],
                'rfm_score': [5, 4, 3, 2, 1],
                'days_since_last_activity': [10, 20, 30, 40, 50],
                'transaction_count': [50, 40, 30, 20, 10],
                'avg_transaction_value': [100, 80, 60, 40, 20]
            })
        
        feature_cols, features = self.predictor.prepare_features(customer_data)
        
        # Create synthetic labels for training
        np.random.seed(42)
        labels = np.random.binomial(1, 0.2, size=len(customer_data))
        
        # Train model
        metrics = self.predictor.train_model(features, labels, feature_cols)
        
        # Check if metrics were returned
        self.assertIsInstance(metrics, dict)
        self.assertIn('classification_report', metrics)
        self.assertIn('roc_auc', metrics)
        self.assertIn('feature_importance', metrics)
    
    def test_predict_churn_risk(self):
        """Test predicting churn risk for customers."""
        # Extract customer data
        customer_data = self.predictor.extract_customer_data(lookback_days=90)
        
        # If no customer data is found, create minimal test data
        if customer_data.empty:
            customer_data = pd.DataFrame({
                'customer_id': [1, 2, 3, 4, 5],
                'rfm_score': [5, 4, 3, 2, 1],
                'days_since_last_activity': [10, 20, 30, 40, 50],
                'transaction_count': [50, 40, 30, 20, 10],
                'avg_transaction_value': [100, 80, 60, 40, 20]
            })
        
        # Prepare data and train model
        feature_cols, features = self.predictor.prepare_features(customer_data)
        np.random.seed(42)
        labels = np.random.binomial(1, 0.2, size=len(customer_data))
        self.predictor.train_model(features, labels, feature_cols)
        
        # Predict churn risk
        predictions = self.predictor.predict_churn_risk(customer_data)
        
        # Check if predictions were returned
        self.assertIsInstance(predictions, pd.DataFrame)
        self.assertIn('customer_id', predictions.columns)
        self.assertIn('churn_probability', predictions.columns)
        self.assertIn('risk_level', predictions.columns)
        self.assertIn('contributing_factors', predictions.columns)
    
    def test_end_to_end_prediction(self):
        """Test the end-to-end churn prediction process."""
        # Run the prediction with a short time period and no visualization
        result = predict_churn_risk(time_period="last_30_days", include_visualization=False)
        
        # Check if the result is a string
        self.assertIsInstance(result, str)
        
        # Check if the result contains the expected headings
        self.assertIn("Churn Risk Analysis Report", result)
        
        # Check if analysis contains expected sections
        self.assertIn("Analysis Period", result)
        self.assertIn("Risk Distribution Summary", result)
        self.assertIn("Top Contributing Factors", result)
        self.assertIn("Recommendations", result)

if __name__ == '__main__':
    unittest.main() 