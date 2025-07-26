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
from InventoryHoldingCostAnalyzer import (
    setup_database_path,
    DatabaseConnector,
    fetch_inventory_data,
    parse_time_period,
    calculate_holding_costs,
    analyze_holding_costs
)

class TestInventoryHoldingCostAnalyzer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure database environment and get connector instance
        assert setup_database_path(), "Failed to set up database path"
        cls.connector = DatabaseConnector.get_instance()
        assert cls.connector.connect(), "Failed to connect to database"
        
        # Set up test parameters
        cls.time_period = "last_year"
        cls.annual_holding_cost_percentage = 0.25
        cls.opportunity_cost_rate = 0.08

    def test_database_connection(self):
        # Test that the connector has an active connection
        self.assertIsNotNone(self.connector.connection)
        cursor = self.connector.connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        self.assertTrue(len(tables) > 0, "No tables found in database")
        
        # Verify we can access required tables for the analysis
        required_tables = ['dbo_D_Item', 'dbo_F_Inventory_Snapshot', 'dbo_D_Warehouse']
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
            'Storage_Cost_Per_Unit', 'Warehouse_Type',
            'Current_Stock', 'Average_Stock_Level', 'Snapshot_Date',
            'Lead_Time_Days', 'Obsolescence_Risk', 'Storage_Requirements'
        ]
        for col in expected_cols:
            self.assertIn(col, df.columns)

    def test_calculate_holding_costs(self):
        # Test calculation of holding costs with actual data
        inventory_data = fetch_inventory_data(self.connector, self.time_period, None, None)
        
        # Ensure we have actual data
        self.assertFalse(inventory_data.empty, "No inventory data found for holding cost calculation test")
        
        analysis_data = calculate_holding_costs(
            inventory_data, 
            self.annual_holding_cost_percentage, 
            self.opportunity_cost_rate
        )
        
        self.assertIsInstance(analysis_data, pd.DataFrame)
        self.assertIn('Average Inventory Value', analysis_data.columns)
        self.assertIn('Annual Holding Cost', analysis_data.columns)
        self.assertIn('Annual Opportunity Cost', analysis_data.columns)
        self.assertIn('Annual Storage Cost', analysis_data.columns)
        self.assertIn('Annual Risk Cost', analysis_data.columns)
        self.assertIn('Total Holding Cost', analysis_data.columns)
        self.assertIn('Holding Cost %', analysis_data.columns)
        self.assertIn('Excessive Holding Cost', analysis_data.columns)
        self.assertIn('Potential Annual Savings', analysis_data.columns)

    def test_analyze_holding_costs(self):
        # Test the main analysis function
        result = analyze_holding_costs(
            time_period=self.time_period,
            annual_holding_cost_percentage=self.annual_holding_cost_percentage,
            opportunity_cost_rate=self.opportunity_cost_rate
        )
        
        # Verify result structure
        self.assertIsInstance(result, dict)
        
        # Ensure no error occurred
        self.assertNotIn("error", result, "Analysis returned an error instead of results")
        self.assertEqual(result.get("status"), "success", "Analysis did not return a success status")
        
        # Check that all expected keys are present
        for key in ['text_report', 'recommendations', 'raw_data', 'status']:
            self.assertIn(key, result)
            
        # Verify we're using the actual database
        self.assertIn("Using actual data from the database", result.get("text_report", ""))
        
        # Ensure raw_data is not empty
        self.assertTrue(len(result.get("raw_data", [])) > 0, "Result should have some data")
        
        # Ensure recommendations are provided
        self.assertIsInstance(result.get("recommendations"), dict)
        self.assertTrue(len(result.get("recommendations")) > 0, "No recommendations were generated")

    def test_analyze_holding_costs_with_filters(self):
        # Test with category filter
        inventory_data = fetch_inventory_data(self.connector, self.time_period, None, None)
        if not inventory_data.empty:
            # Get a sample category from the data
            sample_category = inventory_data['Item_Category'].iloc[0]
            
            result = analyze_holding_costs(
                time_period=self.time_period,
                annual_holding_cost_percentage=self.annual_holding_cost_percentage,
                opportunity_cost_rate=self.opportunity_cost_rate,
                category=sample_category
            )
            
            self.assertIsInstance(result, dict)
            self.assertEqual(result.get("status"), "success", "Analysis with category filter failed")

if __name__ == '__main__':
    unittest.main() 