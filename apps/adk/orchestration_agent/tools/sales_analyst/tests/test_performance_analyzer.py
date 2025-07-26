"""
Test script for SalesPerformanceAnalyzer
"""

import unittest
import os
import sys
from datetime import datetime, timedelta

# Add the project root to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from orchestration_agent.tools.sales_analyst.tools.SalesPerformanceAnalyzer import SalesPerformanceAnalyzer
from orchestration_agent.tools.sales_analyst.tests.test_db_setup import setup_test_database

class TestSalesPerformanceAnalyzer(unittest.TestCase):
    """Test cases for SalesPerformanceAnalyzer."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test database before running tests."""
        cls.conn = setup_test_database()
        cls.start_date = "2020-06-01"
        cls.end_date = "2020-12-31"
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests."""
        if hasattr(cls, 'conn'):
            cls.conn.close()
    
    def test_basic_performance_analysis(self):
        """Test basic performance analysis without filters."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="monthly",
            metric="revenue"
        )
        
        result = analyzer.analyze_performance()
        
        self.assertEqual(result['status'], 'success')
        self.assertIn('data', result)
        self.assertIn('metadata', result)
        self.assertGreater(len(result['data']), 0)
    
    def test_filtered_analysis(self):
        """Test performance analysis with filters."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="monthly",
            metric="revenue",
            filters={"category": "Electronics"}
        )
        
        result = analyzer.analyze_performance()
        
        self.assertEqual(result['status'], 'success')
        self.assertTrue(all(item['category'] == 'Electronics' for item in result['data']))
    
    def test_comparison_analysis(self):
        """Test period-over-period comparison analysis."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="region",
            time_period="monthly",
            metric="revenue",
            comparison_mode="period_over_period"
        )
        
        result = analyzer.analyze_performance()
        
        self.assertEqual(result['status'], 'success')
        self.assertIn('data', result)
        self.assertIn('metadata', result)
    
    def test_invalid_parameters(self):
        """Test handling of invalid parameters."""
        with self.assertRaises(ValueError):
            SalesPerformanceAnalyzer(
                dimension="invalid_dimension",
                time_period="monthly",
                metric="revenue"
            )
    
    def test_no_data_period(self):
        """Test analysis for a period with no data."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="monthly",
            metric="revenue"
        )
        
        # Use dates outside the test data range
        result = analyzer.analyze_performance()
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(len(result['data']), 0)

if __name__ == '__main__':
    unittest.main() 