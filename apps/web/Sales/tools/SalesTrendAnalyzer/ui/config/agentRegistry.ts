// Agent Registry for Main Department Agents
export interface AgentInfo {
  agentName: string;
  displayName: string;
  avatar: string;
  description: string;
  color: string;
  department: string;
  capabilities: string[];
}

export const MAIN_AGENTS: AgentInfo[] = [
  {
    agentName: 'sales',
    displayName: 'Sales Agent',
    avatar: '📊',
    description: 'Sales performance analysis and revenue insights',
    color: '#00e0ff',
    department: 'Sales',
    capabilities: ['revenue analysis', 'sales trends', 'performance metrics', 'forecasting']
  },
  {
    agentName: 'customer',
    displayName: 'Customer Agent',
    avatar: '👥',
    description: 'Customer behavior and segmentation analysis',
    color: '#22c55e',
    department: 'Customer',
    capabilities: ['customer segmentation', 'behavior analysis', 'retention', 'lifetime value']
  },
  {
    agentName: 'finance',
    displayName: 'Finance Agent',
    avatar: '💰',
    description: 'Financial analysis and cost optimization',
    color: '#e930ff',
    department: 'Finance',
    capabilities: ['financial analysis', 'cost optimization', 'ROI analysis', 'budget planning']
  },
  {
    agentName: 'inventory',
    displayName: 'Inventory Agent',
    avatar: '📦',
    description: 'Inventory management and optimization',
    color: '#f59e0b',
    department: 'Inventory',
    capabilities: ['inventory optimization', 'stock analysis', 'demand planning', 'cost analysis']
  }
];

export const getAgentByName = (agentName: string): AgentInfo | undefined => {
  return MAIN_AGENTS.find(agent => agent.agentName === agentName);
};

export const getAgentSuggestions = (query: string): AgentInfo[] => {
  if (!query) return MAIN_AGENTS;
  
  const lowercaseQuery = query.toLowerCase();
  return MAIN_AGENTS.filter(agent => 
    agent.agentName.toLowerCase().includes(lowercaseQuery) ||
    agent.displayName.toLowerCase().includes(lowercaseQuery) ||
    agent.description.toLowerCase().includes(lowercaseQuery) ||
    agent.capabilities.some(cap => cap.toLowerCase().includes(lowercaseQuery))
  );
};