"""
Test script for ProductPerformanceAnalyzer
"""

import unittest
import os
import sys
from datetime import datetime, timedelta
import pandas as pd

# Add the project root to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from orchestration_agent.tools.sales_analyst.tools.ProductPerformanceAnalyzer import ProductPerformanceAnalyzer
from orchestration_agent.tools.sales_analyst.database.connection import get_connection
from orchestration_agent.tools.sales_analyst.database.query_templates import get_latest_date

class TestProductPerformanceAnalyzer(unittest.TestCase):
    """Test cases for ProductPerformanceAnalyzer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.db_path = r"C:\Code\PythonProject\MultiagentML\multiagent-googleADK\orchestration_agent\database\sales_agent.db"
        self.analyzer = ProductPerformanceAnalyzer(
            metrics=['sales', 'units', 'margin'],
            category_level='product',
            min_sales_threshold=1000,
            include_visualization=True,
            db_path=self.db_path
        )
        
    def test_analyze_performance(self):
        """Test basic performance analysis."""
        result = self.analyzer.analyze_performance()
        
        self.assertEqual(result["status"], "success")
        self.assertIn("results", result)
        self.assertIn("period", result)
        self.assertGreater(len(result["results"]), 0)
        
    def test_analyze_performance_with_custom_dates(self):
        """Test performance analysis with custom date range."""
        conn, wrapper = get_connection()
        latest_date = get_latest_date(conn)
        conn.close()
        wrapper.close()
        
        end_date = datetime.strptime(latest_date, "%Y-%m-%d")
        start_date = (end_date - timedelta(days=90)).strftime("%Y-%m-%d")
        end_date = end_date.strftime("%Y-%m-%d")
        
        result = self.analyzer.analyze_performance(
            start_date=start_date,
            end_date=end_date
        )
        
        self.assertEqual(result["status"], "success")
        self.assertIn("results", result)
        self.assertIn("period", result)
        self.assertGreater(len(result["results"]), 0)
        
    def test_analyze_performance_with_different_metrics(self):
        """Test performance analysis with different metrics."""
        metrics = ['sales', 'units', 'margin', 'price_bands']
        
        for metric in metrics:
            analyzer = ProductPerformanceAnalyzer(
                metrics=[metric],
                category_level='product',
                include_visualization=True,
                db_path=self.db_path
            )
            
            result = analyzer.analyze_performance()
            
            self.assertEqual(result["status"], "success")
            self.assertIn("results", result)
            self.assertIn(metric, result["results"])
            
    def test_analyze_performance_with_different_category_levels(self):
        """Test performance analysis with different category levels."""
        category_levels = ['product', 'category', 'subcategory']
        
        for level in category_levels:
            analyzer = ProductPerformanceAnalyzer(
                metrics=['sales'],
                category_level=level,
                include_visualization=True,
                db_path=self.db_path
            )
            
            result = analyzer.analyze_performance()
            
            self.assertEqual(result["status"], "success")
            self.assertIn("results", result)
            self.assertIn("sales", result["results"])
            
    def test_analyze_performance_with_min_sales_threshold(self):
        """Test performance analysis with minimum sales threshold."""
        analyzer = ProductPerformanceAnalyzer(
            metrics=['sales'],
            category_level='product',
            min_sales_threshold=10000,
            include_visualization=True,
            db_path=self.db_path
        )
        
        result = analyzer.analyze_performance()
        
        self.assertEqual(result["status"], "success")
        if result["results"]["sales"]["top_products"]:
            self.assertTrue(all(product["sales_amount"] >= 10000 
                              for product in result["results"]["sales"]["top_products"]))
            
    def test_analyze_performance_without_visualization(self):
        """Test performance analysis without visualization."""
        analyzer = ProductPerformanceAnalyzer(
            metrics=['sales'],
            category_level='product',
            include_visualization=False,
            db_path=self.db_path
        )
        
        result = analyzer.analyze_performance()
        
        self.assertEqual(result["status"], "success")
        self.assertIn("results", result)
        self.assertNotIn("visualization", result["results"])
        
    def test_invalid_parameters(self):
        """Test handling of invalid parameters."""
        with self.assertRaises(ValueError):
            ProductPerformanceAnalyzer(
                metrics=['invalid_metric'],
                category_level='product'
            )
            
        with self.assertRaises(ValueError):
            ProductPerformanceAnalyzer(
                metrics=['sales'],
                category_level='invalid_level'
            )
            
    def test_no_data_period(self):
        """Test analysis for a period with no data."""
        # Use dates far in the future where there should be no data
        result = self.analyzer.analyze_performance(
            start_date="2100-01-01",
            end_date="2100-12-31"
        )
        
        self.assertEqual(result["status"], "error")
        self.assertEqual(result["message"], "No data found for the specified period")


if __name__ == "__main__":
    unittest.main() 