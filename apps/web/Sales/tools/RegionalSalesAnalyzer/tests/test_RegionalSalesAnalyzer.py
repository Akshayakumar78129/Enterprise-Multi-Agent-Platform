import unittest
import os
import sys
import pandas as pd
import numpy as np
import sqlite3
from datetime import datetime

# Add parent directory to path to import RegionalSalesAnalyzer
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)
# Add project root to path
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.insert(0, project_dir)

from RegionalSalesAnalyzer import (
    get_db_connection,
    get_latest_date,
    parse_date_range,
    get_sales_data,
    analyze_regional_sales
)

class TestRegionalSalesAnalyzer(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Set up the database connection for all tests."""
        # Use the actual database path
        cls.db_path = os.path.abspath(os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 
            "database", 
            "sales_agent.db"
        ))
        print(f"Using database at: {cls.db_path}")
        
        # Ensure the database path is correctly set
        assert os.path.exists(cls.db_path), f"Database file not found at {cls.db_path}"
    
    def test_get_db_connection(self):
        """Test the database connection function."""
        try:
            conn = get_db_connection()
            # Test the connection by executing a simple query
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;")
            result = cursor.fetchone()
            conn.close()
            
            self.assertIsNotNone(result, "No tables found in database")
        except Exception as e:
            self.fail(f"Database connection failed: {str(e)}")
    
    def test_get_latest_date(self):
        """Test the get_latest_date function."""
        latest_date = get_latest_date()
        
        # Check that the returned date is a valid date string in YYYY-MM-DD format
        try:
            parsed_date = datetime.strptime(latest_date, "%Y-%m-%d")
            self.assertTrue(isinstance(parsed_date, datetime))
        except ValueError:
            self.fail(f"Invalid date format: {latest_date}")
    
    def test_parse_date_range(self):
        """Test the date range parsing function."""
        # Test with specific period
        start_date, end_date = parse_date_range("quarterly")
        
        # Validate format
        try:
            self.assertIsNotNone(start_date)
            self.assertIsNotNone(end_date)
            datetime.strptime(start_date, "%Y-%m-%d")
            datetime.strptime(end_date, "%Y-%m-%d")
            
            # Ensure start date is before end date
            self.assertTrue(start_date <= end_date, "Start date should be before or equal to end date")
        except ValueError:
            self.fail(f"Invalid date format: {start_date} to {end_date}")
        
        # Test with explicit start and end dates
        custom_start = "2020-01-01"
        custom_end = "2020-12-31"
        start_date, end_date = parse_date_range("custom", custom_start, custom_end)
        
        self.assertEqual(start_date, custom_start)
        self.assertEqual(end_date, custom_end)
    
    def test_get_sales_data(self):
        """Test retrieving sales data from the database."""
        # Get data for a specific date range
        start_date, end_date = parse_date_range("monthly")
        data = get_sales_data(start_date=start_date, end_date=end_date)
        
        # Check that the result is a DataFrame
        self.assertIsInstance(data, pd.DataFrame, "get_sales_data should return a DataFrame")
        
        if not data.empty:
            # Check that the expected columns are present
            expected_columns = ['revenue', 'units', 'region_name']
            for col in expected_columns:
                self.assertIn(col, data.columns, f"Column {col} missing from sales data")
    
    def test_analyze_regional_sales(self):
        """Test the regional sales analysis function."""
        # Test with default parameters
        result = analyze_regional_sales(time_period="monthly")
        
        # Check that the result is a dictionary with the expected structure
        self.assertIsInstance(result, dict, "analyze_regional_sales should return a dictionary")
        
        # Check for expected keys in the result
        if "error" not in result:
            # Check for top_regions key
            self.assertIn("top_regions", result, "Result missing 'top_regions' key")
            self.assertIsInstance(result["top_regions"], list, "'top_regions' should be a list")
            
            # Check for total_metrics key
            self.assertIn("total_metrics", result, "Result missing 'total_metrics' key")
            self.assertIsInstance(result["total_metrics"], dict, "'total_metrics' should be a dictionary")
        
        # Test with specific parameters
        result = analyze_regional_sales(
            time_period="quarterly",
            analysis_type="performance",
            metric="revenue"
        )
        
        self.assertIsInstance(result, dict, "analyze_regional_sales should return a dictionary")

if __name__ == "__main__":
    unittest.main() 