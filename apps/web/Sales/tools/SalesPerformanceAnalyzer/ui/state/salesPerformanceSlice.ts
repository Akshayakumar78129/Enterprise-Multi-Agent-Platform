import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { SalesPerformanceState, SalesData, SalesAnalysisResult, SalesKpiData } from '../types';
import { fetchSalesPerformanceDataAPI } from '../api'; // Import the new API caller

export const fetchSalesPerformance = createAsyncThunk(
  'salesPerformance/fetchSalesPerformance',
  async (_, { getState }) => {
    const state = (getState() as { salesPerformance: SalesPerformanceState }).salesPerformance;
    // Pass the relevant state parts to the API caller
    const response = await fetchSalesPerformanceDataAPI({
      dateRange: state.dateRange,
      dimension: state.selectedDimension,
      metric: state.selectedMetric,
      // filters: state.activeFilters, // Example: if you add activeFilters to state
      timeGranularity: 'daily' // Example: or pass state.timeGranularity if it exists
    });
    return response; // This should be SalesAnalysisResult
  }
);

const initialState: SalesPerformanceState = {
  loading: false,
  error: null,
  data: [], // This will be populated from analysisResult.chartData by the view or could be done here
  dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' }, // Full 5-year data range
  selectedDimension: 'product', 
  selectedMetric: 'revenue', 
  analysisResult: null,
  // availableDimensions and availableMetrics could be part of state if fetched dynamically
};

const salesPerformanceSlice = createSlice({
  name: 'salesPerformance',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.dateRange = action.payload;
    },
    setSelectedDimension: (state, action: PayloadAction<string>) => {
      state.selectedDimension = action.payload;
    },
    setSelectedMetric: (state, action: PayloadAction<string>) => {
      state.selectedMetric = action.payload;
    },
    resetFilters: (state) => {
      state.dateRange = { startDate: '2017-01-01', endDate: '2021-12-31' }; // Full data range
      state.selectedDimension = 'product';
      state.selectedMetric = 'revenue';
      state.analysisResult = null; // Clear previous results
      state.data = [];
      state.error = null;
    },
    // You might add reducers for other filters if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesPerformance.fulfilled, (state, action: PayloadAction<SalesAnalysisResult>) => {
        state.loading = false;
        if (action.payload.status === 'success' && action.payload.results) {
          state.analysisResult = action.payload; // Store the whole result
          // Optionally, you can directly populate state.data if your API always returns a chartData structure
          // state.data = action.payload.results.chartData || [];
        } else {
          state.error = action.payload.message || 'Failed to fetch data (fulfilled with error status)';
          state.analysisResult = null; 
          state.data = [];
        }
      })
      .addCase(fetchSalesPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sales performance data (rejected)';
        state.analysisResult = null;
        state.data = [];
      });
  },
});

export const {
  setDateRange,
  setSelectedDimension,
  setSelectedMetric,
  resetFilters,
} = salesPerformanceSlice.actions;

export default salesPerformanceSlice.reducer; 