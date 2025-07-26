import unittest
from unittest.mock import patch, MagicMock
from Inventory.tools.InventoryOptimizationAnalyzer.InventoryOptimizationAnalyzer import (
    setup_database_path,
    DatabaseConnector,
    analyze_inventory_optimization,
    combine_analysis_results,
    generate_final_recommendations,
    format_comprehensive_report
)

class TestInventoryOptimizationAnalyzer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        assert setup_database_path(), "Failed to set up database path"
        cls.connector = DatabaseConnector.get_instance()
        assert cls.connector.connect(), "Failed to connect to database"

    def test_database_connection(self):
        self.assertIsNotNone(self.connector.connection)
        cursor = self.connector.connection.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        self.assertTrue(len(tables) > 0, "No tables found in database")

    # Mock individual analyzers to isolate testing of InventoryOptimizationAnalyzer logic
    @patch('Inventory.tools.InventoryOptimizationAnalyzer.InventoryOptimizationAnalyzer.analyze_inventory_levels')
    @patch('Inventory.tools.InventoryOptimizationAnalyzer.InventoryOptimizationAnalyzer.analyze_holding_costs')
    @patch('Inventory.tools.InventoryOptimizationAnalyzer.InventoryOptimizationAnalyzer.analyze_slow_moving_inventory')
    @patch('Inventory.tools.InventoryOptimizationAnalyzer.InventoryOptimizationAnalyzer.optimize_stock_levels')
    def test_analyze_inventory_optimization(self, mock_optimize_stock, mock_slow_moving, mock_holding_costs, mock_inventory_levels):
        # Setup mock return values for each sub-analyzer
        mock_inventory_levels.return_value = {'raw_data': [{'item': 'A', 'level': 100}], 'visualizations': {}}
        mock_holding_costs.return_value = {'raw_data': [{'item': 'A', 'cost': 50}], 'visualizations': {}}
        mock_slow_moving.return_value = {'raw_data': [{'item': 'B', 'days': 120}], 'visualizations': {}}
        mock_optimize_stock.return_value = {'raw_data': [{'item': 'A', 'reorder': 20}], 'recommendations': {'top_recommendations': []}, 'visualizations': {}}

        result = analyze_inventory_optimization()
        self.assertIn('text_report', result)
        self.assertIn('recommendations', result)
        self.assertIn('raw_data', result)
        self.assertIsNotNone(result['raw_data'])
        # Verify that sub-analyzers were called
        mock_inventory_levels.assert_called_once()
        mock_holding_costs.assert_called_once()
        mock_slow_moving.assert_called_once()
        mock_optimize_stock.assert_called_once()

    def test_combine_analysis_results(self):
        inv_levels = {'raw_data': [{'item': 'A', 'level': 100}]}
        hold_costs = {'raw_data': [{'item': 'A', 'cost': 50, 'inventory_value': 5000}]}
        slow_move = {'raw_data': [{'item': 'B', 'days': 120}]}
        opt_stock = {'raw_data': [{'item': 'A', 'reorder': 20}], 'recommendations': {'top_recommendations': ['Rec1']}}
        combined = combine_analysis_results(inv_levels, hold_costs, slow_move, opt_stock)
        self.assertEqual(len(combined['inventory_levels']), 1)
        self.assertEqual(combined['summary']['total_value'], 5000)
        self.assertEqual(combined['summary']['optimization_opportunities'], 1)

    def test_generate_final_recommendations(self):
        # Basic test to ensure it runs and returns a dict
        combined_data = {
            'inventory_levels': [], 'holding_costs': [], 'slow_moving': [], 'optimization': [],
            'summary': {'total_items': 0, 'total_value': 0, 'slow_moving_items': 0, 'optimization_opportunities': 0}
        }
        recommendations = generate_final_recommendations(combined_data)
        self.assertIsInstance(recommendations, dict)

    def test_format_comprehensive_report(self):
        # Basic test to ensure it runs and returns a string
        combined_data = {
            'inventory_levels': [], 'holding_costs': [], 'slow_moving': [], 'optimization': [],
            'summary': {'total_items': 0, 'total_value': 0, 'slow_moving_items': 0, 'optimization_opportunities': 0}
        }
        recommendations = {
            'critical_actions': [],
            'optimization_opportunities': [],
            'cost_reduction_strategies': [],
            'inventory_health_improvements': []
        }
        report = format_comprehensive_report(combined_data, recommendations)
        self.assertIsInstance(report, str)
        self.assertTrue(len(report) > 0)

if __name__ == '__main__':
    unittest.main() 