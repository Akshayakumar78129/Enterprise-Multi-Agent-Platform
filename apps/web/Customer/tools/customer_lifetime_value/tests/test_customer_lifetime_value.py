import unittest
import os
import sys
import pandas as pd
import numpy as np
import sqlite3
from datetime import datetime

# Add parent directory to path to import customer_lifetime_value
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
import customer_lifetime_value
from customer_lifetime_value import predict_customer_ltv, _parse_time_period

class TestCustomerLifetimeValue(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Set up the database connection for all tests."""
        # Use the actual database path
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
    
    def test_parse_time_period(self):
        """Test that time period parsing works correctly."""
        # Test explicit date range
        start_date, end_date = _parse_time_period("2020-01-01:2020-12-31")
        self.assertEqual(start_date, "2020-01-01")
        self.assertEqual(end_date, "2020-12-31")
        
        # Test relative time periods
        for period in ["monthly", "quarterly", "annual"]:
            start_date, end_date = _parse_time_period(period)
            # Just make sure we get valid dates
            self.assertTrue(isinstance(start_date, str))
            self.assertTrue(isinstance(end_date, str))
            # End date should be today
            self.assertEqual(end_date, datetime.now().strftime('%Y-%m-%d'))
    
    def test_predict_customer_ltv_returns_string(self):
        """Test that predict_customer_ltv returns a string result."""
        result = predict_customer_ltv(time_period="2020-01-01:2020-12-31")
        self.assertIsInstance(result, str)
        self.assertIn("Customer Lifetime Value Analysis", result)
    
    def test_predict_customer_ltv_with_segment(self):
        """Test that predict_customer_ltv works with segment filtering."""
        result = predict_customer_ltv(
            time_period="2020-01-01:2020-12-31",
            segment_id=1  # Use a segment ID that exists in the database
        )
        self.assertIsInstance(result, str)
        # If no data found for segment, it should say so
        if "No customer data found" in result:
            self.assertIn("No customer data found", result)
        else:
            self.assertIn("Customer Lifetime Value Analysis", result)
    
    def test_predict_customer_ltv_with_visualization(self):
        """Test that predict_customer_ltv works with visualization."""
        result = predict_customer_ltv(
            time_period="2020-01-01:2020-12-31",
            include_visualization=True
        )
        self.assertIsInstance(result, str)
        # If data found, we should have visualization
        if "No customer data found" not in result:
            self.assertIn("Visualization", result)
            self.assertIn("data:image/png;base64", result)
    
    def test_connection_to_real_database(self):
        """Test that we can connect to the real database and run a query."""
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM dbo_D_Customer")
            result = cursor.fetchone()
            self.assertIsNotNone(result)
            self.assertGreater(result[0], 0, "Should have customer records in the database")
        except Exception as e:
            self.fail(f"Failed to query the database: {str(e)}")
        finally:
            cursor.close()
    
if __name__ == '__main__':
    unittest.main() 