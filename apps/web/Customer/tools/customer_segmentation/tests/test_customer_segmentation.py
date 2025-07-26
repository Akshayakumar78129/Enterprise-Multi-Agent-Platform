import unittest
import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the module to test
from customer_segmentation import identify_customer_segments

class TestCustomerSegmentation(unittest.TestCase):
    """Test cases for the customer segmentation tool."""
    
    def setUp(self):
        """Set up test environment."""
        self.db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
    
    def test_database_connection(self):
        """Test that the database connection works."""
        import sqlite3
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
        
        conn.close()
    
    def test_customer_segmentation_rfm(self):
        """Test RFM customer segmentation with real data."""
        # Run the segmentation with RFM method
        result = identify_customer_segments(
            segmentation_method="rfm",
            time_period="2019-01-01:2019-12-31",
            num_segments=3,
            include_visualization=False
        )
        
        # Check if the result is a string
        self.assertIsInstance(result, str)
        
        # Check if the result contains segment information
        self.assertIn("Customer Segments", result)
        self.assertIn("Segment", result)
        
        # Check if any error occurred
        self.assertNotIn("Error performing customer segmentation", result)
    
    def test_customer_segmentation_behavioral(self):
        """Test behavioral customer segmentation with real data."""
        # Run the segmentation with behavioral method
        result = identify_customer_segments(
            segmentation_method="behavioral",
            time_period="2019-01-01:2019-12-31",
            num_segments=3,
            include_visualization=False
        )
        
        # Check if the result is a string
        self.assertIsInstance(result, str)
        
        # Check if the result contains segment information
        self.assertIn("Customer Segments", result)
        
        # Check if any error occurred
        self.assertNotIn("Error performing customer segmentation", result)
    
    def test_customer_segmentation_with_filters(self):
        """Test customer segmentation with filters applied."""
        # Apply a filter to narrow down the analysis
        filters = {"Customer Type Desc": "Business"}
        
        result = identify_customer_segments(
            segmentation_method="rfm",
            time_period="2019-01-01:2019-12-31",
            filters=filters,
            include_visualization=False
        )
        
        # Check if the result is a string
        self.assertIsInstance(result, str)
        
        # Check if the result contains segment information
        self.assertIn("Customer Segments", result)
        
        # Check if the filter information is included
        self.assertIn("Business", result)

if __name__ == '__main__':
    unittest.main() 