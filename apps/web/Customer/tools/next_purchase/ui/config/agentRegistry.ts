export const AGENT_COLORS: Record<string,string> = {
  sales: '#10b981',
  customer: '#3b82f6',
  finance: '#f59e0b',
  inventory: '#8b5cf6'
};

const agentResponseTemplate = `
[AGENT_EMOJI] **[Department] Intelligence Report**

📊 **Current [Department] Performance:**
• **Key Metric 1**: $[VALUE]
• **Key Metric 2**: [VALUE]%
• **Key Metric 3**: [VALUE]
• **Key Metric 4**: [VALUE]

  🎯 **Next Purchase Prediction Impact:**
  • **Top Product Opportunity**: [PRODUCT with highest aggregate probability]
  • **Lift vs Baseline**: [PERCENT LIFT]
  • **Coverage**: [# customers with prediction / total]

📈 **[Department-Specific Section]:**
• Category 1: [DATA]
• Category 2: [DATA]
• Category 3: [DATA]

💡 **[Department] Recommendations:**
• [Action Item 1]
• [Action Item 2]
• [Action Item 3]

⚠️ **Risk Mitigation:**
• [Risk 1 and mitigation strategy]
• [Risk 2 and mitigation strategy]
`;

export const AGENT_REGISTRY: Record<string, any> = {
  sales: {
    displayName: 'Sales Intelligence',
    avatar: '💼',
    description: 'Revenue performance and pipeline insights',
    department: 'sales',
    template: agentResponseTemplate
  },
  customer: {
    displayName: 'Customer Intelligence',
    avatar: '👥',
    description: 'Customer health and engagement insights',
    department: 'customer',
    template: agentResponseTemplate
  },
  finance: {
    displayName: 'Finance Intelligence',
    avatar: '💰',
    description: 'Financial performance and risk analysis',
    department: 'finance',
    template: agentResponseTemplate
  },
  inventory: {
    displayName: 'Inventory Intelligence',
    avatar: '📦',
    description: 'Supply, stock levels and turnover metrics',
    department: 'inventory',
    template: agentResponseTemplate
  }
};
