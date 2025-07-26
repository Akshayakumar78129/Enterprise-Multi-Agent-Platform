import unittest
import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sqlite3

# Add parent directory to path to import DemandForecastEngine
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)
# Add project root to path
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
sys.path.insert(0, project_dir)

from DemandForecastEngine import DemandForecastEngine

class TestDemandForecastEngine(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Set up the database connection for all tests."""
        # Use the actual database path
        cls.db_path = os.path.abspath(os.path.join(
            project_dir, "Project", "Sales", "database", "sales_agent.db"
        ))
        print(f"Using database at: {cls.db_path}")
        
        # Check if the path exists, if not try an alternate path
        if not os.path.exists(cls.db_path):
            # Try alternate path (removing the duplicate Project)
            cls.db_path = os.path.abspath(os.path.join(
                project_dir, "Sales", "database", "sales_agent.db"
            ))
            print(f"Trying alternate database path: {cls.db_path}")
        
        # Ensure the database path is correctly set
        assert os.path.exists(cls.db_path), f"Database file not found at {cls.db_path}"
    
    def test_initialization(self):
        """Test engine initialization with database path."""
        engine = DemandForecastEngine(db_path=self.db_path)
        self.assertEqual(engine.db_path, self.db_path)
        self.assertIsNone(engine.conn)
    
    def test_context_manager(self):
        """Test the engine context manager for proper connection handling."""
        with DemandForecastEngine(db_path=self.db_path) as engine:
            self.assertIsNotNone(engine.conn)
            # Test by running a simple query
            cursor = engine.conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;")
            result = cursor.fetchone()
            self.assertIsNotNone(result)
            
        # Connection should be closed after exiting the context
        self.assertIsNone(engine.conn)
    
    def test_get_latest_date(self):
        """Test getting the latest date from the database."""
        with DemandForecastEngine(db_path=self.db_path) as engine:
            latest_date = engine._get_latest_date()
            
            # Check that the returned date is a valid date string in YYYY-MM-DD format
            try:
                parsed_date = datetime.strptime(latest_date, "%Y-%m-%d")
                self.assertTrue(isinstance(parsed_date, datetime))
            except ValueError:
                self.fail(f"Invalid date format: {latest_date}")
    
    def test_prepare_demand_data(self):
        """Test the prepare_demand_data method."""
        with DemandForecastEngine(db_path=self.db_path) as engine:
            # Get data for a specific date range
            end_date = engine._get_latest_date()
            end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
            start_date = (end_date_dt - timedelta(days=30)).strftime("%Y-%m-%d")
            
            data = engine.prepare_demand_data(start_date=start_date, end_date=end_date)
            
            # Check that the result is a DataFrame with expected columns
            self.assertIsInstance(data, pd.DataFrame)
            if not data.empty:
                expected_columns = ['Txn Date', 'Quantity', 'Net Sales Amount']
                for col in expected_columns:
                    self.assertIn(col, data.columns)
    
    def test_analyze_demand_patterns(self):
        """Test the analyze_demand_patterns method."""
        with DemandForecastEngine(db_path=self.db_path) as engine:
            # First get some data
            end_date = engine._get_latest_date()
            end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
            start_date = (end_date_dt - timedelta(days=30)).strftime("%Y-%m-%d")
            
            data = engine.prepare_demand_data(start_date=start_date, end_date=end_date)
            
            if not data.empty:
                # Analyze patterns
                patterns = engine.analyze_demand_patterns(data)
                
                # Check pattern structure
                self.assertIsInstance(patterns, dict)
                
                # Expected properties in the patterns
                expected_properties = ['mean', 'std', 'min', 'max', 'count']
                for prop in expected_properties:
                    self.assertIn(prop, patterns)
    
    def test_generate_forecast_for_period(self):
        """Test the generate_forecast_for_period method."""
        engine = DemandForecastEngine(db_path=self.db_path)
        
        # Generate forecast for a month
        forecast = engine.generate_forecast_for_period(period='month')
        
        # Check forecast structure
        self.assertIsInstance(forecast, dict)
        
        if forecast:
            # Check top-level properties
            self.assertIn('forecast', forecast)
            self.assertIn('evaluation', forecast)
            self.assertIn('patterns', forecast)
            self.assertIn('revenue_metrics', forecast)
            
            # Check forecast data
            forecast_data = forecast['forecast']
            self.assertIn('dates', forecast_data)
            self.assertIn('values', forecast_data)
            self.assertIn('revenue', forecast_data)
            
            # Check revenue metrics
            revenue_metrics = forecast['revenue_metrics']
            self.assertIn('total_forecast_revenue', revenue_metrics)
            self.assertIn('average_daily_revenue', revenue_metrics)

if __name__ == "__main__":
    unittest.main() 