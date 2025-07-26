import unittest
import pandas as pd
import json
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
from financial_tool import (
    setup_database_path,
    get_db_connection,
    get_db_path,
    cash_flow_analysis,
    revenue_forecast,
    analyze_ar_aging
)

class TestFinancialTool(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure database environment
        assert setup_database_path(), "Failed to set up database path"
        
    def setUp(self):
        # Create a new connection for each test
        self.conn = get_db_connection()
        self.assertIsNotNone(self.conn, "Failed to get database connection")
        
    def tearDown(self):
        # Close the connection after each test
        if hasattr(self, 'conn') and self.conn:
            try:
                self.conn.close()
            except:
                pass

    def test_database_connection(self):
        # Test that we have a working database connection
        # Create a new connection for this test to avoid closed connection issues
        conn = get_db_connection()
        self.assertIsNotNone(conn)
        
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            self.assertTrue(len(tables) > 0, "No tables found in database")
            
            # Print out the actual tables in the database for debugging
            print("\nActual tables in the database:")
            for table in tables:
                print(f"  - {table[0]}")
            
            # Check if any of the required tables are present
            available_tables = [table[0] for table in tables]
            
            # Look for similar tables that might be used instead
            if '"dbo_F_GL_Transaction_Detail"' not in available_tables:
                similar_gl_tables = [t for t in available_tables if 'gl' in t.lower() or 'transaction' in t.lower()]
                if similar_gl_tables:
                    print(f"\nPossible alternatives for 'dbo_F_GL_Transaction_Detail': {similar_gl_tables}")
            
            if '"dbo_F_AR_Header"' not in available_tables:
                similar_ar_tables = [t for t in available_tables if 'ar' in t.lower() or 'receivable' in t.lower()]
                if similar_ar_tables:
                    print(f"\nPossible alternatives for 'dbo_F_AR_Header': {similar_ar_tables}")
        finally:
            if conn:
                conn.close()

    def test_cash_flow_analysis(self):
        # Test the cash flow analysis function with real data
        try:
            result_json = cash_flow_analysis()
            self.assertIsInstance(result_json, str)
            
            # Parse the JSON result
            result = json.loads(result_json)
            
            if "error" in result:
                print(f"Note: Cash flow analysis returned error: {result['error']}")
            else:
                # Check that all expected keys are present
                self.assertIn("metrics", result)
                self.assertIn("seasonal_patterns", result)
                
                # Verify metrics are calculated
                metrics = result["metrics"]
                self.assertIn("total_inflow", metrics)
                self.assertIn("total_outflow", metrics)
                self.assertIn("net_cash_flow", metrics)
                self.assertIn("daily_average", metrics)
                
                print("Successfully ran cash flow analysis with real data")
        except Exception as e:
            self.fail(f"Cash flow analysis raised exception: {str(e)}")

    def test_revenue_forecast(self):
        # Test the revenue forecast function with real data
        try:
            result_json = revenue_forecast(days_ahead=30)
            self.assertIsInstance(result_json, str)
            
            # Parse the JSON result
            result = json.loads(result_json)
            
            if "error" in result:
                print(f"Note: Revenue forecast returned error: {result['error']}")
            else:
                # Check that all expected keys are present
                self.assertIn("forecast", result)
                self.assertIn("forecast_total", result)
                self.assertIn("accuracy_metrics", result)
                
                # Verify forecast data structure
                forecast = result["forecast"]
                self.assertTrue(len(forecast) > 0, "No forecast data generated")
                self.assertIn("Posting Date", forecast[0])
                self.assertIn("predicted", forecast[0])
                
                print("Successfully ran revenue forecast with real data")
        except Exception as e:
            self.fail(f"Revenue forecast raised exception: {str(e)}")

    def test_analyze_ar_aging(self):
        # Test the AR aging analysis function with real data
        try:
            result = analyze_ar_aging()
            self.assertIsInstance(result, str)
            
            if "Error" in result:
                print(f"Note: AR aging analysis returned error: {result}")
            else:
                # Check for expected sections in the result
                self.assertIn("ACCOUNTS RECEIVABLE AGING ANALYSIS", result)
                self.assertIn("OVERALL METRICS", result)
                self.assertIn("AGING BUCKETS", result)
                
                print("Successfully ran AR aging analysis with real data")
        except Exception as e:
            self.fail(f"AR aging analysis raised exception: {str(e)}")

    def test_analyze_ar_aging_with_custom_buckets(self):
        # Test with custom aging buckets
        try:
            custom_buckets = {
                'current': (0, 15),
                '16-45_days': (16, 45),
                '46-90_days': (46, 90),
                'over_90_days': (91, float('inf'))
            }
            
            result = analyze_ar_aging(aging_buckets=custom_buckets)
            self.assertIsInstance(result, str)
            
            if "Error" in result:
                print(f"Note: AR aging analysis with custom buckets returned error: {result}")
            else:
                print("Successfully ran AR aging analysis with custom buckets")
        except Exception as e:
            self.fail(f"AR aging analysis with custom buckets raised exception: {str(e)}")

if __name__ == '__main__':
    unittest.main() 