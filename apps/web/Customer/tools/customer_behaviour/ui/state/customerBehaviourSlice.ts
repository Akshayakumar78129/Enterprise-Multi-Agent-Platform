import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BehaviourPattern, CategoryAffinity, ChannelUsage, KPI } from '../types';

interface CustomerBehaviourState {
  patterns: BehaviourPattern[];
  categories: CategoryAffinity[];
  channels: ChannelUsage[];
  kpis: KPI | null;
  filters: {
    category?: string;
    channel?: string;
    churnRisk?: 'low' | 'medium' | 'high';
  };
  highlights: {
    customer_id?: string;
    category?: string;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CustomerBehaviourState = {
  patterns: [],
  categories: [],
  channels: [],
  kpis: null,
  filters: {},
  highlights: {},
  loading: false,
  error: null,
};

const customerBehaviourSlice = createSlice({
  name: 'customerBehaviour',
  initialState,
  reducers: {
    setPatterns(state, action: PayloadAction<BehaviourPattern[]>) {
      state.patterns = action.payload;
    },
    setCategories(state, action: PayloadAction<CategoryAffinity[]>) {
      state.categories = action.payload;
    },
    setChannels(state, action: PayloadAction<ChannelUsage[]>) {
      state.channels = action.payload;
    },
    setKPIs(state, action: PayloadAction<KPI>) {
      state.kpis = action.payload;
    },
    setFilters(state, action: PayloadAction<{ category?: string; channel?: string; churnRisk?: 'low' | 'medium' | 'high' }>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setHighlights(state, action: PayloadAction<{ customer_id?: string; category?: string }>) {
      state.highlights = { ...state.highlights, ...action.payload };
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetBehaviourView(state) {
      state.filters = {};
      state.highlights = {};
    },
  },
});

export const {
  setPatterns,
  setCategories,
  setChannels,
  setKPIs,
  setFilters,
  setHighlights,
  setLoading,
  setError,
  resetBehaviourView,
} = customerBehaviourSlice.actions;

export default customerBehaviourSlice.reducer; 