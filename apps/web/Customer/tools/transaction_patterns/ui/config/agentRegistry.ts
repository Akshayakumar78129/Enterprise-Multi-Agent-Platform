/**
 * Agent Registry Configuration for Transaction Patterns
 * Maps agent mentions to their actual API Gateway endpoints
 */

export interface AgentConfig {
  name: string;
  displayName: string;
  endpoint: string;
  authToken?: string;
  description: string;
  capabilities: string[];
  avatar: string;
  color: string;
  agentType: 'multiagent' | 'specialized';
  queryEndpoint?: string;
  category: 'sales' | 'customer' | 'inventory' | 'finance' | 'fraud' | 'support' | 'marketing';
  isActive: boolean;
}

export interface AgentRegistry {
  [key: string]: AgentConfig;
}

// API Gateway base URL - adjust based on your environment
const API_GATEWAY_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3002';

export const AGENT_REGISTRY: AgentRegistry = {
  // Transaction Pattern Specific Agents
  
  customer: {
    name: 'customer',
    displayName: 'Customer Intelligence Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Analyzes transaction behavior and customer spending patterns',
    capabilities: [
      'Transaction behavior analysis',
      'Spending pattern identification',
      'Customer segmentation by transaction',
      'Purchase frequency analysis',
      'Average transaction value insights',
      'Customer lifetime value from transactions',
      'Payment preference analysis',
      'Cross-selling opportunities'
    ],
    avatar: '👥',
    color: '#00e0ff', // Cyan
    agentType: 'multiagent',
    queryEndpoint: '/api/customer/query',
    category: 'customer',
    isActive: true
  },
  
  sales: {
    name: 'sales',
    displayName: 'Sales Intelligence Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Provides sales trends and transaction performance analytics',
    capabilities: [
      'Transaction volume trends',
      'Revenue analysis by period',
      'Product performance metrics',
      'Sales velocity tracking',
      'Peak transaction periods',
      'Conversion rate analysis',
      'Average order value trends',
      'Sales forecasting from transactions'
    ],
    avatar: '📊',
    color: '#e930ff', // Magenta
    agentType: 'multiagent',
    queryEndpoint: '/api/sales/query',
    category: 'sales',
    isActive: true
  },
  
  finance: {
    name: 'finance',
    displayName: 'Finance Intelligence Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Analyzes financial metrics and payment method performance',
    capabilities: [
      'Payment method analysis',
      'Transaction success rates',
      'Failed transaction analysis',
      'Processing fee optimization',
      'Revenue per transaction',
      'Cash flow patterns',
      'Payment timing insights',
      'Financial risk assessment'
    ],
    avatar: '💰',
    color: '#fbbf24', // Gold
    agentType: 'multiagent',
    queryEndpoint: '/api/finance/query',
    category: 'finance',
    isActive: true
  },
  
  fraud: {
    name: 'fraud',
    displayName: 'Fraud Detection Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Detects anomalies and potential fraudulent transaction patterns',
    capabilities: [
      'Anomaly detection in transactions',
      'Fraud pattern identification',
      'Risk scoring for transactions',
      'Unusual behavior alerts',
      'High-risk transaction flagging',
      'Velocity check violations',
      'Geographic anomaly detection',
      'Machine learning fraud prevention'
    ],
    avatar: '🔍',
    color: '#ef4444', // Red
    agentType: 'specialized',
    queryEndpoint: '/api/fraud/query',
    category: 'fraud',
    isActive: true
  },
  
  inventory: {
    name: 'inventory',
    displayName: 'Inventory Intelligence Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Analyzes product performance and inventory impact from transactions',
    capabilities: [
      'Product transaction frequency',
      'Stock velocity analysis',
      'Top selling items by transaction',
      'Inventory turnover from sales',
      'Product category performance',
      'Seasonal transaction patterns',
      'Reorder point optimization',
      'Dead stock identification'
    ],
    avatar: '📦',
    color: '#34d399', // Emerald
    agentType: 'multiagent',
    queryEndpoint: '/api/inventory/query',
    category: 'inventory',
    isActive: true
  }
};

/**
 * Get agent configuration by name
 */
export const getAgentConfig = (agentName: string): AgentConfig | null => {
  return AGENT_REGISTRY[agentName] || null;
};

/**
 * Get all available agents
 */
export const getAllAgents = (): AgentConfig[] => {
  return Object.values(AGENT_REGISTRY);
};

/**
 * Check if agent exists
 */
export const isValidAgent = (agentName: string): boolean => {
  return agentName in AGENT_REGISTRY;
};

/**
 * Get agent suggestions for autocomplete
 */
export const getAgentSuggestions = (query: string = ''): AgentConfig[] => {
  if (!query) return getActiveAgents();
  
  const lowerQuery = query.toLowerCase();
  return getActiveAgents().filter(agent => 
    agent.name.toLowerCase().includes(lowerQuery) ||
    agent.displayName.toLowerCase().includes(lowerQuery) ||
    agent.description.toLowerCase().includes(lowerQuery) ||
    agent.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Get only active agents
 */
export const getActiveAgents = (): AgentConfig[] => {
  return Object.values(AGENT_REGISTRY).filter(agent => agent.isActive);
};

/**
 * Get agents by category
 */
export const getAgentsByCategory = (category: AgentConfig['category']): AgentConfig[] => {
  return Object.values(AGENT_REGISTRY).filter(agent => 
    agent.category === category && agent.isActive
  );
};

/**
 * Get agent categories with counts
 */
export const getAgentCategories = (): { category: string; count: number; agents: AgentConfig[] }[] => {
  const categories = ['sales', 'customer', 'inventory', 'finance', 'fraud', 'support', 'marketing'] as const;
  
  return categories.map(category => ({
    category,
    count: getAgentsByCategory(category).length,
    agents: getAgentsByCategory(category)
  })).filter(cat => cat.count > 0);
};

/**
 * Format agent for display in dropdown
 */
export const formatAgentForDropdown = (agent: AgentConfig) => ({
  value: agent.name,
  label: agent.displayName,
  description: agent.description,
  avatar: agent.avatar,
  color: agent.color,
  category: agent.category,
  capabilities: agent.capabilities.slice(0, 3),
  isActive: agent.isActive
});

/**
 * Get agent endpoint URL
 */
export const getAgentEndpointUrl = (agentName: string): string | null => {
  const agent = getAgentConfig(agentName);
  if (!agent) return null;
  
  const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3002';
  return `${baseUrl}${agent.queryEndpoint || '/api/v1/query'}`;
};