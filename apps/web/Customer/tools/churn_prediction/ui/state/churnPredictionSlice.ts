import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface ChurnCustomer {
  customer_id: number;
  name: string;
  rfm: number;
  last_purchase_date: string;
  frequency: number;
  avg_order_value: number;
  churn_probability: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
}

export interface ChartContext {
  chartType: string;
  chartName: string;
  selectedData: any;
  clickedElement: string;
  timestamp: Date;
}

export interface ChurnPredictionState {
  customers: ChurnCustomer[];
  loading: boolean;
  error: string | null;
  filters: {
    riskLevel?: string;
    search?: string;
  };
  highlights: any;
  kpis: any;
  chatContext: ChartContext | null;
  isChatOpen: boolean;
}

const initialState: ChurnPredictionState = {
  customers: [],
  loading: false,
  error: null,
  filters: {},
  highlights: {},
  kpis: {},
  chatContext: null,
  isChatOpen: false,
};

export const fetchChurnCustomers = createAsyncThunk(
  'churnPrediction/fetchChurnCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/churn-prediction/data');
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message);
      return data.customers;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

const churnPredictionSlice = createSlice({
  name: 'churnPrediction',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setHighlights(state, action) {
      state.highlights = action.payload;
    },
    setKPIs(state, action) {
      state.kpis = action.payload;
    },
    setChatContext(state, action) {
      state.chatContext = action.payload;
    },
    toggleChat(state, action) {
      state.isChatOpen = action.payload !== undefined ? action.payload : !state.isChatOpen;
    },
    clearChatContext(state) {
      state.chatContext = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChurnCustomers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChurnCustomers.fulfilled, (state, action) => {
        state.customers = action.payload;
        state.loading = false;
      })
      .addCase(fetchChurnCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setFilters, setHighlights, setKPIs, setChatContext, toggleChat, clearChatContext } = churnPredictionSlice.actions;
export default churnPredictionSlice.reducer; 