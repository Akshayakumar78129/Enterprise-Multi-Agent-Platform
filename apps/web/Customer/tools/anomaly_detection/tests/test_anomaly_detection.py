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
from anomaly_detection import detect_anomalies, extract_metrics, detect_anomalies_with_isolation_forest, calculate_severity

class TestAnomalyDetection(unittest.TestCase):
    """Test cases for the anomaly detection tool."""
    
    def setUp(self):
        """Set up test environment."""
        self.db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
    
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
        
        # Check if customer data exists
        cursor.execute("SELECT COUNT(*) FROM dbo_D_Customer")
        customer_count = cursor.fetchone()[0]
        self.assertTrue(customer_count > 0, "Customer table should contain data")
        
        # Check if transaction data exists
        cursor.execute("SELECT COUNT(*) FROM dbo_F_Sales_Transaction")
        transaction_count = cursor.fetchone()[0]
        self.assertTrue(transaction_count > 0, "Transaction table should contain data")
        
        conn.close()
    
    def test_extract_metrics(self):
        """Test extracting metrics from the database."""
        # Use a short time window for faster test
        metrics = extract_metrics("30d")
        
        # Check if any metrics were returned
        self.assertIsInstance(metrics, pd.DataFrame)
        self.assertFalse(metrics.empty, "Should extract some metrics")
        
        # Check if the expected columns exist
        expected_columns = ['customer_id', 'transaction_count', 'avg_transaction_value']
        for col in expected_columns:
            self.assertIn(col, metrics.columns)
        
        # Check that at least one row has a transaction count greater than 0
        self.assertTrue((metrics['transaction_count'] > 0).any(), "Should have at least one transaction")
    
    def test_detect_anomalies_with_isolation_forest(self):
        """Test the anomaly detection algorithm."""
        # Create test data
        test_data = pd.DataFrame({
            'customer_id': range(1, 101),
            'transaction_count': np.random.randint(1, 100, 100),
            'avg_transaction_value': np.random.uniform(10, 1000, 100),
            'max_transaction_value': np.random.uniform(100, 5000, 100),
            'min_transaction_value': np.random.uniform(1, 100, 100)
        })
        
        feature_columns = ['transaction_count', 'avg_transaction_value', 
                          'max_transaction_value', 'min_transaction_value']
        
        # Run anomaly detection
        scores, model_params = detect_anomalies_with_isolation_forest(test_data, feature_columns)
        
        # Check if scores were calculated
        self.assertEqual(len(scores), len(test_data), "Should have one score per customer")
        
        # Check that model params contain expected values
        self.assertIn('n_estimators', model_params)
        self.assertIn('contamination', model_params)
    
    def test_calculate_severity(self):
        """Test the severity calculation algorithm."""
        # Create test data
        test_data = pd.DataFrame({
            'customer_id': range(1, 101),
            'transaction_count': np.random.randint(1, 100, 100),
            'avg_transaction_value': np.random.uniform(10, 1000, 100)
        })
        
        feature_columns = ['transaction_count', 'avg_transaction_value']
        
        # Create random scores (negative for anomalies, positive for normal)
        scores = np.random.uniform(-1, 1, 100)
        
        # Calculate severity
        severity = calculate_severity(scores, test_data, feature_columns)
        
        # Check if severity was calculated for all customers
        self.assertEqual(len(severity), len(test_data), "Should have severity for each customer")
        
        # Check if required columns exist
        self.assertIn('customer_id', severity.columns)
        self.assertIn('anomaly_score', severity.columns)
        self.assertIn('overall_severity', severity.columns)
    
    def test_end_to_end_detection(self):
        """Test the end-to-end anomaly detection process."""
        # Run detection with a short time window
        result = detect_anomalies(time_window="30d")
        
        # Check if the result is a string
        self.assertIsInstance(result, str)
        
        # Check if the result contains the expected headings
        self.assertIn("Customer Anomaly Detection Analysis", result)
        
        # Check if analysis contains expected sections
        self.assertIn("Analysis Period", result)
        self.assertIn("Overall Anomaly Metrics", result)
        
        # Check that the result doesn't contain an error message
        self.assertNotIn("Error detecting anomalies", result)

if __name__ == '__main__':
    unittest.main() 