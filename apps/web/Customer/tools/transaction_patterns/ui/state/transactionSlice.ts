import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Transaction, 
  DateRange, 
  TransactionState, 
  TimeFilter,
  TransactionStats
} from '../types/transaction';
import { transactionPatternApi } from '../api/transactionPatternApi';

// Initial state
const initialState: TransactionState = {
  transactions: [],
  stats: null,
  temporalHeatmap: null,
  productAssociations: [],
  dateRange: {
    startDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date.toISOString().split('T')[0];
    })(),
    endDate: new Date().toISOString().split('T')[0]
  },
  selectedTimeFilter: null,
  loading: false,
  error: null
};

// Async thunk for fetching transaction data
export const fetchTransactionData = createAsyncThunk(
  'transactions/fetchTransactionData',
  async (dateRange: DateRange, { rejectWithValue }) => {
    try {
      const data = await transactionPatternApi.fetchTransactionPatterns(dateRange);
      return data;
    } catch (error) {
      return rejectWithValue('Failed to fetch transaction data');
    }
  }
);

// Transaction slice
const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload;
    },
    setSelectedTimeFilter: (state, action: PayloadAction<TimeFilter | null>) => {
      state.selectedTimeFilter = action.payload;
    },
    setTransactionStats: (state, action: PayloadAction<TransactionStats>) => {
      state.stats = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.transactions = action.payload.transactions || [];
          state.stats = action.payload.stats || null;
          state.temporalHeatmap = action.payload.temporalHeatmap || null;
          state.productAssociations = action.payload.productAssociations || [];
        }
      })
      .addCase(fetchTransactionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch transaction data';
      });
  }
});

// Export actions and reducer
export const { setDateRange, setSelectedTimeFilter, setTransactionStats } = transactionSlice.actions;

// Selectors
export const selectTransactionStats = (state: { transactions: TransactionState }) => state.transactions.stats;
export const selectDateRange = (state: { transactions: TransactionState }) => state.transactions.dateRange;
export const selectTimeFilter = (state: { transactions: TransactionState }) => state.transactions.selectedTimeFilter;
export const selectLoading = (state: { transactions: TransactionState }) => state.transactions.loading;
export const selectError = (state: { transactions: TransactionState }) => state.transactions.error;
export const selectTemporalHeatmap = (state: { transactions: TransactionState }) => state.transactions.temporalHeatmap;
export const selectTransactionData = (state: { transactions: TransactionState }) => state.transactions.transactions;
export const selectProductAssociations = (state: { transactions: TransactionState }) => state.transactions.productAssociations;

export default transactionSlice.reducer; 