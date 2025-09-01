import { FilterConfig } from './UniversalDashboardFilters';
import { Calendar, Users, Package, DollarSign, TrendingUp, MapPin, ShoppingCart, BarChart3 } from 'lucide-react';
import React from 'react';

// Sales Dashboard Filters
export const salesFilters: FilterConfig[] = [
  {
    type: 'date',
    label: 'Date Range',
    key: 'dateRange',
    defaultValue: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    type: 'multiselect',
    label: 'Product Categories',
    key: 'categories',
    options: [
      { value: 'electronics', label: 'Electronics' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'food', label: 'Food & Beverages' },
      { value: 'home', label: 'Home & Garden' },
      { value: 'sports', label: 'Sports & Outdoors' }
    ]
  },
  {
    type: 'select',
    label: 'Region',
    key: 'region',
    placeholder: 'All Regions',
    options: [
      { value: 'north', label: 'North' },
      { value: 'south', label: 'South' },
      { value: 'east', label: 'East' },
      { value: 'west', label: 'West' },
      { value: 'central', label: 'Central' }
    ]
  },
  {
    type: 'select',
    label: 'Sales Channel',
    key: 'channel',
    placeholder: 'All Channels',
    options: [
      { value: 'online', label: 'Online' },
      { value: 'retail', label: 'Retail Store' },
      { value: 'wholesale', label: 'Wholesale' },
      { value: 'marketplace', label: 'Marketplace' }
    ]
  },
  {
    type: 'range',
    label: 'Revenue Range ($)',
    key: 'revenueRange',
    min: 0,
    max: 1000000
  },
  {
    type: 'toggle',
    label: 'Show only top performers',
    key: 'topPerformers',
    defaultValue: false
  }
];

// Customer Churn Dashboard Filters
export const churnFilters: FilterConfig[] = [
  {
    type: 'date',
    label: 'Analysis Period',
    key: 'dateRange',
    defaultValue: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    type: 'select',
    label: 'Risk Level',
    key: 'riskLevel',
    placeholder: 'All Risk Levels',
    options: [
      { value: 'high', label: 'High Risk (>70%)' },
      { value: 'medium', label: 'Medium Risk (40-70%)' },
      { value: 'low', label: 'Low Risk (<40%)' }
    ]
  },
  {
    type: 'multiselect',
    label: 'Customer Segments',
    key: 'segments',
    options: [
      { value: 'premium', label: 'Premium' },
      { value: 'regular', label: 'Regular' },
      { value: 'occasional', label: 'Occasional' },
      { value: 'new', label: 'New Customers' },
      { value: 'dormant', label: 'Dormant' }
    ]
  },
  {
    type: 'range',
    label: 'Customer Lifetime Value ($)',
    key: 'clvRange',
    min: 0,
    max: 50000
  },
  {
    type: 'range',
    label: 'Days Since Last Purchase',
    key: 'daysSinceLastPurchase',
    min: 0,
    max: 365
  },
  {
    type: 'toggle',
    label: 'Show actionable insights only',
    key: 'actionableOnly',
    defaultValue: true
  }
];

// Inventory Dashboard Filters
export const inventoryFilters: FilterConfig[] = [
  {
    type: 'date',
    label: 'Inventory Period',
    key: 'dateRange',
    defaultValue: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    type: 'multiselect',
    label: 'Warehouses',
    key: 'warehouses',
    options: [
      { value: 'wh-001', label: 'Main Warehouse' },
      { value: 'wh-002', label: 'East Coast DC' },
      { value: 'wh-003', label: 'West Coast DC' },
      { value: 'wh-004', label: 'Central Hub' },
      { value: 'wh-005', label: 'International' }
    ]
  },
  {
    type: 'select',
    label: 'Stock Status',
    key: 'stockStatus',
    placeholder: 'All Statuses',
    options: [
      { value: 'instock', label: 'In Stock' },
      { value: 'lowstock', label: 'Low Stock' },
      { value: 'outofstock', label: 'Out of Stock' },
      { value: 'overstocked', label: 'Overstocked' }
    ]
  },
  {
    type: 'range',
    label: 'Holding Cost Range ($)',
    key: 'holdingCostRange',
    min: 0,
    max: 100000
  },
  {
    type: 'range',
    label: 'Turnover Rate',
    key: 'turnoverRate',
    min: 0,
    max: 52
  },
  {
    type: 'toggle',
    label: 'Show slow-moving items only',
    key: 'slowMoving',
    defaultValue: false
  }
];

