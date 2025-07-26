import unittest
import os
import sys
import pandas as pd
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the module to test
from retention_planner import plan_retention_actions

class TestRetentionPlanner(unittest.TestCase):
    """Test cases for the retention planner tool."""
    
    def setUp(self):
        """Set up test environment."""
        self.db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
    
    def test_database_connection(self):
        """Test that the tool can connect to the database."""
        result = plan_retention_actions()
        
        # Check if the connection was successful
        self.assertIn('success', result)
        self.assertTrue(result['success'])
        
    def test_retention_planning_functionality(self):
        """Test the full retention planning functionality with actual data."""
        result = plan_retention_actions(churn_risk_threshold=0.4)
        
        # Verify success
        self.assertTrue(result['success'])
        
        # Verify report content
        self.assertIn('Customer Retention Action Plan', result['report'])
        self.assertIn('Total Customers Analyzed:', result['report'])
        self.assertIn('High Churn Risk Customers:', result['report'])
        
        # Verify data structure
        self.assertIn('data', result)
        self.assertIn('customer_count', result['data'])
        self.assertIn('high_risk_count', result['data'])
        self.assertIn('action_distribution', result['data'])
        self.assertIn('playbooks', result['data'])
        
    def test_customer_segmentation(self):
        """Test if tool works with specific customer segments."""
        # Test with a specific loyalty status segment
        result = plan_retention_actions(customer_segments=['Gold'])
        
        # Verify success
        self.assertIn('success', result)
        
        # Make sure we got data - if this segment exists in the database
        if result['success']:
            self.assertIn('Gold Segment:', result['report'])
    
    def test_cost_benefit_analysis(self):
        """Test the cost-benefit analysis calculation."""
        result = plan_retention_actions()
        
        # Verify cost-benefit section exists
        self.assertIn('Cost-Benefit Analysis:', result['report'])
        
        # Check if cost benefit data is included
        self.assertIn('cost_benefit', result['data'])
        
        # Check specific actions
        action_found = False
        for action in ["Premium retention package + Personal outreach", 
                      "Standard retention package + Follow-up call",
                      "Basic retention offer"]:
            if action in result['data']['action_distribution']:
                action_found = True
                break
        
        self.assertTrue(action_found, "No action recommendations found in results")
    
    def test_error_handling(self):
        """Test that errors are handled properly."""
        # Simulate an error by passing invalid input
        result = plan_retention_actions(customer_segments=["NonExistentSegment"])
        
        # The function should still return a result dictionary with the error handled
        self.assertIsInstance(result, dict)
        self.assertIn('report', result)

if __name__ == '__main__':
    unittest.main() 