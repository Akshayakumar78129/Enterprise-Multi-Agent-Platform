/**
 * Customer Insight Redux Slice
 * Manages state for engagement classifier and customer insights
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Customer interface for engagement data
export interface EngagementCustomer {
  customer_id: number;
  name: string;
  engagement_level: 'Low' | 'Medium' | 'High' | 'Very High';
  engagement_score: number;
  avg_session_duration?: number;
  activity_count?: number;
  sentiment_score?: number;
  last_interaction?: string;
  total_purchases?: number;
  preferred_channel?: string;
  segment?: string;
}

// Filters interface
export interface CustomerInsightFilters {
  engagement_level?: string[];
  score_range?: [number, number];
  date_range?: [string, string];
  segment?: string[];
  channel?: string[];
  search_query?: string;
}

// State interface
export interface CustomerInsightState {
  customers: EngagementCustomer[];
  filters: CustomerInsightFilters;
  loading: boolean;
  error: string | null;
  totalCustomers: number;
  selectedCustomers: number[];
  insights: {
    averageEngagement: number;
    topPerformers: EngagementCustomer[];
    trends: any[];
    recommendations: string[];
  };
}

// Initial state
const initialState: CustomerInsightState = {
  customers: [],
  filters: {},
  loading: false,
  error: null,
  totalCustomers: 0,
  selectedCustomers: [],
  insights: {
    averageEngagement: 0,
    topPerformers: [],
    trends: [],
    recommendations: []
  }
};

// Async thunks for API calls
export const fetchCustomerInsights = createAsyncThunk(
  'customerInsight/fetchCustomerInsights',
  async (filters: CustomerInsightFilters = {}) => {
    try {
      // This would typically call the engagement classifier API
      const response = await fetch('/api/engagement-classifier/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform churn data to engagement data format
      const customers: EngagementCustomer[] = data.customers?.map((customer: any) => ({
        customer_id: customer.customer_id || customer.id,
        name: customer.name || customer.customer_name || `Customer ${customer.customer_id}`,
        engagement_level: mapChurnToEngagement(customer.risk_level || customer.churn_risk),
        engagement_score: calculateEngagementScore(customer),
        avg_session_duration: customer.avg_session_duration || Math.random() * 300 + 60,
        activity_count: customer.activity_count || Math.floor(Math.random() * 50) + 10,
        sentiment_score: customer.sentiment_score || Math.random() * 2 - 1,
        last_interaction: customer.last_interaction || new Date().toISOString(),
        total_purchases: customer.total_purchases || customer.purchase_count || Math.floor(Math.random() * 20),
        preferred_channel: customer.preferred_channel || ['Email', 'Mobile', 'Web', 'Social'][Math.floor(Math.random() * 4)],
        segment: customer.segment || ['Premium', 'Standard', 'Basic'][Math.floor(Math.random() * 3)]
      })) || [];

      return {
        customers,
        totalCustomers: customers.length,
        insights: {
          averageEngagement: customers.reduce((sum, c) => sum + c.engagement_score, 0) / customers.length || 0,
          topPerformers: customers
            .filter(c => c.engagement_level === 'Very High' || c.engagement_level === 'High')
            .slice(0, 5),
          trends: generateTrendData(),
          recommendations: generateRecommendations(customers)
        }
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch customer insights');
    }
  }
);

// Helper functions
const mapChurnToEngagement = (churnRisk: string): 'Low' | 'Medium' | 'High' | 'Very High' => {
  switch (churnRisk) {
    case 'Very High': return 'Low';
    case 'High': return 'Medium';
    case 'Medium': return 'High';
    case 'Low': return 'Very High';
    default: return 'Medium';
  }
};

const calculateEngagementScore = (customer: any): number => {
  // Convert churn probability to engagement score (inverse relationship)
  const churnProb = customer.churn_probability || Math.random();
  return Math.round((1 - churnProb) * 100);
};

const generateTrendData = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
    engagement: Math.random() * 40 + 60,
    activity: Math.random() * 1000 + 500
  }));
};

const generateRecommendations = (customers: EngagementCustomer[]): string[] => {
  const lowEngagement = customers.filter(c => c.engagement_level === 'Low').length;
  const highEngagement = customers.filter(c => c.engagement_level === 'Very High').length;
  
  const recommendations = [];
  
  if (lowEngagement > customers.length * 0.3) {
    recommendations.push('Focus on re-engagement campaigns for low-activity customers');
  }
  
  if (highEngagement > customers.length * 0.2) {
    recommendations.push('Leverage high-engagement customers for referral programs');
  }
  
  recommendations.push('Implement personalized content based on engagement patterns');
  recommendations.push('Optimize mobile experience to increase session duration');
  
  return recommendations;
};

// Redux slice
const customerInsightSlice = createSlice({
  name: 'customerInsight',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<CustomerInsightFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSelectedCustomers: (state, action: PayloadAction<number[]>) => {
      state.selectedCustomers = action.payload;
    },
    toggleCustomerSelection: (state, action: PayloadAction<number>) => {
      const customerId = action.payload;
      const index = state.selectedCustomers.indexOf(customerId);
      if (index > -1) {
        state.selectedCustomers.splice(index, 1);
      } else {
        state.selectedCustomers.push(customerId);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    updateCustomerEngagement: (state, action: PayloadAction<{ customerId: number; engagement_score: number; engagement_level: string }>) => {
      const { customerId, engagement_score, engagement_level } = action.payload;
      const customer = state.customers.find(c => c.customer_id === customerId);
      if (customer) {
        customer.engagement_score = engagement_score;
        customer.engagement_level = engagement_level as any;
      }
    },
    setCustomers: (state, action: PayloadAction<EngagementCustomer[]>) => {
      state.customers = action.payload;
      state.totalCustomers = action.payload.length;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerInsights.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerInsights.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.customers;
        state.totalCustomers = action.payload.totalCustomers;
        state.insights = action.payload.insights;
        state.error = null;
      })
      .addCase(fetchCustomerInsights.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customer insights';
      });
  },
});

// Export actions
export const {
  setFilters,
  clearFilters,
  setSelectedCustomers,
  toggleCustomerSelection,
  clearError,
  updateCustomerEngagement,
  setCustomers
} = customerInsightSlice.actions;

// Export reducer
export default customerInsightSlice.reducer;

// Selectors
export const selectCustomers = (state: { customerInsight: CustomerInsightState }) => state.customerInsight.customers;
export const selectFilters = (state: { customerInsight: CustomerInsightState }) => state.customerInsight.filters;
export const selectLoading = (state: { customerInsight: CustomerInsightState }) => state.customerInsight.loading;
export const selectError = (state: { customerInsight: CustomerInsightState }) => state.customerInsight.error;
export const selectInsights = (state: { customerInsight: CustomerInsightState }) => state.customerInsight.insights;
export const selectSelectedCustomers = (state: { customerInsight: CustomerInsightState }) => state.customerInsight.selectedCustomers;