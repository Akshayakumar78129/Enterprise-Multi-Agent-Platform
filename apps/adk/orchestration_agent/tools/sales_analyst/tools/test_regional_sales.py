import unittest
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parent.parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from orchestration_agent.tools.sales_analyst.tools.RegionalSalesAnalyzer import (
    get_latest_date,
    get_sales_data,
    analyze_regional_sales,
    parse_date_range
)
from datetime import datetime, timedelta
import os
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestRegionalSalesAnalyzer(unittest.TestCase):
    def setUp(self):
        """Set up test cases."""
        # Test parameters with actual region codes from the database
        self.test_region_codes = ['United States']  # Using actual region name
        self.test_country_codes = ['United States']
        self.test_sub_region_codes = ['Northeast', 'Southeast']  # Using actual sub-region names
        self.test_start_date = '2020-06-01'
        self.test_end_date = '2020-08-31'

    def test_get_latest_date(self):
        """Test getting the latest date from the database"""
        try:
            latest_date = get_latest_date()
            self.assertIsNotNone(latest_date)
            self.assertIsInstance(latest_date, str)
            # Verify it's a valid date
            datetime.strptime(latest_date, '%Y-%m-%d')
            logger.info(f"Latest date in database: {latest_date}")
        except Exception as e:
            self.fail(f"Failed to get latest date: {str(e)}")

    def test_parse_date_range(self):
        """Test date range parsing for different scenarios"""
        # Test custom dates
        start, end = parse_date_range(None, self.test_start_date, self.test_end_date)
        self.assertEqual(start, self.test_start_date)
        self.assertEqual(end, self.test_end_date)

        # Test quarterly period
        start, end = parse_date_range('quarterly')
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)

        # Test monthly period
        start, end = parse_date_range('monthly')
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)

        # Test annual period
        start, end = parse_date_range('annual')
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)

    def test_get_sales_data(self):
        """Test getting sales data with different filters"""
        # Test with region codes
        df = get_sales_data(
            time_period='quarterly',
            region_codes=self.test_region_codes
        )
        self.assertIsNotNone(df)
        self.assertIsInstance(df, pd.DataFrame)

        # Test with country codes
        df = get_sales_data(
            time_period='quarterly',
            country_codes=self.test_country_codes
        )
        self.assertIsNotNone(df)
        self.assertIsInstance(df, pd.DataFrame)

        # Test with custom dates
        df = get_sales_data(
            start_date=self.test_start_date,
            end_date=self.test_end_date
        )
        self.assertIsNotNone(df)
        self.assertIsInstance(df, pd.DataFrame)

    def test_analyze_regional_sales(self):
        """Test different types of regional sales analysis"""
        # Test performance analysis
        results = analyze_regional_sales(
            time_period='quarterly',
            analysis_type='performance',
            metric='revenue',
            region_codes=self.test_region_codes
        )
        self.assertIsNotNone(results)
        self.assertIsInstance(results, dict)
        if 'error' not in results:
            self.assertIn('visualization', results)

        # Test trend analysis
        results = analyze_regional_sales(
            time_period='quarterly',
            analysis_type='trend',
            metric='revenue',
            region_codes=self.test_region_codes
        )
        self.assertIsNotNone(results)
        self.assertIsInstance(results, dict)
        if 'error' not in results:
            self.assertIn('visualization', results)

        # Test comparison analysis
        results = analyze_regional_sales(
            time_period='quarterly',
            analysis_type='comparison',
            metric='revenue',
            region_codes=['United States', 'Canada']  # Compare US and Canada
        )
        self.assertIsNotNone(results)
        self.assertIsInstance(results, dict)
        if 'error' not in results:
            self.assertIn('visualization', results)

        # Test with custom dates
        results = analyze_regional_sales(
            start_date=self.test_start_date,
            end_date=self.test_end_date,
            analysis_type='performance',
            metric='revenue',
            region_codes=self.test_region_codes
        )
        self.assertIsNotNone(results)
        self.assertIsInstance(results, dict)
        if 'error' not in results:
            self.assertIn('visualization', results)

    def test_error_handling(self):
        """Test error handling for invalid inputs"""
        # Test with invalid region code
        results = analyze_regional_sales(
            time_period='quarterly',
            analysis_type='performance',
            metric='revenue',
            region_codes=['INVALID_REGION']
        )
        self.assertIsNotNone(results)
        self.assertIsInstance(results, dict)
        self.assertIn('error', results)

        # Test with invalid date format
        results = analyze_regional_sales(
            start_date='invalid-date',
            end_date='2020-08-31',
            analysis_type='performance',
            metric='revenue'
        )
        self.assertIsNotNone(results)
        self.assertIsInstance(results, dict)
        self.assertIn('error', results)

if __name__ == '__main__':
    unittest.main() 