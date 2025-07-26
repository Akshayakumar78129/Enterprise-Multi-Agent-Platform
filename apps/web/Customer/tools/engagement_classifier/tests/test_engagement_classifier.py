import unittest
import os
import sys
import sqlite3
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the module to test
from engagement_classifier import analyze_customer_engagement

class TestEngagementClassifier(unittest.TestCase):
    """Test cases for the customer engagement classifier tool."""
    
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
        self.assertIn("dbo_F_Customer_Loyalty", tables, "Customer loyalty table should exist")
        
        # Check if customer data exists
        cursor.execute("SELECT COUNT(*) FROM dbo_D_Customer")
        customer_count = cursor.fetchone()[0]
        self.assertTrue(customer_count > 0, "Customer table should contain data")
        
        conn.close()
    
    def test_analyze_customer_engagement_without_dates(self):
        """Test analyzing customer engagement without date parameters."""
        # Call the analyze function without date parameters
        result = analyze_customer_engagement()
        
        # Check if the result is a dictionary with the expected structure
        self.assertIsInstance(result, dict)
        self.assertIn("report", result)
        self.assertIn("success", result)
        
        # Check if the operation was successful
        self.assertTrue(result["success"], "The operation should be successful")
        
        # The report should be a non-empty string
        self.assertIsInstance(result["report"], str)
        self.assertTrue(len(result["report"]) > 0, "Report should not be empty")
        
        # Check if the report contains the expected information
        self.assertIn("Customer Engagement Analysis Report", result["report"])
        self.assertIn("Engagement Customers", result["report"])
    
    def test_analyze_customer_engagement_with_dates(self):
        """Test analyzing customer engagement with date parameters."""
        # Use date range where we know there's data
        start_date = "2019-01-01"
        end_date = "2019-12-31"
        
        # Call the analyze function with date parameters
        result = analyze_customer_engagement(start_date, end_date)
        
        # Check if the result is a dictionary with the expected structure
        self.assertIsInstance(result, dict)
        self.assertIn("report", result)
        self.assertIn("success", result)
        
        # Check if the operation was successful
        self.assertTrue(result["success"], "The operation should be successful")
        
        # The report should be a non-empty string
        self.assertIsInstance(result["report"], str)
        self.assertTrue(len(result["report"]) > 0, "Report should not be empty")
        
        # Check if the report contains the expected information
        self.assertIn("Customer Engagement Analysis Report", result["report"])
        self.assertIn("Engagement Customers", result["report"])

if __name__ == '__main__':
    unittest.main() 