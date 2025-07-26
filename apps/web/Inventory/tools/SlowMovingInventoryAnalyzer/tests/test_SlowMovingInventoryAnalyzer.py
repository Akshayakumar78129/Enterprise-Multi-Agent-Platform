import unittest
import pandas as pd
from datetime import datetime, timedelta
import sys
import os

# Add the parent directory to sys.path to import the module
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Add project root to path to ensure imports work
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Now import the module
from SlowMovingInventoryAnalyzer import (
    setup_database_path,
    DatabaseConnector,
    fetch_inventory_data,
    fetch_sales_data,
    parse_time_period,
    calculate_turnover_and_aging,
    analyze_slow_moving_inventory
)

class TestSlowMovingInventoryAnalyzer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure database environment and get connector instance
        assert setup_database_path(), "Failed to set up database path"
        cls.connector = DatabaseConnector.get_instance()
        assert cls.connector.connect(), "Failed to connect to database"
        
        # Set up time period for tests
        cls.time_period = "last_year"
        cls.turnover_threshold = 1.0
        cls.aging_threshold_days = 180

    def test_database_connection(self):
        # Test that the connector has an active connection
        self.assertIsNotNone(self.connector.connection)
        cursor = self.connector.connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        self.assertTrue(len(tables) > 0, "No tables found in database")
        
        # Verify we can actually access required tables for the analysis
        required_tables = ['dbo_D_Item', 'dbo_F_Inventory_Snapshot', 'dbo_D_Warehouse', 'dbo_F_Sales_Transaction']
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        
        for table in required_tables:
            self.assertIn(table, tables, f"Required table {table} not found in database")

    def test_parse_time_period(self):
        # Test parsing of standard time periods
        start_date, end_date = parse_time_period("last_quarter")
        self.assertIsNotNone(start_date)
        self.assertIsNotNone(end_date)
        
        # Verify custom date range
        custom_range = "2022-01-01:2022-12-31"
        start_date, end_date = parse_time_period(custom_range)
        self.assertEqual(start_date.strftime("%Y-%m-%d"), "2022-01-01")
        self.assertEqual(end_date.strftime("%Y-%m-%d"), "2022-12-31")

    def test_fetch_inventory_data(self):
        # Test fetching inventory data from actual database
        df = fetch_inventory_data(self.connector, self.time_period, None, None)
        self.assertIsInstance(df, pd.DataFrame)
        
        # Ensure we have actual data
        self.assertFalse(df.empty, "No inventory data found in the database")
        
        expected_cols = [
            'Item_Key', 'Item_Number', 'Item_Name', 'Item_Category',
            'Unit_Cost', 'Warehouse_Key', 'Warehouse_ID', 'Warehouse_Name',
            'Current_Stock', 'Snapshot_Date'
        ]
        for col in expected_cols:
            self.assertIn(col, df.columns)

    def test_fetch_sales_data(self):
        # Test fetching sales data from actual database
        df = fetch_sales_data(self.connector, self.time_period, None, None)
        self.assertIsInstance(df, pd.DataFrame)
        
        # Ensure we have actual data
        self.assertFalse(df.empty, "No sales data found in the database")
        
        expected_cols = [
            'Item_Key', 'Item_Number', 'Item_Category', 'Warehouse_Key',
            'Transaction_Date', 'Quantity'
        ]
        for col in expected_cols:
            self.assertIn(col, df.columns)

    def test_analyze_slow_moving_inventory(self):
        # Test the main analysis function
        result = analyze_slow_moving_inventory(
            time_period=self.time_period,
            turnover_threshold=self.turnover_threshold,
            aging_threshold_days=self.aging_threshold_days
        )
        
        # Verify result structure
        self.assertIsInstance(result, dict)
        self.assertNotIn("error", result, "Analysis returned an error instead of results")
        
        for key in ['text_report', 'recommendations', 'raw_data']:
            self.assertIn(key, result)
            
        # Verify we're using the actual database
        self.assertIn("Using actual data from the database", result.get("text_report", ""))
        
        # Ensure raw_data is not empty
        self.assertTrue(len(result.get("raw_data", [])) > 0, "Result should have some data")

    def test_calculate_turnover_and_aging(self):
        # Test turnover calculation with actual data
        inventory_data = fetch_inventory_data(self.connector, self.time_period, None, None)
        sales_data = fetch_sales_data(self.connector, self.time_period, None, None)
        
        # Ensure we have actual data
        self.assertFalse(inventory_data.empty, "No inventory data found for turnover calculation test")
        self.assertFalse(sales_data.empty, "No sales data found for turnover calculation test")
        
        analysis_data = calculate_turnover_and_aging(
            inventory_data, 
            sales_data, 
            self.turnover_threshold, 
            self.aging_threshold_days
        )
        
        self.assertIsInstance(analysis_data, pd.DataFrame)
        self.assertIn('Turnover Ratio', analysis_data.columns)
        self.assertIn('Days of Supply', analysis_data.columns)
        self.assertIn('Is Slow Moving', analysis_data.columns)

if __name__ == '__main__':
    unittest.main() 