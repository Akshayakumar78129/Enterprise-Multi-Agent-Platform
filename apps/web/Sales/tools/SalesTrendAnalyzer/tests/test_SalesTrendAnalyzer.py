import unittest
import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Add parent directory to path to import SalesTrendAnalyzer
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)
# Add project root to path
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.insert(0, project_dir)

from SalesTrendAnalyzer import SalesTrendAnalyzer
from Sales.database.connection import get_connection

class TestSalesTrendAnalyzer(unittest.TestCase):
    
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
        # Test with default parameters
        analyzer = SalesTrendAnalyzer()
        
        # Check that attributes are set correctly
        self.assertEqual(analyzer.time_period, "monthly")
        self.assertEqual(analyzer.metric, "revenue")
        self.assertIsNone(analyzer.dimension)
        self.assertEqual(analyzer.top_n, 5)
        self.assertEqual(analyzer.filters, {})
        self.assertTrue(analyzer.include_visualization)
        self.assertEqual(analyzer.trend_periods, 12)
        
        # Test with custom parameters
        filters = {"category": "Electronics"}
        analyzer = SalesTrendAnalyzer(
            time_period="weekly",
            metric="units",
            dimension="product",
            top_n=10,
            filters=filters,
            include_visualization=False,
            trend_periods=24
        )
        
        # Check that attributes are set correctly
        self.assertEqual(analyzer.time_period, "weekly")
        self.assertEqual(analyzer.metric, "units")
        self.assertEqual(analyzer.dimension, "product")
        self.assertEqual(analyzer.top_n, 10)
        self.assertEqual(analyzer.filters, filters)
        self.assertFalse(analyzer.include_visualization)
        self.assertEqual(analyzer.trend_periods, 24)
    
    def test_get_available_date_range(self):
        """Test the get_available_date_range method."""
        analyzer = SalesTrendAnalyzer()
        date_range = analyzer.get_available_date_range()
        
        # Check that the result has the expected structure
        self.assertIsInstance(date_range, dict)
        self.assertEqual(date_range["status"], "success")
        
        # Check that dates are valid
        self.assertIn("min_date", date_range)
        self.assertIn("max_date", date_range)
        
        # Verify min_date is before max_date
        min_date = datetime.strptime(date_range["min_date"], "%Y-%m-%d")
        max_date = datetime.strptime(date_range["max_date"], "%Y-%m-%d")
        self.assertLess(min_date, max_date)
    
    def test_time_grouping(self):
        """Test the _get_time_grouping method."""
        # Test all valid time periods
        valid_periods = ["daily", "weekly", "monthly", "quarterly", "annual"]
        
        for period in valid_periods:
            analyzer = SalesTrendAnalyzer(time_period=period)
            grouping = analyzer._get_time_grouping()
            
            # Check that the result is a non-empty string
            self.assertIsInstance(grouping, str)
            self.assertTrue(len(grouping) > 0)
    
    def test_analyze_trends_basic(self):
        """Test the analyze_trends method with basic parameters."""
        analyzer = SalesTrendAnalyzer(
            time_period="monthly",
            metric="revenue",
            dimension=None,
            include_visualization=False
        )
        
        # Get a date range for testing
        date_range = analyzer.get_available_date_range()
        min_date = date_range["min_date"]
        max_date = date_range["max_date"]
        
        # Analyze for a specific period
        result = analyzer.analyze_trends(min_date, max_date)
        
        # Check that the result has the expected structure
        self.assertIsInstance(result, dict)
        self.assertEqual(result["status"], "success")
        
        # Check for key attributes
        expected_keys = ["analysis", "time_period", "metric", "dimension", "start_date", "end_date"]
        for key in expected_keys:
            self.assertIn(key, result)
        
        # Check analysis structure
        analysis = result["analysis"]
        self.assertIsInstance(analysis, dict)
        
        # Check for total_revenue in the analysis
        self.assertIn("total_revenue", analysis)
        
        # Check for growth data
        if "revenue_growth" in analysis:
            self.assertIsInstance(analysis["revenue_growth"], (float, np.float64))
        
        # Check for average data
        if "avg_daily_revenue" in analysis:
            self.assertIsInstance(analysis["avg_daily_revenue"], (float, np.float64))
    
    def test_analyze_with_dimension(self):
        """Test the analyze_trends method with a dimension."""
        analyzer = SalesTrendAnalyzer(
            time_period="monthly",
            metric="revenue",
            dimension="region",
            top_n=3,
            include_visualization=False
        )
        
        # Get a date range for testing
        date_range = analyzer.get_available_date_range()
        min_date = date_range["min_date"]
        max_date = date_range["max_date"]
        
        # Analyze for a specific period
        result = analyzer.analyze_trends(min_date, max_date)
        
        # Check that the result has the expected structure
        self.assertIsInstance(result, dict)
        self.assertEqual(result["status"], "success")
        
        # Check analysis structure
        analysis = result["analysis"]
        
        # Check that top_performers is either None or a list
        if analysis["top_performers"] is not None:
            self.assertIsInstance(analysis["top_performers"], list)
            
            # Verify the number of top performers
            self.assertLessEqual(len(analysis["top_performers"]), 3)
            
            # Check that each performer has a name and value
            for performer in analysis["top_performers"]:
                self.assertIn("name", performer)
                self.assertIn("value", performer)
    
    def test_analyze_different_metrics(self):
        """Test the analyze_trends method with different metrics."""
        metrics = ["revenue", "units", "aov"]
        
        for metric in metrics:
            analyzer = SalesTrendAnalyzer(
                time_period="monthly",
                metric=metric,
                dimension=None,
                include_visualization=False
            )
            
            # Get a date range for testing
            date_range = analyzer.get_available_date_range()
            min_date = date_range["min_date"]
            max_date = date_range["max_date"]
            
            # Analyze for a specific period
            result = analyzer.analyze_trends(min_date, max_date)
            
            # Check that the result was successful
            self.assertEqual(result["status"], "success")
            
            # Check that the metric is correct
            self.assertEqual(result["metric"], metric)

if __name__ == "__main__":
    unittest.main() 