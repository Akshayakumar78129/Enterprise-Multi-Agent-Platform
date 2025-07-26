import unittest
import os
import sys
import pandas as pd
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the module to test
from purchase_frequency import analyze_purchase_frequency

class TestPurchaseFrequency(unittest.TestCase):
    """Test cases for the purchase frequency analysis tool."""
    
    def setUp(self):
        """Set up test environment."""
        self.db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
    
    def test_real_database_connection(self):
        """Test that we can connect to the actual database and get real data."""
        # Use a specific date range to ensure data
        start_date = "2019-01-01"
        end_date = "2019-12-31"
        
        result = analyze_purchase_frequency(start_date, end_date)
        
        # Verify result format
        self.assertIsInstance(result, dict)
        self.assertIn('status', result)
        self.assertIn('report', result)
        self.assertEqual(result['status'], 'success')
        
        # Verify that we got actual data
        self.assertNotEqual(result['report'], 'No transactions found for the specified date range.')
        self.assertIn('Total Customers Analyzed:', result['report'])
    
    def test_purchase_frequency_metrics(self):
        """Test that the purchase frequency metrics are calculated correctly."""
        # Use a specific date range with known data
        start_date = "2019-05-01"
        end_date = "2019-10-31"
        
        result = analyze_purchase_frequency(start_date, end_date)
        
        # Verify key metrics are present
        self.assertIn('Average Purchases per Customer:', result['report'])
        self.assertIn('Average Days Between Purchases:', result['report'])
        
        # Verify customer segments are analyzed
        self.assertIn('Customer Purchase Frequency Breakdown:', result['report'])
        self.assertIn('High Frequency Customers', result['report'])
        self.assertIn('Low Frequency Customers', result['report'])
    
    def test_recent_purchase_patterns(self):
        """Test that recent purchase patterns are analyzed correctly."""
        # Use a specific date range with known data
        start_date = "2019-01-01"
        end_date = "2019-12-31"
        
        result = analyze_purchase_frequency(start_date, end_date)
        
        # Verify recent patterns analysis
        self.assertIn('Recent Purchase Patterns (Last 90 Days):', result['report'])
        self.assertIn('Active Customers:', result['report'])
    
    def test_transaction_value_patterns(self):
        """Test that transaction value patterns are analyzed correctly."""
        # Use a specific date range with known data
        start_date = "2019-01-01"
        end_date = "2019-12-31"
        
        result = analyze_purchase_frequency(start_date, end_date)
        
        # Verify value analysis
        self.assertIn('Transaction Value Patterns:', result['report'])
        self.assertIn('High Value Customers', result['report'])
    
    def test_empty_result_handling(self):
        """Test how the function handles empty results."""
        # Use a date range in the far future to guarantee no data
        start_date = '2050-01-01'
        end_date = '2050-12-31'
        
        result = analyze_purchase_frequency(start_date, end_date)
        
        # Verify empty data handling
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['report'], 'No transactions found for the specified date range.')
    
    @patch('sqlite3.connect', side_effect=Exception("Test database error"))
    def test_database_error(self, mock_connect):
        """Test error handling when database connection fails."""
        # Call function with error condition
        result = analyze_purchase_frequency()
        
        # Verify error handling
        self.assertEqual(result['status'], 'error')
        self.assertIn('Failed to analyze purchase frequency', result['report'])
        self.assertIn('Test database error', result['report'])

if __name__ == '__main__':
    unittest.main() 