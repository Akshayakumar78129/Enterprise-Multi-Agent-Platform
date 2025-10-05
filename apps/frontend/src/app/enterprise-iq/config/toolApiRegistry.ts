/**
 * Tool API Registry
 * Maps tool names to their corresponding summary API endpoints
 * This centralized registry ensures consistent routing of data requests
 */

export interface ToolApiConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  description?: string;
}

/**
 * Registry mapping tool names to their API configurations
 * Add new dashboard tools here as they are implemented
 */
export const toolApiRegistry: Record<string, ToolApiConfig> = {
  // Churn Prediction Dashboard
  'churn-prediction': {
    endpoint: '/api/churn/summary',
    method: 'POST',
    description: 'Churn risk analysis and prediction dashboard'
  },

  // Sales Performance Dashboard
  'sales-performance': {
    endpoint: '/api/sales/summary',
    method: 'POST',
    description: 'Sales metrics and performance analytics'
  },

  // Customer Segmentation Dashboard
  'customer-segmentation': {
    endpoint: '/api/segmentation/summary',
    method: 'POST',
    description: 'Customer segmentation and analysis'
  },

  // Customer Behaviour Dashboard
  'customer-behaviour': {
    endpoint: '/api/customer/behaviour/summary',
    method: 'POST',
    description: 'Customer behavior patterns and insights'
  },

  // Product Performance Dashboard
  'product-performance': {
    endpoint: '/api/product/summary',
    method: 'POST',
    description: 'Product sales and margin analysis'
  },

  // Inventory Level Analyzer
  'inventory-level-analyzer': {
    endpoint: '/api/inventory/levels/summary',
    method: 'POST',
    description: 'Inventory stock levels and health metrics'
  },

  // Inventory Holding Cost Analyzer
  'inventory-holding-cost-analyzer': {
    endpoint: '/api/inventory/costs/summary',
    method: 'POST',
    description: 'Inventory holding costs and optimization'
  },

  // Purchase Frequency Dashboard
  'purchase-frequency': {
    endpoint: '/api/purchase-frequency/summary',
    method: 'POST',
    description: 'Customer purchase frequency patterns and analysis'
  },

  // Transaction Patterns Dashboard
  'transaction-patterns': {
    endpoint: '/api/transaction-patterns/summary',
    method: 'POST',
    description: 'Transaction pattern analysis and anomaly detection'
  },

  // Customer Lifetime Value Dashboard
  'customer-lifetime-value': {
    endpoint: '/api/customer-ltv/summary',
    method: 'POST',
    description: 'Customer lifetime value analysis and predictions'
  },

  // Engagement Classifier Dashboard
  'engagement-classifier': {
    endpoint: '/api/engagement-classifier/summary',
    method: 'POST',
    description: 'Customer engagement classification and scoring'
  },

  // Next Purchase Predictor
  'next-purchase': {
    endpoint: '/api/next-purchase/summary',
    method: 'POST',
    description: 'Next purchase predictions and recommendations'
  },

  // Sales Trends Dashboard
  'sales-trends': {
    endpoint: '/api/sales/trends/summary',
    method: 'POST',
    description: 'Sales trend analysis and forecasting'
  },

  // Regional Sales Dashboard
  'regional-sales': {
    endpoint: '/api/sales/regional/summary',
    method: 'POST',
    description: 'Regional sales performance metrics'
  },

  // Performance Deviation Dashboard
  'performance-deviation': {
    endpoint: '/api/performance/summary',
    method: 'POST',
    description: 'Performance deviation analysis'
  },

  // Retention Planner Dashboard
  'retention-planner': {
    endpoint: '/api/retention-planner/summary',
    method: 'POST',
    description: 'Customer retention strategies and planning'
  },

  // Anomaly Detection Dashboard
  'anomaly-detection': {
    endpoint: '/api/anomaly/summary',
    method: 'POST',
    description: 'Anomaly detection and analysis'
  },

  // Customer Behavior Dashboard
  'customer-behavior': {
    endpoint: '/api/customer-behavior/summary',
    method: 'POST',
    description: 'Customer behavior analysis and insights'
  },

  // Add more dashboard endpoints as they are implemented
  // Template:
  // 'tool-name': {
  //   endpoint: '/api/{domain}/summary',
  //   method: 'POST',
  //   description: 'Tool description'
  // }
};

/**
 * Helper function to get API configuration for a tool
 * @param toolName - The name of the tool
 * @returns The API configuration or undefined if not found
 */
export function getToolApiConfig(toolName: string): ToolApiConfig | undefined {
  return toolApiRegistry[toolName];
}

/**
 * Helper function to check if a tool has an API endpoint configured
 * @param toolName - The name of the tool
 * @returns True if the tool has an API endpoint configured
 */
export function hasToolApi(toolName: string): boolean {
  return toolName in toolApiRegistry;
}

/**
 * Get all available tool names
 * @returns Array of all registered tool names
 */
export function getAvailableTools(): string[] {
  return Object.keys(toolApiRegistry);
}