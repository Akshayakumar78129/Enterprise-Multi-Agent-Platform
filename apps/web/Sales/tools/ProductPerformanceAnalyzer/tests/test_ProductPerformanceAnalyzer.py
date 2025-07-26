import unittest
import os
import sys
import pandas as pd
import sqlite3

# Add parent directory to path to import ProductPerformanceAnalyzer
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)
# Add project root to path
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.insert(0, project_dir)

from ProductPerformanceAnalyzer import ProductPerformanceAnalyzer

class TestProductPerformanceAnalyzer(unittest.TestCase):
    
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
        
    def test_initialization(self):
        """Test that the analyzer can be initialized properly."""
        analyzer = ProductPerformanceAnalyzer(
            metrics=["sales", "units", "margin"],
            category_level="product",
            min_sales_threshold=1000,
            include_visualization=False
        )
        self.assertEqual(analyzer.metrics, ["sales", "units", "margin"])
        self.assertEqual(analyzer.category_level, "product")
        self.assertEqual(analyzer.min_sales_threshold, 1000)
        self.assertEqual(analyzer.include_visualization, False)
        
    def test_build_query(self):
        """Test the query building function."""
        analyzer = ProductPerformanceAnalyzer(category_level="product")
        query = analyzer._build_query()
        
        # Check that the query contains expected SQL clauses
        self.assertIn("SELECT", query)
        self.assertIn("FROM", query)
        self.assertIn("WHERE", query)
        self.assertIn("GROUP BY", query)
        
        # Test different category levels
        analyzer = ProductPerformanceAnalyzer(category_level="category")
        query = analyzer._build_query()
        self.assertIn("GROUP BY i.\"Item Category Desc\"", query)
        
        analyzer = ProductPerformanceAnalyzer(category_level="subcategory")
        query = analyzer._build_query()
        self.assertIn("GROUP BY i.\"Item Subcategory Desc\"", query)
    
    def test_analyze_performance(self):
        """Test the analyze_performance method using the actual database."""
        analyzer = ProductPerformanceAnalyzer(
            metrics=["sales"],
            category_level="category",
            include_visualization=False
        )
        
        # Test with default parameters
        result = analyzer.analyze_performance()
        
        # Check the result structure
        self.assertIsInstance(result, dict)
        self.assertIn("status", result)
        
        # If data was found, check the content
        if result["status"] == "success":
            self.assertIn("results", result)
            self.assertIn("period", result)
            self.assertIn("sales", result["results"])
            self.assertIn("total_sales", result["results"]["sales"])
            self.assertIn("category_distribution", result["results"]["sales"])
            
    def test_analyze_margins(self):
        """Test the margin analysis function."""
        # Create sample data for testing
        data = pd.DataFrame({
            "product_name": ["Product A", "Product B", "Product C"],
            "sales_amount": [1000, 2000, 3000],
            "cost": [500, 1000, 1200],
            "category": ["Category 1", "Category 1", "Category 2"]
        })
        
        analyzer = ProductPerformanceAnalyzer()
        result = analyzer._analyze_margins(data)
        
        # Check the result structure
        self.assertIn("total_margin", result)
        self.assertIn("average_margin_pct", result)
        self.assertIn("top_products", result)
        self.assertIn("category_distribution", result)
        
        # Check calculations
        self.assertEqual(result["total_margin"], 3300)  # Sum of (1000-500) + (2000-1000) + (3000-1200)

if __name__ == "__main__":
    unittest.main()
