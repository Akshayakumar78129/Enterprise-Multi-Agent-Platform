import unittest
import os
import sys
import pandas as pd
import numpy as np
import sqlite3
from datetime import datetime
import io

# Add parent directory to path to import performance_deviation
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
import performance_deviation
from performance_deviation import analyze_performance_deviations, PerformanceDeviationAnalyzer

class TestPerformanceDeviation(unittest.TestCase):
    
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
    
    def test_analyzer_initialization(self):
        """Test that the PerformanceDeviationAnalyzer can be initialized with the database path."""
        analyzer = PerformanceDeviationAnalyzer(self.db_path)
        self.assertIsNotNone(analyzer)
        self.assertEqual(analyzer.db_path, self.db_path)
        
    def test_extract_kpi_data(self):
        """Test that KPI data can be extracted from the database."""
        analyzer = PerformanceDeviationAnalyzer(self.db_path)
        
        # Use a date range that should have data
        kpi_data = analyzer.extract_kpi_data(start_date="2019-01-01", end_date="2020-12-31")
        
        # Check that the DataFrame has the expected structure
        self.assertIsInstance(kpi_data, pd.DataFrame)
        self.assertIn('date', kpi_data.columns)
        self.assertIn('function', kpi_data.columns)
        
    def test_extract_external_factors(self):
        """Test that external factors can be generated."""
        analyzer = PerformanceDeviationAnalyzer(self.db_path)
        
        # Extract external factors for a specified date range
        external_factors = analyzer.extract_external_factors(
            start_date="2020-01-01", 
            end_date="2020-12-31"
        )
        
        # Check that the DataFrame has the expected structure
        self.assertIsInstance(external_factors, pd.DataFrame)
        self.assertIn('date', external_factors.columns)
        self.assertIn('is_weekend', external_factors.columns)
        self.assertIn('season', external_factors.columns)
        
        # Check that the date range is correct
        self.assertEqual(external_factors['date'].min().strftime('%Y-%m-%d'), "2020-01-01")
        self.assertEqual(external_factors['date'].max().strftime('%Y-%m-%d'), "2020-12-31")
        
    def test_analyze_deviations_with_sample_data(self):
        """Test that analyze_deviations works with sample data."""
        analyzer = PerformanceDeviationAnalyzer(self.db_path)
        
        # Create sample data
        dates = pd.date_range(start='2020-01-01', end='2020-01-10')
        
        # Sample KPI data
        kpi_data = pd.DataFrame({
            'date': dates,
            'function': ['sales'] * len(dates),
            'transaction_count': np.random.randint(100, 200, len(dates)),
            'total_revenue': np.random.uniform(5000, 10000, len(dates)),
            'avg_transaction_value': np.random.uniform(50, 100, len(dates))
        })
        
        # Sample external factors
        external_factors = pd.DataFrame({
            'date': dates,
            'is_weekend': dates.dayofweek.isin([5, 6]).astype(int),
            'is_holiday': np.random.binomial(1, 0.1, len(dates)),
            'season': pd.cut(dates.month, bins=[0,3,6,9,12], 
                           labels=['winter', 'spring', 'summer', 'fall']),
            'market_condition': np.random.choice(
                ['stable', 'growing', 'declining'], 
                size=len(dates)
            ),
            'competitor_activity_level': np.random.normal(5, 1, len(dates))
        })
        
        # Test analyze_deviations
        try:
            results = analyzer.analyze_deviations(kpi_data, external_factors)
            self.assertIsInstance(results, dict)
            
            # Check the structure of the results
            for kpi in results:
                self.assertIn('feature_importance', results[kpi])
                self.assertIn('variance_decomposition', results[kpi])
                self.assertIn('deviations', results[kpi])
                
        except Exception as e:
            self.fail(f"analyze_deviations raised exception: {str(e)}")
    
    def test_visualize_deviations(self):
        """Test that visualize_deviations generates a visualization."""
        analyzer = PerformanceDeviationAnalyzer(self.db_path)
        
        # Create sample data
        dates = pd.date_range(start='2020-01-01', end='2020-01-10')
        
        # Sample KPI data
        kpi_data = pd.DataFrame({
            'date': dates,
            'function': ['sales'] * len(dates),
            'transaction_count': np.random.randint(100, 200, len(dates)),
            'total_revenue': np.random.uniform(5000, 10000, len(dates)),
            'avg_transaction_value': np.random.uniform(50, 100, len(dates))
        })
        
        # Sample analysis results
        transaction_values = np.random.randint(100, 200, len(dates))
        predictions = np.random.randint(90, 210, len(dates))
        
        analysis_results = {
            'transaction_count': {
                'feature_importance': [
                    {'feature': 'is_weekend', 'importance': 0.4},
                    {'feature': 'is_holiday', 'importance': 0.3},
                    {'feature': 'season_spring', 'importance': 0.2},
                    {'feature': 'market_condition_growing', 'importance': 0.1}
                ],
                'variance_decomposition': {
                    'total': 100.0,
                    'explained': 80.0
                },
                'deviations': np.random.normal(0, 10, len(dates)).tolist(),
                'predictions': predictions.tolist()
            }
        }
        
        # Create a buffer to save the visualization
        buf = io.BytesIO()
        
        # Test visualize_deviations
        try:
            analyzer.visualize_deviations(kpi_data, analysis_results, buf)
            
            # Check that something was written to the buffer
            buf.seek(0, os.SEEK_END)
            buffer_size = buf.tell()
            self.assertGreater(buffer_size, 0, "Visualization buffer is empty")
            
        except Exception as e:
            self.fail(f"visualize_deviations raised exception: {str(e)}")
    
    def test_analyze_performance_deviations_function(self):
        """Test the main analyze_performance_deviations function."""
        # Test with minimal parameters
        result = analyze_performance_deviations(
            start_date="2020-01-01",
            end_date="2020-12-31",
            include_visualization=False
        )
        
        # Check that the function returns a string
        self.assertIsInstance(result, str)
        
        # If we have data, it should contain "Performance Deviation Analysis"
        if "No KPI data found" not in result and "Analysis Error" not in result:
            self.assertIn("Performance Deviation Analysis", result)
        
    def test_database_connection(self):
        """Test that the database connection works."""
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            self.assertTrue(len(tables) > 0, "Database should have tables")
        except Exception as e:
            self.fail(f"Database connection test failed: {str(e)}")
        finally:
            cursor.close()

if __name__ == '__main__':
    unittest.main() 