"""
Test script for SalesPerformanceAnalyzer tool.
"""

import sys
import os
from pathlib import Path
import unittest
from datetime import datetime, timedelta

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from orchestration_agent.tools.sales_analyst.tools.SalesPerformanceAnalyzer import SalesPerformanceAnalyzer
from orchestration_agent.tools.sales_analyst.database.connection import get_connection
from orchestration_agent.tools.sales_analyst.database.query_templates import get_latest_date

class TestSalesPerformanceAnalyzer(unittest.TestCase):
    """Test cases for SalesPerformanceAnalyzer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.db_path = r"C:\Code\PythonProject\MultiagentML\multiagent-googleADK\orchestration_agent\database\sales_agent.db"
        self.analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="last_30_days",
            metric="revenue",
            db_path=self.db_path
        )
        
    def test_analyze_performance(self):
        """Test basic performance analysis."""
        result = self.analyzer.analyze_performance()
        
        self.assertEqual(result["status"], "success")
        self.assertIn("data", result)
        self.assertGreater(len(result["data"]), 0)
        
    def test_analyze_performance_with_filters(self):
        """Test performance analysis with filters."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="last_30_days",
            metric="revenue",
            filters={"product_category": "Electronics"},
            db_path=self.db_path
        )
        
        result = analyzer.analyze_performance()
        
        self.assertEqual(result["status"], "success")
        self.assertIn("data", result)
        self.assertGreater(len(result["data"]), 0)
        
    def test_analyze_performance_with_comparison(self):
        """Test performance analysis with comparison mode."""
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="last_30_days",
            metric="revenue",
            comparison_mode="period_over_period",
            db_path=self.db_path
        )
        
        result = analyzer.analyze_performance()
        
        self.assertEqual(result["status"], "success")
        self.assertIn("data", result)
        self.assertGreater(len(result["data"]), 0)
        
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
        self.assertIn("data", result)
        self.assertGreater(len(result["data"]), 0)
        
    def test_analyze_performance_with_different_metrics(self):
        """Test performance analysis with different metrics."""
        metrics = ["revenue", "units", "aov", "growth", "margin"]
        
        for metric in metrics:
            analyzer = SalesPerformanceAnalyzer(
                dimension="product",
                time_period="last_30_days",
                metric=metric,
                db_path=self.db_path
            )
            
            result = analyzer.analyze_performance()
            
            self.assertEqual(result["status"], "success")
            self.assertIn("data", result)
            self.assertGreater(len(result["data"]), 0)
            
    def test_analyze_performance_with_different_dimensions(self):
        """Test performance analysis with different dimensions."""
        dimensions = ["product", "category", "region", "customer", "time"]
        
        for dimension in dimensions:
            analyzer = SalesPerformanceAnalyzer(
                dimension=dimension,
                time_period="last_30_days",
                metric="revenue",
                db_path=self.db_path
            )
            
            result = analyzer.analyze_performance()
            
            self.assertEqual(result["status"], "success")
            self.assertIn("data", result)
            self.assertGreater(len(result["data"]), 0)
            
    def test_analyze_performance_error_handling(self):
        """Test error handling in performance analysis."""
        # Test with invalid dimension
        analyzer = SalesPerformanceAnalyzer(
            dimension="invalid",
            time_period="last_30_days",
            metric="revenue",
            db_path=self.db_path
        )
        
        result = analyzer.analyze_performance()
        self.assertEqual(result["status"], "error")
        
        # Test with invalid metric
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="last_30_days",
            metric="invalid",
            db_path=self.db_path
        )
        
        result = analyzer.analyze_performance()
        self.assertEqual(result["status"], "error")
        
        # Test with invalid time period
        analyzer = SalesPerformanceAnalyzer(
            dimension="product",
            time_period="invalid",
            metric="revenue",
            db_path=self.db_path
        )
        
        result = analyzer.analyze_performance()
        self.assertEqual(result["status"], "error")

if __name__ == '__main__':
    unittest.main() 