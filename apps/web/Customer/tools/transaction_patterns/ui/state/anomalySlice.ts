import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DateRange } from '../types/transaction';
import { transactionPatternApi } from '../api/transactionPatternApi';

// Anomaly types
interface AnomalyDistribution {
  byHour: Record<string, number>;
  byDay: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  byValue: {
    low: number;
    medium: number;
    high: number;
  };
}

interface AnomalyStats {
  anomalyRate: number;
  anomalyCount: number;
  totalTransactions: number;
  anomalyDistribution: AnomalyDistribution;
}

export interface Anomaly {
  transactionId: string;
  timestamp: string;
  value: number;
  hour: number;
  dayOfWeek: number;
  productsCount: number;
  paymentMethod: string;
  location: string;
  isAnomaly: boolean;
  anomalyScore: number;
}

interface AnomalyState {
  anomalies: Anomaly[];
  stats: AnomalyStats | null;
  selectedAnomaly: Anomaly | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AnomalyState = {
  anomalies: [],
  stats: null,
  selectedAnomaly: null,
  loading: false,
  error: null
};

// Async thunk for fetching anomaly data
export const fetchAnomalyData = createAsyncThunk(
  'anomalies/fetchAnomalyData',
  async (dateRange: DateRange, { rejectWithValue }) => {
    try {
      const data = await transactionPatternApi.fetchAnomalyData(dateRange);
      return data;
    } catch (error) {
      return rejectWithValue('Failed to fetch anomaly data');
    }
  }
);

// Anomaly slice
const anomalySlice = createSlice({
  name: 'anomalies',
  initialState,
  reducers: {
    setSelectedAnomaly: (state, action: PayloadAction<Anomaly | null>) => {
      state.selectedAnomaly = action.payload;
    },
    setAnomalyStats: (state, action: PayloadAction<AnomalyStats>) => {
      state.stats = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnomalyData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnomalyData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.anomalies = (action.payload.anomalies || []).map(a => ({
            ...a,
            anomalyScore: a.anomalyScore ?? 0
          }));
          state.stats = action.payload.stats || null;
        }
      })
      .addCase(fetchAnomalyData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch anomaly data';
      });
  }
});

// Export actions and reducer
export const { setSelectedAnomaly, setAnomalyStats } = anomalySlice.actions;

// Selectors
export const selectAnomalies = (state: { anomalies: AnomalyState }) => state.anomalies.anomalies;
export const selectAnomalyStats = (state: { anomalies: AnomalyState }) => state.anomalies.stats;
export const selectSelectedAnomaly = (state: { anomalies: AnomalyState }) => state.anomalies.selectedAnomaly;
export const selectAnomalyLoading = (state: { anomalies: AnomalyState }) => state.anomalies.loading;
export const selectAnomalyError = (state: { anomalies: AnomalyState }) => state.anomalies.error;

export default anomalySlice.reducer; 