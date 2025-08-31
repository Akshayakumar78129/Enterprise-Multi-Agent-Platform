/**
 * Agent Registry Configuration
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
  queryEndpoint?: string; // For specialized queries
  category: 'sales' | 'customer' | 'inventory' | 'finance' | 'support' | 'marketing';
  isActive: boolean;
}

export interface AgentRegistry {
  [key: string]: AgentConfig;
}

// API Gateway base URL - adjust based on your environment
const API_GATEWAY_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3002';

export const AGENT_REGISTRY: AgentRegistry = {
  // Main Department Agents - Core business intelligence agents
  
  sales: {
    name: 'sales',
    displayName: 'Sales Intelligence Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Analyzes sales performance, trends, and revenue optimization using Sales department tools',
    capabilities: [
      'Sales performance analysis',
      'Revenue trend analysis',
      'Product performance tracking',
      'Regional sales insights',
      'Sales forecasting',
      'Demand forecasting'
    ],
    avatar: '💼',
    color: '#10b981', // Green
    agentType: 'multiagent',
    queryEndpoint: '/api/sales/query',
    category: 'sales',
    isActive: true
  },
  
  customer: {
    name: 'customer',
    displayName: 'Customer Intelligence Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Provides comprehensive customer insights using Customer department analytics tools',
    capabilities: [
      'Customer behavior analysis',
      'Churn prediction insights',
      'Customer segmentation',
      'Lifetime value analysis',
      'Engagement classification',
      'Purchase pattern analysis',
      'Retention planning',
      'Anomaly detection'
    ],
    avatar: '👥',
    color: '#3b82f6', // Blue
    agentType: 'multiagent',
    queryEndpoint: '/api/customer/query',
    category: 'customer',
    isActive: true
  },
  
  finance: {
    name: 'finance',
    displayName: 'Finance Intelligence Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Provides financial analysis and business intelligence using Finance department tools',
    capabilities: [
      'Financial performance analysis',
      'Revenue and cost tracking',
      'Profitability analysis',
      'Budget optimization',
      'Financial forecasting',
      'Cash flow analysis',
      'Investment insights'
    ],
    avatar: '💰',
    color: '#f59e0b', // Amber
    agentType: 'multiagent',
    queryEndpoint: '/api/finance/query',
    category: 'finance',
    isActive: true
  },
  
  inventory: {
    name: 'inventory',
    displayName: 'Inventory Intelligence Agent',
    endpoint: '/run_sse',
    authToken: process.env.NEXT_PUBLIC_API_GATEWAY_TOKEN || 'your_api_gateway_token',
    description: 'Manages inventory optimization and supply chain insights using Inventory department tools',
    capabilities: [
      'Inventory level optimization',
      'Holding cost analysis',
      'Stock optimization recommendations',
      'Slow-moving inventory identification',
      'Supply chain insights',
      'Reorder point calculation',
      'Demand-based planning'
    ],
    avatar: '📦',
    color: '#8b5cf6', // Purple
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
  const categories = ['sales', 'customer', 'inventory', 'finance', 'support', 'marketing'] as const;
  
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
  capabilities: agent.capabilities.slice(0, 3), // Show first 3 capabilities
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