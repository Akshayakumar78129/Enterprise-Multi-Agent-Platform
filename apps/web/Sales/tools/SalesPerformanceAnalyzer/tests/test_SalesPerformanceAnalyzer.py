import unittest
import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add parent directory to path to import SalesPerformanceAnalyzer
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)
# Add project root to path
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.insert(0, project_dir)

from SalesPerformanceAnalyzer import SalesPerformanceAnalyzer
from Sales.database.connection import get_connection
from Sales.database.query_templates import get_latest_date

class TestSalesPerformanceAnalyzer(unittest.TestCase):
    
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
        
        # Get a connection to use in tests
        conn, wrapper = get_connection()
        cls.conn = conn
        cls.wrapper = wrapper
    
    @classmethod
    def tearDownClass(cls):
        """Close the database connection after all tests."""
        if hasattr(cls, 'conn') and cls.conn:
            cls.conn.close()
        if hasattr(cls, 'wrapper') and cls.wrapper:
            cls.wrapper.close()
    
    def test_initialization(self):
        """Test that the analyzer can be initialized with various parameters."""
        # Test with required parameters
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="last_30_days",
            metric="revenue"
        )
        
        # Check that attributes are set correctly
        self.assertEqual(analyzer.dimension, "product")
        self.assertEqual(analyzer.time_period, "last_30_days")
        self.assertEqual(analyzer.metric, "revenue")
        self.assertEqual(analyzer.filters, {})
        self.assertIsNone(analyzer.comparison_mode)
        self.assertTrue(analyzer.include_visualization)
        
        # Test with optional parameters
        filters = {"category": "Electronics"}
        analyzer = SalesPerformanceAnalyzer(
            dimension="category",
            time_period="last_90_days",
            metric="units",
            filters=filters,
            comparison_mode="year_over_year",
            include_visualization=False
        )
        
        # Check that attributes are set correctly
        self.assertEqual(analyzer.dimension, "category")
        self.assertEqual(analyzer.time_period, "last_90_days")
        self.assertEqual(analyzer.metric, "units")
        self.assertEqual(analyzer.filters, filters)
        self.assertEqual(analyzer.comparison_mode, "year_over_year")
        self.assertFalse(analyzer.include_visualization)
    
    def test_build_query(self):
        """Test the query building functionality."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="last_30_days",
            metric="revenue"
        )
        
        # Build the query
        query = analyzer._build_query()
        
        # Verify query structure and syntax
        self.assertIsInstance(query, str)
        self.assertIn("SELECT", query)
        self.assertIn("FROM", query)
        self.assertIn("WHERE", query)
        self.assertIn("ORDER BY", query)
        
        # Check for specific table names and joins
        self.assertIn("dbo_F_Sales_Transaction", query)
        self.assertIn("JOIN", query)
    
    def test_get_dimension_column(self):
        """Test the dimension column mapping."""
        # Test all valid dimensions
        for dimension in SalesPerformanceAnalyzer.VALID_DIMENSIONS:
            analyzer = SalesPerformanceAnalyzer(
                dimension=dimension,
                time_period="last_30_days",
                metric="revenue"
            )
            
            column = analyzer._get_dimension_column()
            self.assertIsInstance(column, str)
            self.assertTrue(len(column) > 0)
    
    def test_analyze_performance_basic(self):
        """Test basic performance analysis with no filters."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="last_30_days",
            metric="revenue",
            include_visualization=False
        )
        
        # Run the analysis
        result = analyzer.analyze_performance()
        
        # Verify the result
        self.assertIsInstance(result, dict)
        
        if result.get("status") != "error":
            # Check that we have data in the result
            self.assertIn("data", result)
            self.assertIsInstance(result["data"], list)
    
    def test_analyze_performance_with_filters(self):
        """Test performance analysis with filters."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="category",
            time_period="last_90_days",
            metric="units",
            filters={"category": "Electronics"},
            include_visualization=False
        )
        
        # Get a date range for testing
        latest_date = get_latest_date(self.conn)
        start_date = (datetime.strptime(latest_date, "%Y-%m-%d") - timedelta(days=90)).strftime("%Y-%m-%d")
        
        # Run the analysis with specific dates
        result = analyzer.analyze_performance(start_date=start_date, end_date=latest_date)
        
        # Verify the result
        self.assertIsInstance(result, dict)
        
        # Either we get valid data or an error saying no data found with the filter
        self.assertTrue(
            (result.get("status") != "error" and "data" in result) or 
            (result.get("status") == "error" and "No data found" in result.get("message", ""))
        )
    
    def test_regional_sales_analysis(self):
        """Test the regional sales analysis functionality."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="region",
            time_period="last_30_days",
            metric="revenue",
            include_visualization=False
        )
        
        # Run the regional analysis
        result = analyzer.analyze_regional_sales()
        
        # Verify the result
        self.assertIsInstance(result, dict)
        
        # Check for common keys in regional analysis
        if result.get("status") != "error":
            expected_keys = ["data", "summary", "status"]
            for key in expected_keys:
                self.assertIn(key, result)
                
            # Check that data is a list
            self.assertIsInstance(result.get("data", []), list)

if __name__ == "__main__":
    unittest.main() 