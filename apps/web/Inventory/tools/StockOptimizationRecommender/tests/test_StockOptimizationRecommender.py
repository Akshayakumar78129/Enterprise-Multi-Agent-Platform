import unittest
import pandas as pd
from datetime import datetime, timedelta
from Inventory.tools.StockOptimizationRecommender.StockOptimizationRecommender import (
    setup_database_path,
    DatabaseConnector,
    fetch_inventory_data,
    fetch_sales_data,
    optimize_stock_levels
)

class TestStockOptimizationRecommender(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure database environment and get connector instance
        assert setup_database_path(), "Failed to set up database path"
        cls.connector = DatabaseConnector.get_instance()
        assert cls.connector.connect(), "Failed to connect to database"

    def test_database_connection(self):
        # Test that the connector has an active connection
        self.assertIsNotNone(self.connector.connection)
        cursor = self.connector.connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        self.assertTrue(len(tables) > 0, "No tables found in database")

    def test_fetch_inventory_data(self):
        df = fetch_inventory_data(self.connector, None, None, None)
        self.assertIsInstance(df, pd.DataFrame)
        if not df.empty:
            expected_cols = [
                'Item_Key', 'Item_Number', 'Item_Name', 'Item_Category',
                'Unit_Cost', 'Warehouse_Key', 'Warehouse_ID', 'Warehouse_Name',
                'Current_Stock', 'Reorder_Point', 'Safety_Stock', 'Snapshot_Date'
            ]
            for col in expected_cols:
                self.assertIn(col, df.columns)

    def test_fetch_sales_data(self):
        df = fetch_sales_data(self.connector, None, None, None)
        self.assertIsInstance(df, pd.DataFrame)
        if not df.empty:
            expected_cols = [
                'Item_Key', 'Item_Number', 'Item_Category',
                'Warehouse_Key', 'Transaction_Date', 'Quantity'
            ]
            for col in expected_cols:
                self.assertIn(col, df.columns)

    def test_optimize_stock_levels(self):
        # Call optimize_stock_levels with real database connection
        result = optimize_stock_levels()
        
        # Verify it returns expected structure
        self.assertIsInstance(result, dict)
        for key in ['text_report', 'recommendations', 'raw_data']:
            self.assertIn(key, result)
        self.assertIsInstance(result['raw_data'], list)
        
        # Get raw data directly from database for comparison
        inventory_data = fetch_inventory_data(self.connector, None, None, None)
        sales_data = fetch_sales_data(self.connector, None, None, None)
        
        # Explicitly verify we're not using sample data
        if not inventory_data.empty and not sales_data.empty:
            # If we have actual data in the database, ensure we're using it
            self.assertIn("Using actual data from the database", result.get("text_report", ""))
            self.assertNotIn("Using generated sample data", result.get("text_report", ""))
        else:
            # If no data in database, sample data fallback is acceptable
            self.assertIn("Using generated sample data", result.get("text_report", ""))
        
        # Ensure the raw_data is not empty
        self.assertTrue(len(result.get("raw_data", [])) > 0, "Result should have some data")

if __name__ == '__main__':
    unittest.main() 