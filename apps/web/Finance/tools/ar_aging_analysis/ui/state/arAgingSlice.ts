import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface AgingBucket {
  range: string;
  amount: number;
  npvAdjustedAmount: number;
  count: number;
  percentOfTotal: number;
  valueErosion: number;
  color: string;
}

export interface CustomerRisk {
  customerId: string;
  customerName: string;
  outstandingAmount: number;
  daysPastDue: number;
  riskScore: number;
  clv: number;
  paymentRiskScore: number;
  profitability: number;
  collectionProbability: number;
  segment: 'Strategic Partners' | 'Growth Opportunities' | 'Efficiency Targets' | 'Value Destroyers';
}

export interface KPIMetric {
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  benchmark?: number;
  status: 'good' | 'warning' | 'critical';
}

export interface CollectionForecast {
  date: string;
  predictedAmount: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
}

export interface ARAgingState {
  loading: boolean;
  error: string | null;
  filters: {
    dateRange: { start: string; end: string };
    customerSegment: string[];
    riskLevel: string[];
    amountRange: { min: number; max: number };
  };
  agingBuckets: AgingBucket[];
  customerRisks: CustomerRisk[];
  kpis: {
    workingCapitalROI: KPIMetric;
    economicValueLost: KPIMetric;
    cashVelocityScore: KPIMetric;
    concentrationRisk: KPIMetric;
    collectionROI: KPIMetric;
  };
  collectionForecast: CollectionForecast[];
  selectedCustomers: string[];
  wacc: number;
  scenarioMode: 'optimistic' | 'realistic' | 'conservative';
}

const initialState: ARAgingState = {
  loading: false,
  error: null,
  filters: {
    dateRange: { 
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    customerSegment: [],
    riskLevel: [],
    amountRange: { min: 0, max: 1000000 }
  },
  agingBuckets: [],
  customerRisks: [],
  kpis: {
    workingCapitalROI: {
      value: 0,
      change: 0,
      trend: 'stable',
      status: 'good'
    },
    economicValueLost: {
      value: 0,
      change: 0,
      trend: 'stable',
      status: 'good'
    },
    cashVelocityScore: {
      value: 0,
      change: 0,
      trend: 'stable',
      status: 'good'
    },
    concentrationRisk: {
      value: 0,
      change: 0,
      trend: 'stable',
      status: 'good'
    },
    collectionROI: {
      value: 0,
      change: 0,
      trend: 'stable',
      status: 'good'
    }
  },
  collectionForecast: [],
  selectedCustomers: [],
  wacc: 10,
  scenarioMode: 'realistic'
};

// Async thunks for API calls
export const fetchARAgingData = createAsyncThunk(
  'arAging/fetchData',
  async (filters: ARAgingState['filters']) => {
    const response = await fetch('/api/finance/ar-aging', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    });
    if (!response.ok) throw new Error('Failed to fetch AR aging data');
    return response.json();
  }
);

export const fetchCollectionForecast = createAsyncThunk(
  'arAging/fetchForecast',
  async (params: { scenario: string; wacc: number }) => {
    const response = await fetch('/api/finance/ar-collection-forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error('Failed to fetch collection forecast');
    return response.json();
  }
);

const arAgingSlice = createSlice({
  name: 'arAging',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ARAgingState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setWACC: (state, action: PayloadAction<number>) => {
      state.wacc = action.payload;
    },
    setScenarioMode: (state, action: PayloadAction<ARAgingState['scenarioMode']>) => {
      state.scenarioMode = action.payload;
    },
    selectCustomer: (state, action: PayloadAction<string>) => {
      if (!state.selectedCustomers.includes(action.payload)) {
        state.selectedCustomers.push(action.payload);
      }
    },
    deselectCustomer: (state, action: PayloadAction<string>) => {
      state.selectedCustomers = state.selectedCustomers.filter(id => id !== action.payload);
    },
    clearSelectedCustomers: (state) => {
      state.selectedCustomers = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchARAgingData
      .addCase(fetchARAgingData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchARAgingData.fulfilled, (state, action) => {
        state.loading = false;
        state.agingBuckets = action.payload.agingBuckets;
        state.customerRisks = action.payload.customerRisks;
        state.kpis = action.payload.kpis;
      })
      .addCase(fetchARAgingData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch data';
      })
      // Handle fetchCollectionForecast
      .addCase(fetchCollectionForecast.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCollectionForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.collectionForecast = action.payload;
      })
      .addCase(fetchCollectionForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch forecast';
      });
  }
});

export const { 
  setFilters, 
  setWACC, 
  setScenarioMode, 
  selectCustomer, 
  deselectCustomer, 
  clearSelectedCustomers 
} = arAgingSlice.actions;

export default arAgingSlice.reducer;