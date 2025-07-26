import unittest
import os
from datetime import datetime, timedelta
import pandas as pd
from Sales.tools.performance_utils import performance_utils

class TestPerformanceUtils(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Use the centralized connector to get a real connection
        cls.conn = performance_utils.get_connection()
        # Use a recent date range for real data
        today = datetime.today()
        cls.end_date = today.strftime('%Y-%m-%d')
        cls.start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')

    def test_database_connection(self):
        self.assertIsNotNone(self.conn)
        # Check that at least one table exists
        cursor = self.conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        self.assertTrue(len(tables) > 0)

    def test_fetch_sales_data(self):
        df = performance_utils.fetch_sales_data(self.conn, self.start_date, self.end_date)
        self.assertIsInstance(df, pd.DataFrame)
        # Should have expected columns if data exists
        if not df.empty:
            for col in ['date', 'revenue', 'units']:
                self.assertIn(col, df.columns)

    def test_analyze_trends(self):
        df = performance_utils.fetch_sales_data(self.conn, self.start_date, self.end_date)
        if not df.empty:
            metrics_df = performance_utils.calculate_metrics(df, ['revenue', 'units', 'aov'])
            trends = performance_utils.analyze_trends(metrics_df)
            self.assertIsInstance(trends, dict)
            # At least one trend metric should be present if data exists
            self.assertTrue(any('growth' in k for k in trends.keys()))

if __name__ == '__main__':
    unittest.main() 