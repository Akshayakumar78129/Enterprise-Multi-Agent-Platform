import unittest
import pandas as pd
import os
import sys
import sqlite3
from datetime import datetime, timedelta
import json

# Add parent directory to path to import customer_behaviour
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
import customer_behaviour
from customer_behaviour import (
    analyze_customer_behavior, 
    _fetch_customer_data, 
    _fetch_transaction_data,
    _parse_time_period
)

class TestCustomerBehaviour(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Set up the database connection for all tests."""
        # Use the actual database path - fix path to be at Project/Customer/database
        cls.db_path = os.path.abspath(os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 
            "database", 
            "customers.db"
        ))
        print(f"Using database at: {cls.db_path}")
        cls.conn = sqlite3.connect(cls.db_path)
        
    @classmethod
    def tearDownClass(cls):
        """Close the database connection after all tests."""
        if cls.conn:
            cls.conn.close()
    
    def test_fetch_customer_data(self):
        """Test that customer data can be fetched from the database."""
        # Test without segment filter
        customer_data = _fetch_customer_data(self.conn)
        self.assertIsInstance(customer_data, pd.DataFrame)
        self.assertGreater(len(customer_data), 0, "No customer data returned")
        self.assertIn('customer_id', customer_data.columns)
        self.assertIn('customer_name', customer_data.columns)
        
        # Test with segment filter (use a segment ID that exists in your data)
        segment_id = 1  # Replace with a valid segment ID from your database
        filtered_data = _fetch_customer_data(self.conn, segment_id)
        self.assertIsInstance(filtered_data, pd.DataFrame)
        # May return empty if segment doesn't exist, so not asserting length
    
    def test_fetch_transaction_data(self):
        """Test that transaction data can be fetched from the database."""
        # Test with quarterly time period
        time_period = "quarterly"
        transaction_data = _fetch_transaction_data(self.conn, time_period)
        self.assertIsInstance(transaction_data, pd.DataFrame)
        self.assertGreater(len(transaction_data), 0, "No transaction data returned")
        self.assertIn('customer_id', transaction_data.columns)
        self.assertIn('transaction_date', transaction_data.columns)
        self.assertIn('sales_amount', transaction_data.columns)
        
        # Test with date range time period
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")
        time_period = f"{start_date}:{end_date}"
        transaction_data = _fetch_transaction_data(self.conn, time_period)
        self.assertIsInstance(transaction_data, pd.DataFrame)
    
    def test_parse_time_period(self):
        """Test the time period parsing function."""
        # Test date range format
        time_period = "2020-01-01:2020-12-31"
        start_date, end_date = _parse_time_period(time_period)
        self.assertEqual(start_date, "2020-01-01")
        self.assertEqual(end_date, "2020-12-31")
        
        # Test predefined periods
        periods = ["monthly", "quarterly", "annual"]
        for period in periods:
            start_date, end_date = _parse_time_period(period)
            self.assertIsInstance(start_date, str)
            self.assertIsInstance(end_date, str)
            self.assertTrue(start_date < end_date)
    
    def test_analyze_customer_behavior(self):
        """Test the full analysis function with various parameters."""
        # Test with default parameters
        result = analyze_customer_behavior()
        self.assertIsInstance(result, str)
        self.assertIn("CUSTOMER BEHAVIOR ANALYSIS REPORT", result)
        self.assertIn("PURCHASE PATTERNS", result)
        self.assertIn("BEHAVIORAL METRICS", result)
        
        # Test with different time periods
        time_periods = ["monthly", "quarterly", "annual"]
        for period in time_periods:
            result = analyze_customer_behavior(time_period=period, include_visualization=False)
            self.assertIsInstance(result, str)
            self.assertIn(f"Analysis Period: {period}", result)
        
        # Test with specific behavior types
        behavior_types = ["purchase_patterns", "product_preferences"]
        result = analyze_customer_behavior(behavior_types=behavior_types, include_visualization=False)
        self.assertIsInstance(result, str)
        
        # Test with high min_transactions to ensure filtering works
        result = analyze_customer_behavior(min_transactions=10, include_visualization=False)
        self.assertIsInstance(result, str)

if __name__ == '__main__':
    unittest.main() 