export interface Dashboard {
  id: string;
  name: string;
  path: string;
  domain: string;
  description: string;
  icon?: string;
}

export interface DashboardDomain {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const DASHBOARD_DOMAINS: DashboardDomain[] = [
  {
    id: 'ai',
    name: 'AI Assistant',
    icon: '🤖',
    color: 'text-purple-500'
  },
  {
    id: 'customer',
    name: 'Customer Analytics',
    icon: '👥',
    color: 'text-blue-500'
  },
  {
    id: 'sales',
    name: 'Sales Analytics',
    icon: '📈',
    color: 'text-green-500'
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    icon: '📊',
    color: 'text-orange-500'
  },
  {
    id: 'finance',
    name: 'Finance Analytics',
    icon: '💰',
    color: 'text-yellow-500'
  },
  {
    id: 'performance',
    name: 'Performance Analytics',
    icon: '⚡',
    color: 'text-red-500'
  }
];

export const DASHBOARDS: Dashboard[] = [
  // AI Assistant
  {
    id: 'landing',
    name: 'AI Assistant',
    path: '/',
    domain: 'ai',
    description: 'AI-powered business insights and analytics',
    icon: '🤖'
  },

  // Customer Analytics
  {
    id: 'customer-segmentation',
    name: 'Customer Segmentation',
    path: '/customer-segmentation',
    domain: 'customer',
    description: 'Segment customers based on behavior and value',
    icon: '🎯'
  },
  {
    id: 'customer-behavior',
    name: 'Customer Behavior',
    path: '/customer-behavior',
    domain: 'customer',
    description: 'Analyze customer behavior patterns',
    icon: '🔍'
  },
  {
    id: 'customer-ltv',
    name: 'Customer LTV',
    path: '/customer-ltv',
    domain: 'customer',
    description: 'Customer lifetime value analysis',
    icon: '💎'
  },
  {
    id: 'churn-prediction',
    name: 'Churn Prediction',
    path: '/churn-prediction',
    domain: 'customer',
    description: 'Predict and prevent customer churn',
    icon: '⚠️'
  },
  {
    id: 'anomaly-detection',
    name: 'Anomaly Detection',
    path: '/anomaly-detection',
    domain: 'customer',
    description: 'Detect unusual patterns and behaviors',
    icon: '🚨'
  },
  {
    id: 'transaction-patterns',
    name: 'Transaction Patterns',
    path: '/transaction-patterns',
    domain: 'customer',
    description: 'Analyze customer transaction patterns',
    icon: '💳'
  },
  {
    id: 'purchase-frequency',
    name: 'Purchase Frequency',
    path: '/purchase-frequency',
    domain: 'customer',
    description: 'Track customer purchase frequency',
    icon: '🔄'
  },
  {
    id: 'next-purchase',
    name: 'Next Purchase Prediction',
    path: '/next-purchase',
    domain: 'customer',
    description: 'Predict next purchase timing',
    icon: '📅'
  },
  {
    id: 'engagement-classifier',
    name: 'Engagement Classifier',
    path: '/engagement-classifier',
    domain: 'customer',
    description: 'Classify customer engagement levels',
    icon: '📊'
  },

  // Sales Analytics
  {
    id: 'sales-performance',
    name: 'Sales Performance',
    path: '/sales-performance',
    domain: 'sales',
    description: 'Track sales team performance',
    icon: '🏆'
  },
  {
    id: 'product-performance',
    name: 'Product Performance',
    path: '/product-performance',
    domain: 'sales',
    description: 'Analyze product sales performance',
    icon: '📊'
  },
  {
    id: 'sales-trends',
    name: 'Sales Trends',
    path: '/sales-trends',
    domain: 'sales',
    description: 'Identify and analyze sales trends',
    icon: '📈'
  },
  {
    id: 'regional-sales',
    name: 'Regional Sales',
    path: '/regional-sales',
    domain: 'sales',
    description: 'Regional sales analysis',
    icon: '🗺️'
  },
  {
    id: 'demand-forecast',
    name: 'Demand Forecast',
    path: '/demand-forecast',
    domain: 'sales',
    description: 'Forecast product demand',
    icon: '🔮'
  },

  // Inventory Management
  {
    id: 'inventory-levels',
    name: 'Inventory Levels',
    path: '/inventory-levels',
    domain: 'inventory',
    description: 'Monitor current inventory levels',
    icon: '📊'
  },
  {
    id: 'holding-costs',
    name: 'Holding Costs',
    path: '/holding-costs',
    domain: 'inventory',
    description: 'Analyze inventory holding costs',
    icon: '💵'
  },
  {
    id: 'inventory-optimization',
    name: 'Inventory Optimization',
    path: '/inventory-optimization',
    domain: 'inventory',
    description: 'Optimize inventory levels',
    icon: '⚙️'
  },
  {
    id: 'slow-moving',
    name: 'Slow Moving Stock',
    path: '/slow-moving',
    domain: 'inventory',
    description: 'Identify slow-moving inventory',
    icon: '🐌'
  },
  {
    id: 'stock-optimization',
    name: 'Stock Optimization',
    path: '/stock-optimization',
    domain: 'inventory',
    description: 'Optimize stock levels',
    icon: '📈'
  },

  // Finance Analytics
  {
    id: 'ar-aging',
    name: 'AR Aging',
    path: '/ar-aging',
    domain: 'finance',
    description: 'Accounts receivable aging analysis',
    icon: '📅'
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow',
    path: '/cash-flow',
    domain: 'finance',
    description: 'Cash flow analysis and forecasting',
    icon: '💸'
  },
  {
    id: 'revenue-forecast',
    name: 'Revenue Forecast',
    path: '/revenue-forecast',
    domain: 'finance',
    description: 'Forecast future revenue',
    icon: '📈'
  },

  // Performance Analytics
  {
    id: 'performance-deviation',
    name: 'Performance Deviation',
    path: '/performance-deviation',
    domain: 'performance',
    description: 'Analyze performance deviations',
    icon: '📊'
  },
  {
    id: 'retention-planner',
    name: 'Retention Planner',
    path: '/retention-planner',
    domain: 'performance',
    description: 'Plan customer retention strategies',
    icon: '🎯'
  },
  {
    id: 'performance-dashboard',
    name: 'Performance Dashboard',
    path: '/performance-dashboard',
    domain: 'performance',
    description: 'Overall performance metrics',
    icon: '📈'
  }
];