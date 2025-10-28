export interface Dashboard {
  id: string;
  name: string;
  path: string;
  domain: 'customer' | 'sales' | 'inventory' | 'finance' | 'operations';
  description: string;
  icon: string;
  features?: string[];
  status?: 'active' | 'beta' | 'development';
}

export const DASHBOARDS: Dashboard[] = [
  {
    id: 'churn-prediction',
    name: 'Churn Prediction',
    path: '/churn-prediction',
    domain: 'customer',
    description: 'Predict and analyze customer churn patterns',
    icon: '📊',
    features: ['kpi', 'filters', 'charts', 'table', 'export'],
    status: 'active',
  },
  // Customer Domain Dashboards
  {
    id: 'customer-segmentation',
    name: 'Customer Segmentation',
    path: '/customer-segmentation',
    domain: 'customer',
    description: 'Segment customers based on behavior and value',
    icon: '👥',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'customer-lifetime-value',
    name: 'Customer Lifetime Value',
    path: '/customer-lifetime-value',
    domain: 'customer',
    description: 'Calculate and track customer lifetime value metrics',
    icon: '💰',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'engagement-classifier',
    name: 'Engagement Classifier',
    path: '/engagement-classifier',
    domain: 'customer',
    description: 'Classify and analyze customer engagement levels',
    icon: '📈',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'next-purchase-predictor',
    name: 'Next Purchase Predictor',
    path: '/next-purchase',
    domain: 'customer',
    description: 'Predict when customers will make their next purchase',
    icon: '🛒',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'transaction-patterns',
    name: 'Transaction Patterns',
    path: '/transaction-patterns',
    domain: 'customer',
    description: 'Analyze customer transaction patterns and trends',
    icon: '📊',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'customer-behavior',
    name: 'Customer Behavior Analytics',
    path: '/customer-behavior',
    domain: 'customer',
    description: 'Deep dive into customer behavior analytics',
    icon: '🔍',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'anomaly-detection',
    name: 'Anomaly Detection',
    path: '/anomaly-detection',
    domain: 'customer',
    description: 'Detect anomalies in customer behavior',
    icon: '⚠️',
    features: ['kpi', 'filters', 'charts', 'table', 'realtime'],
    status: 'development',
  },
  {
    id: 'performance-deviation',
    name: 'Performance Deviation',
    path: '/performance-deviation',
    domain: 'customer',
    description: 'Analyze and detect performance deviations in customer metrics',
    icon: '📊',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'customer-insights',
    name: 'Customer Insights',
    path: '/customer-insights',
    domain: 'customer',
    description: 'Comprehensive customer insights and analytics',
    icon: '💡',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'retention-planning',
    name: 'Retention Planning',
    path: '/retention-planning',
    domain: 'customer',
    description: 'Plan and execute customer retention strategies',
    icon: '🎯',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },

  // Sales Domain Dashboards
  {
    id: 'sales-performance',
    name: 'Sales Performance',
    path: '/sales-performance',
    domain: 'sales',
    description: 'Track and analyze sales performance metrics',
    icon: '💼',
    features: ['kpi', 'filters', 'charts', 'table', 'export'],
    status: 'development',
  },
  {
    id: 'product-performance',
    name: 'Product Performance',
    path: '/product-performance',
    domain: 'sales',
    description: 'Analyze product performance and trends',
    icon: '📦',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'sales-trends',
    name: 'Sales Trends',
    path: '/sales-trends',
    domain: 'sales',
    description: 'Identify and track sales trends over time',
    icon: '📈',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'regional-sales',
    name: 'Regional Sales',
    path: '/regional-sales',
    domain: 'sales',
    description: 'Regional sales analysis and comparison',
    icon: '🗺️',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'demand-forecast',
    name: 'Demand Forecast',
    path: '/demand-forecast',
    domain: 'sales',
    description: 'Forecast product demand using predictive analytics',
    icon: '🔮',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'sales-pipeline',
    name: 'Sales Pipeline',
    path: '/sales-pipeline',
    domain: 'sales',
    description: 'Manage and track sales pipeline stages',
    icon: '🚀',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },

  // Inventory Domain Dashboards
  {
    id: 'inventory-levels',
    name: 'Inventory Levels',
    path: '/inventory-levels',
    domain: 'inventory',
    description: 'Monitor current inventory levels across locations',
    icon: '📦',
    features: ['kpi', 'filters', 'charts', 'table', 'realtime'],
    status: 'development',
  },
  {
    id: 'slow-moving-inventory',
    name: 'Slow Moving Inventory',
    path: '/slow-moving-inventory',
    domain: 'inventory',
    description: 'Identify and manage slow-moving inventory items',
    icon: '🐌',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'stock-optimization',
    name: 'Stock Optimization',
    path: '/stock-optimization',
    domain: 'inventory',
    description: 'Optimize stock levels and reorder points',
    icon: '⚡',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'inventory-holding-costs',
    name: 'Inventory Holding Costs',
    path: '/inventory-holding-costs',
    domain: 'inventory',
    description: 'Analyze inventory holding costs and optimization',
    icon: '💵',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'inventory-optimization',
    name: 'Inventory Optimization',
    path: '/inventory-optimization',
    domain: 'inventory',
    description: 'Comprehensive inventory optimization analytics',
    icon: '🎯',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },

  // Finance Domain Dashboards
  {
    id: 'cash-flow',
    name: 'Cash Flow Analysis',
    path: '/cash-flow',
    domain: 'finance',
    description: 'Analyze cash flow patterns and projections',
    icon: '💸',
    features: ['kpi', 'filters', 'charts', 'table', 'export'],
    status: 'development',
  },
  {
    id: 'ar-aging-analysis',
    name: 'AR Aging Analysis',
    path: '/ar-aging-analysis',
    domain: 'finance',
    description: 'Accounts receivable aging and collection analysis',
    icon: '📊',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
  {
    id: 'revenue-forecast',
    name: 'Revenue Forecast',
    path: '/revenue-forecast',
    domain: 'finance',
    description: 'Strategic revenue forecasting with growth decomposition and cohort analysis',
    icon: '📈',
    features: ['kpi', 'filters', 'charts', 'table', 'forecast'],
    status: 'active',
  },
  {
    id: 'financial-health',
    name: 'Financial Health Metrics',
    path: '/financial-health',
    domain: 'finance',
    description: 'Monitor key financial health indicators',
    icon: '❤️',
    features: ['kpi', 'filters', 'charts', 'table'],
    status: 'development',
  },
];

export const DASHBOARD_DOMAINS = [
  { id: 'customer', name: 'Customer', icon: '👥', color: 'text-blue-500' },
  { id: 'sales', name: 'Sales', icon: '💼', color: 'text-green-500' },
  { id: 'inventory', name: 'Inventory', icon: '📦', color: 'text-yellow-500' },
  { id: 'finance', name: 'Finance', icon: '💰', color: 'text-purple-500' },
  { id: 'operations', name: 'Operations', icon: '⚙️', color: 'text-gray-500' },
];

export function getDashboardsByDomain(domain: string): Dashboard[] {
  return DASHBOARDS.filter(d => d.domain === domain);
}

export function getDashboardById(id: string): Dashboard | undefined {
  return DASHBOARDS.find(d => d.id === id);
}

export function getActiveDashboards(): Dashboard[] {
  return DASHBOARDS.filter(d => d.status === 'active');
}

export function getBetaDashboards(): Dashboard[] {
  return DASHBOARDS.filter(d => d.status === 'beta');
}