// Customer Behavior Dashboard Filters
export const behaviorFilters: FilterConfig[] = [
  {
    type: 'date',
    label: 'Behavior Analysis Period',
    key: 'dateRange',
    defaultValue: {
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    type: 'multiselect',
    label: 'Behavior Types',
    key: 'behaviorTypes',
    options: [
      { value: 'browse', label: 'Browsing' },
      { value: 'purchase', label: 'Purchasing' },
      { value: 'abandon', label: 'Cart Abandonment' },
      { value: 'return', label: 'Returns' },
      { value: 'review', label: 'Reviews & Ratings' }
    ]
  },
  {
    type: 'select',
    label: 'Customer Cohort',
    key: 'cohort',
    placeholder: 'All Cohorts',
    options: [
      { value: '2024-q1', label: 'Q1 2024' },
      { value: '2024-q2', label: 'Q2 2024' },
      { value: '2024-q3', label: 'Q3 2024' },
      { value: '2024-q4', label: 'Q4 2024' }
    ]
  },
  {
    type: 'search',
    label: 'Customer Search',
    key: 'customerSearch',
    placeholder: 'Search by name or ID...'
  },
  {
    type: 'range',
    label: 'Purchase Frequency (per month)',
    key: 'purchaseFrequency',
    min: 0,
    max: 30
  },
  {
    type: 'toggle',
    label: 'Show engaged customers only',
    key: 'engagedOnly',
    defaultValue: false
  }
];

// Finance Dashboard Filters
export const financeFilters: FilterConfig[] = [
  {
    type: 'date',
    label: 'Financial Period',
    key: 'dateRange',
    defaultValue: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    type: 'select',
    label: 'Reporting Period',
    key: 'period',
    placeholder: 'Select Period',
    options: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' }
    ],
    defaultValue: 'monthly'
  },
  {
    type: 'multiselect',
    label: 'Account Categories',
    key: 'accountCategories',
    options: [
      { value: 'revenue', label: 'Revenue' },
      { value: 'expenses', label: 'Expenses' },
      { value: 'assets', label: 'Assets' },
      { value: 'liabilities', label: 'Liabilities' },
      { value: 'equity', label: 'Equity' }
    ]
  },
  {
    type: 'select',
    label: 'Currency',
    key: 'currency',
    placeholder: 'USD',
    options: [
      { value: 'USD', label: 'USD ($)' },
      { value: 'EUR', label: 'EUR (€)' },
      { value: 'GBP', label: 'GBP (£)' },
      { value: 'JPY', label: 'JPY (¥)' }
    ],
    defaultValue: 'USD'
  },
  {
    type: 'range',
    label: 'Transaction Amount ($)',
    key: 'transactionAmount',
    min: 0,
    max: 1000000
  },
  {
    type: 'toggle',
    label: 'Show anomalies only',
    key: 'anomaliesOnly',
    defaultValue: false
  }
];

// Product Performance Dashboard Filters
export const productFilters: FilterConfig[] = [
  {
    type: 'date',
    label: 'Performance Period',
    key: 'dateRange',
    defaultValue: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    type: 'search',
    label: 'Product Search',
    key: 'productSearch',
    placeholder: 'Search products...'
  },
  {
    type: 'multiselect',
    label: 'Product Categories',
    key: 'categories',
    options: [
      { value: 'electronics', label: 'Electronics' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'food', label: 'Food & Beverages' },
      { value: 'home', label: 'Home & Garden' },
      { value: 'sports', label: 'Sports & Outdoors' }
    ]
  },
  {
    type: 'select',
    label: 'Performance Metric',
    key: 'metric',
    placeholder: 'Select Metric',
    options: [
      { value: 'revenue', label: 'Revenue' },
      { value: 'units', label: 'Units Sold' },
      { value: 'margin', label: 'Profit Margin' },
      { value: 'rating', label: 'Customer Rating' },
      { value: 'returns', label: 'Return Rate' }
    ],
    defaultValue: 'revenue'
  },
  {
    type: 'range',
    label: 'Price Range ($)',
    key: 'priceRange',
    min: 0,
    max: 5000
  },
  {
    type: 'toggle',
    label: 'Show trending products only',
    key: 'trendingOnly',
    defaultValue: false
  }
];

// Helper function to get filters by dashboard type
export const getFiltersByDashboardType = (type: string): FilterConfig[] => {
  switch (type.toLowerCase()) {
    case 'sales':
      return salesFilters;
    case 'churn':
      return churnFilters;
    case 'inventory':
      return inventoryFilters;
    case 'behavior':
    case 'customer':
      return behaviorFilters;
    case 'finance':
      return financeFilters;
    case 'product':
      return productFilters;
    default:
      return salesFilters; // Default to sales filters
  }
};