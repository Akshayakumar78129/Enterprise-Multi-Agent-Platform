import unittest
import os
import sys
import pandas as pd
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import the module to test
from transaction_patterns import TransactionPatternAnalyzer, analyze_transaction_patterns

class TestTransactionPatterns(unittest.TestCase):
    """Test cases for the transaction patterns analysis tool."""
    
    def setUp(self):
        """Set up test environment."""
        self.db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
        self.analyzer = TransactionPatternAnalyzer(self.db_path)
        
    def test_db_connection(self):
        """Test that the database connection works with the new path."""
        # Attempt to fetch some data to verify the connection works
        data = self.analyzer._fetch_transaction_data()
        
        # Verify we can connect to the database
        self.assertIsInstance(data, pd.DataFrame)
        
    def test_analyze_patterns_with_real_data(self):
        """Test the full analysis functionality with real data."""
        # Use a large date range to ensure we get data (2019-2020)
        start_date = "2019-01-01"
        end_date = "2020-12-31"
        
        # Run the full analysis
        result = analyze_transaction_patterns(start_date, end_date)
        
        # Verify we got a well-formed result
        self.assertNotEqual(result, "No transaction data available for analysis.")
        self.assertIn("Transaction Pattern Analysis", result)
        
        # Check for key components of the analysis
        self.assertIn("Total Transactions Analyzed:", result)
        self.assertIn("Analysis Period:", result)
        
    def test_default_date_parameters(self):
        """Test that the default date parameters work correctly."""
        # Call with default date parameters
        result = analyze_transaction_patterns()
        
        # Even with default parameters, we should get a valid analysis
        self.assertNotEqual(result, "No transaction data available for analysis.")
        
    def test_basket_analysis_functionality(self):
        """Test that the basket analysis functionality works correctly."""
        # Get some transaction data (use a specific date range with known data)
        data = self.analyzer._fetch_transaction_data("2019-01-01", "2019-12-31")
        
        # Ensure we got data
        self.assertFalse(data.empty, "Should be able to fetch data from the database")
        
        # Now test the basket matrix creation
        basket_matrix = self.analyzer._create_basket_matrix(data)
        
        # Verify the basket matrix has the right structure
        self.assertIsInstance(basket_matrix, pd.DataFrame)
        
    def test_anomaly_detection(self):
        """Test that the anomaly detection functionality works correctly."""
        # Get some transaction data (use a specific date range with known data)
        data = self.analyzer._fetch_transaction_data("2019-01-01", "2019-12-31")
        
        # Ensure we got data
        self.assertFalse(data.empty, "Should be able to fetch data from the database")
        
        # Run anomaly detection
        anomalies = self.analyzer._detect_anomalies(data)
        
        # Verify the results
        self.assertIsNotNone(anomalies)

if __name__ == '__main__':
    unittest.main() 