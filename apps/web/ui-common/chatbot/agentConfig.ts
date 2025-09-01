export interface AgentConfig {
  name: string;
  displayName: string;
  appName: string;
  icon: string;
  color: string;
  description: string;
  capabilities: string[];
}

export const agents: Record<string, AgentConfig> = {
  sales: {
    name: 'sales',
    displayName: 'Sales Intelligence',
    appName: 'sales_agent',
    icon: '💼',
    color: '#00e0ff',
    description: 'Sales performance analysis and forecasting',
    capabilities: [
      'Revenue analysis',
      'Sales trends',
      'Performance metrics',
      'Territory insights',
      'Product performance'
    ]
  },
  customer: {
    name: 'customer',
    displayName: 'Customer Intelligence',
    appName: 'customer_agent',
    icon: '👥',
    color: '#00ff88',
    description: 'Customer behavior and retention insights',
    capabilities: [
      'Churn prediction',
      'Customer segmentation',
      'Behavior analysis',
      'Retention strategies',
      'Lifetime value'
    ]
  },
  finance: {
    name: 'finance',
    displayName: 'Financial Intelligence',
    appName: 'financial_agent',
    icon: '💰',
    color: '#ffd600',
    description: 'Financial analysis and reporting',
    capabilities: [
      'Revenue forecasting',
      'Cost analysis',
      'Profitability metrics',
      'Budget tracking',
      'Financial health'
    ]
  },
  inventory: {
    name: 'inventory',
    displayName: 'Inventory Intelligence',
    appName: 'inventory_agent',
    icon: '📦',
    color: '#ff9800',
    description: 'Inventory optimization and supply chain',
    capabilities: [
      'Stock levels',
      'Demand forecasting',
      'Reorder points',
      'Supplier analysis',
      'Warehouse optimization'
    ]
  },
  enterpriseiq: {
    name: 'enterpriseiq',
    displayName: 'Enterprise IQ',
    appName: 'orchestration_agent',
    icon: '🤖',
    color: '#e930ff',
    description: 'Multi-agent orchestration for complex queries',
    capabilities: [
      'Cross-functional analysis',
      'Strategic insights',
      'Executive dashboards',
      'Multi-domain queries',
      'Integrated reporting'
    ]
  }
};

export const getAgentByAppName = (appName: string): AgentConfig | undefined => {
  return Object.values(agents).find(agent => agent.appName === appName);
};

export const getAgentByMention = (mention: string): AgentConfig | undefined => {
  const cleanMention = mention.replace('@', '').toLowerCase();
  return agents[cleanMention];
};

export const detectAgentFromContext = (pathname: string): AgentConfig => {
  // Detect agent based on current page path
  if (pathname.includes('/sales')) return agents.sales;
  if (pathname.includes('/customer') || pathname.includes('/churn')) return agents.customer;
  if (pathname.includes('/finance')) return agents.finance;
  if (pathname.includes('/inventory')) return agents.inventory;
  
  // Default to orchestration agent for unknown paths
  return agents.enterpriseiq;
};

export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(m => m.substring(1).toLowerCase()) : [];
};

export const replaceMentionsWithAgent = (text: string): { cleanText: string; targetAgent: AgentConfig | null } => {
  const mentions = extractMentions(text);
  let targetAgent: AgentConfig | null = null;
  let cleanText = text;

  if (mentions.length > 0) {
    // Use the first valid mention as the target agent
    const firstValidMention = mentions.find(m => agents[m]);
    if (firstValidMention) {
      targetAgent = agents[firstValidMention];
      // Remove the mention from the text
      cleanText = text.replace(new RegExp(`@${firstValidMention}\\b`, 'gi'), '').trim();
    }
  }

  return { cleanText, targetAgent };
};