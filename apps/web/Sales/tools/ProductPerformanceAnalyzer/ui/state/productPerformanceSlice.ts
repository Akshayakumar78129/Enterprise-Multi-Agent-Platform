import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ProductPerformanceState, ProductAnalysisResult, Product } from '../types';
import { format } from 'date-fns';
import { productPerformanceApi } from '../api/productPerformanceApi';

// Initial state
const initialState: ProductPerformanceState = {
  loading: false,
  error: null,
  data: [],
  scatterPlotData: [],
  priceBandChartData: null,
  dateRange: {
    startDate: '2020-01-01',
    endDate: '2020-12-31',
  },
  selectedCategory: null,
  selectedSubcategory: null,
  minSalesThreshold: 1000,
  selectedMetrics: ['sales', 'units', 'margin', 'price_bands'],
  categoryLevel: 'product',
  timeGranularity: 'daily',
  analysisResult: null,
  categories: [],
  subcategories: {},
};

// API call to fetch product performance data
export const fetchProductPerformance = createAsyncThunk(
  'productPerformance/fetchData',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { productPerformance: ProductPerformanceState };
    const { dateRange, selectedMetrics, categoryLevel, minSalesThreshold, timeGranularity } = state.productPerformance;
    
    try {
      // Use the actual API client instead of direct fetch
      const data = await productPerformanceApi.fetchProductPerformance({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        metrics: selectedMetrics,
        category_level: categoryLevel,
        min_sales_threshold: minSalesThreshold,
        time_granularity: timeGranularity,
      });
      
      if (data.status === 'error') {
        return rejectWithValue(data.message || 'Failed to fetch product performance data');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Redux Slice
const productPerformanceSlice = createSlice({
  name: 'productPerformance',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.dateRange = action.payload;
    },
    setTimeGranularity: (state, action: PayloadAction<'daily' | 'weekly' | 'monthly'>) => {
      state.timeGranularity = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      // Clear subcategory when category changes
      if (state.selectedSubcategory !== null) {
        state.selectedSubcategory = null;
      }
    },
    setSelectedSubcategory: (state, action: PayloadAction<string | null>) => {
      state.selectedSubcategory = action.payload;
    },
    setMinSalesThreshold: (state, action: PayloadAction<number | null>) => {
      state.minSalesThreshold = action.payload;
    },
    setSelectedMetrics: (state, action: PayloadAction<("sales" | "units" | "margin" | "price_bands")[]>) => {
      state.selectedMetrics = action.payload;
    },
    setCategoryLevel: (state, action: PayloadAction<"product" | "category" | "subcategory">) => {
      state.categoryLevel = action.payload;
    },
    resetFilters: (state) => {
      state.selectedCategory = null;
      state.selectedSubcategory = null;
      state.minSalesThreshold = 1000;
      state.categoryLevel = 'product';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductPerformance.fulfilled, (state, action: PayloadAction<ProductAnalysisResult>) => {
        state.loading = false;
        state.analysisResult = action.payload;
        
        // Transform the data for internal use
        if (action.payload.status === 'success' && action.payload.results) {
          const { sales, units, margin } = action.payload.results;
          
          // Transform categories and subcategories
          if (sales && sales.category_distribution) {
            // Transform categories
            state.categories = Object.entries(sales.category_distribution)
              .map(([value, percentage]) => ({
                value,
                label: `${value} (${percentage.toFixed(1)}%)`
              }));

            // Transform subcategories
            if (action.payload.results.subcategories) {
              state.subcategories = Object.entries(action.payload.results.subcategories)
                .reduce((acc, [category, subcats]) => ({
                  ...acc,
                  [category]: Object.entries(subcats)
                    .map(([value, percentage]) => ({
                      value,
                      label: `${value} (${percentage.toFixed(1)}%)`
                    }))
                }), {});
            }
          }
          
          // Use daily_summary from API for state.data which feeds the trend chart
          if (action.payload.results.daily_summary) {
            state.data = action.payload.results.daily_summary.map(summary => ({
              date: summary.date,
              sales_amount: summary.sales,
              quantity: summary.quantity,
              // Ensure other Product fields are present if needed by components, or adjust Product type
              product_name: `Daily Summary ${summary.date}`,
              margin_pct: 0, // Margin calculation for daily summary might need refinement if displayed directly
              category: 'Daily',
            }));
          } else {
            state.data = []; // Clear data if daily_summary is not available
          }

          // Populate scatterPlotData
          if (action.payload.results.product_scatter_data) {
            state.scatterPlotData = action.payload.results.product_scatter_data;
          } else {
            state.scatterPlotData = [];
          }

          // Populate priceBandChartData
          if (action.payload.results.price_bands) {
            state.priceBandChartData = action.payload.results.price_bands;
          } else {
            state.priceBandChartData = null;
          }
        }
      })
      .addCase(fetchProductPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setDateRange,
  setTimeGranularity,
  setSelectedCategory,
  setSelectedSubcategory,
  setMinSalesThreshold,
  setSelectedMetrics,
  setCategoryLevel,
  resetFilters,
} = productPerformanceSlice.actions;

// Export reducer
export default productPerformanceSlice.reducer; 