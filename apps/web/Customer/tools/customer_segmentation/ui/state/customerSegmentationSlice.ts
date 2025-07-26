import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SegmentSummary, KPI, ScatterDatum, Customer } from '../types';

interface CustomerSegmentationState {
  segmentSummaries: SegmentSummary[];
  kpis: KPI | null;
  scatterData: ScatterDatum[];
  customers: Customer[];
  filters: {
    region?: string;
    segment?: string | number;
  };
  highlights: {
    segment?: string | number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CustomerSegmentationState = {
  segmentSummaries: [],
  kpis: null,
  scatterData: [],
  customers: [],
  filters: {},
  highlights: {},
  loading: false,
  error: null,
};

const customerSegmentationSlice = createSlice({
  name: 'customerSegmentation',
  initialState,
  reducers: {
    setSegmentSummaries(state, action: PayloadAction<SegmentSummary[]>) {
      state.segmentSummaries = action.payload;
    },
    setKPIs(state, action: PayloadAction<KPI>) {
      state.kpis = action.payload;
    },
    setScatterData(state, action: PayloadAction<ScatterDatum[]>) {
      state.scatterData = action.payload;
    },
    setCustomers(state, action: PayloadAction<Customer[]>) {
      state.customers = action.payload;
    },
    setFilters(state, action: PayloadAction<{ region?: string; segment?: string | number }>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setHighlights(state, action: PayloadAction<{ segment?: string | number }>) {
      state.highlights = { ...state.highlights, ...action.payload };
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetSegmentationView(state) {
      state.filters = {};
      state.highlights = {};
    },
  },
});

export const {
  setSegmentSummaries,
  setKPIs,
  setScatterData,
  setCustomers,
  setFilters,
  setHighlights,
  setLoading,
  setError,
  resetSegmentationView,
} = customerSegmentationSlice.actions;

export default customerSegmentationSlice.reducer; 