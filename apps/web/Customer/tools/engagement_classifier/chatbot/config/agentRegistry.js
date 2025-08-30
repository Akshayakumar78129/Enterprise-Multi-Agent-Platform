// Agent Registry (script-encoded)
// Keeps agent knowledge in code without removing existing .txt logic elsewhere.

/**
 * Agent shape:
 * - name: canonical id used in mentions (e.g., "sales_agent")
 * - displayName: friendly name
 * - avatar: emoji or image reference
 * - description: short role description
 * - capabilities: array of strings describing tasks
 * - category: optional grouping
 * - color: optional brand color for UI
 */
export const AGENT_REGISTRY = [
  {
    name: 'sales_agent',
    displayName: 'Sales Agent',
    avatar: '💸',
    description: 'Revenue, sales performance, top customers, churn risk insights.',
    capabilities: [
      'revenue_breakdown',
      'top_customers',
      'churn_risk',
      'segment_performance',
    ],
    category: 'sales',
    color: '#10b981',
  },
  {
    name: 'inventory_agent',
    displayName: 'Inventory Agent',
    avatar: '📦',
    description: 'Stock levels, stockouts, replenishment and inventory trends.',
    capabilities: [
      'stockouts',
      'replenishment',
      'top_sku_demand',
      'inventory_health',
    ],
    category: 'inventory',
    color: '#3b82f6',
  },
];

export const listAgents = () => AGENT_REGISTRY.map(a => ({
  name: a.name,
  displayName: a.displayName,
  avatar: a.avatar,
  description: a.description,
  capabilities: a.capabilities,
  category: a.category,
  color: a.color,
}));

export const getAgent = (name) => AGENT_REGISTRY.find(a => a.name.toLowerCase() === String(name || '').toLowerCase());

export const isValidAgent = (name) => Boolean(getAgent(name));

export const parseMentions = (text) => {
  const mentions = [];
  const pattern = /@([a-zA-Z0-9_\-]+)/g;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    mentions.push(m[1].toLowerCase());
  }
  const cleaned = text.replace(pattern, '').replace(/\s+/g, ' ').trim();
  return { mentions, cleaned };
};

// Very simple keyword-to-agent suggestion
export const suggestAgentFromQuery = (q) => {
  const s = (q || '').toLowerCase();
  const suggestions = [];
  if (/(revenue|sales|top\s+customers|ltv|monetary|spend|churn)/.test(s)) suggestions.push('sales_agent');
  if (/(inventory|stock|stockout|replenish|sku|backorder)/.test(s)) suggestions.push('inventory_agent');
  return [...new Set(suggestions)];
};