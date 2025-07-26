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
from InventoryLevelAnalyzer import (
    setup_database_path,
    DatabaseConnector,
    fetch_inventory_data,
    fetch_sales_data,
    parse_time_period,
    calculate_inventory_levels,
    analyze_inventory_levels
)

class TestInventoryLevelAnalyzer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure database environment and get connector instance
        assert setup_database_path(), "Failed to set up database path"
        cls.connector = DatabaseConnector.get_instance()
        assert cls.connector.connect(), "Failed to connect to database"
        
        # Set up test parameters
        cls.time_period = "last_year"
        cls.min_stock_threshold = 0.1

    def test_database_connection(self):
        # Test that the connector has an active connection
        self.assertIsNotNone(self.connector.connection)
        cursor = self.connector.connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        self.assertTrue(len(tables) > 0, "No tables found in database")
        
        # Verify we can access required tables for the analysis
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
        
        # Check if we found actual data
        if not df.empty:
            print("Successfully fetched real inventory data from the database")
            
            expected_cols = [
                'Item_Key', 'Item_Number', 'Item_Name', 'Item_Category',
                'Unit_Cost', 'Warehouse_Key', 'Warehouse_ID', 'Warehouse_Name',
                'Current_Stock', 'Snapshot_Date'
            ]
            for col in expected_cols:
                self.assertIn(col, df.columns)
        else:
            print("No inventory data found in the database, fallback would be used")

    def test_fetch_sales_data(self):
        # Test fetching sales data from actual database
        df = fetch_sales_data(self.connector, self.time_period, None, None)
        self.assertIsInstance(df, pd.DataFrame)
        
        # Check if we found actual data
        if not df.empty:
            print("Successfully fetched real sales data from the database")
            
            expected_cols = [
                'Item_Key', 'Item_Number', 'Item_Category', 'Warehouse_Key',
                'Transaction_Date', 'Quantity'
            ]
            for col in expected_cols:
                self.assertIn(col, df.columns)
        else:
            print("No sales data found in the database, fallback would be used")

    def test_calculate_inventory_levels(self):
        # Test inventory level calculation with actual data
        inventory_data = fetch_inventory_data(self.connector, self.time_period, None, None)
        sales_data = fetch_sales_data(self.connector, self.time_period, None, None)
        
        # Use actual data if available, otherwise test will be skipped
        if not inventory_data.empty and not sales_data.empty:
            print("Using real data for inventory level calculations")
            
            analysis_data = calculate_inventory_levels(
                inventory_data, 
                sales_data, 
                self.min_stock_threshold
            )
            
            self.assertIsInstance(analysis_data, pd.DataFrame)
            self.assertIn('Stock Level %', analysis_data.columns)
            self.assertIn('Is Low Stock', analysis_data.columns)
            self.assertIn('Stockout Risk', analysis_data.columns)
            self.assertIn('Days of Supply', analysis_data.columns)
        else:
            print("Skipping detailed inventory level calculation test as no real data available")

    def test_analyze_inventory_levels(self):
        # Test the main analysis function
        result = analyze_inventory_levels(
            time_period=self.time_period,
            min_stock_threshold=self.min_stock_threshold
        )
        
        # Verify result structure
        self.assertIsInstance(result, dict)
        
        # Check that all expected keys are present
        for key in ['text_report', 'visualizations', 'recommendations', 'raw_data']:
            self.assertIn(key, result)
        
        # Check if real data was used - if so, confirm it's noted in the text_report
        inventory_data = fetch_inventory_data(self.connector, self.time_period, None, None)
        sales_data = fetch_sales_data(self.connector, self.time_period, None, None)
        
        if not inventory_data.empty and not sales_data.empty:
            self.assertIn("Using actual data from the database", result.get("text_report", ""))
            print("Confirmed analysis used real database data")
        else:
            self.assertIn("Using generated sample data for demonstration", result.get("text_report", ""))
            print("Analysis used fallback sample data")
            
        # Ensure raw_data is not empty
        self.assertTrue(len(result.get("raw_data", [])) > 0, "Result should have some data")
        
        # Ensure recommendations are provided
        self.assertIsInstance(result.get("recommendations"), dict)
        self.assertTrue(len(result.get("recommendations")) > 0, "No recommendations were generated")
        
        # Ensure visualizations are generated
        self.assertIsInstance(result.get("visualizations"), dict)
        self.assertTrue(len(result.get("visualizations")) > 0, "No visualizations were generated")

    def test_analyze_inventory_levels_with_filters(self):
        # Test with category filter if we have real data
        inventory_data = fetch_inventory_data(self.connector, self.time_period, None, None)
        
        if not inventory_data.empty:
            # Get a sample category from the data
            sample_category = inventory_data['Item_Category'].iloc[0]
            
            result = analyze_inventory_levels(
                time_period=self.time_period,
                min_stock_threshold=self.min_stock_threshold,
                category=sample_category
            )
            
            self.assertIsInstance(result, dict)
            print(f"Successfully filtered analysis by category: {sample_category}")

if __name__ == '__main__':
    unittest.main() 