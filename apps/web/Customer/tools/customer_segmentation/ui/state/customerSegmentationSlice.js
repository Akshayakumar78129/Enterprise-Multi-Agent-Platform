import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for API calls
export const fetchSegmentationData = createAsyncThunk(
  'customerSegmentation/fetchData',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/customer-segmentation/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch segmentation data');
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSegmentCustomers = createAsyncThunk(
  'customerSegmentation/fetchSegmentCustomers',
  async ({ segmentName, limit = 100 }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/customer-segmentation/segment-customers?segment=${encodeURIComponent(segmentName)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch segment customers');
      }

      return { segmentName, customers: result.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  // Data
  segmentData: [],
  segmentDistribution: [],
  segmentComparison: [],
  segmentAttributes: null,
  kpiData: null,
  segmentCustomers: {},
  
  // UI State
  loading: false,
  error: null,
  selectedSegments: [],
  selectedCustomer: null,
  selectedSegment: null,
  selectedMetric: 'avg_lifetime_value',
  showPercentageView: false,
  sortBy: 'value',
  sortOrder: 'desc',
  
  // Filters
  filters: {
    segmentNames: [],
    minRFMScore: null,
    maxRFMScore: null,
    minLifetimeValue: null,
    maxLifetimeValue: null,
    customerTypes: [],
    states: [],
    countries: [],
    loyaltyStatuses: []
  },
  
  // AI Control
  highlightedCustomers: [],
  highlightedSegments: [],
  focusRegion: null,
  aiExplanation: null,
  
  // Metadata
  lastUpdated: null,
  dataQuality: {
    completeness: 0,
    segmentsIdentified: false
  }
};

// Slice definition
const customerSegmentationSlice = createSlice({
  name: 'customerSegmentation',
  initialState,
  reducers: {
    // UI Actions
    setSelectedSegments: (state, action) => {
      state.selectedSegments = action.payload;
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    setSelectedSegment: (state, action) => {
      state.selectedSegment = action.payload;
    },
    setSelectedMetric: (state, action) => {
      state.selectedMetric = action.payload;
    },
    setShowPercentageView: (state, action) => {
      state.showPercentageView = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    
    // Filter Actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.selectedSegments = [];
      state.selectedCustomer = null;
      state.selectedSegment = null;
    },
    
    // AI Control Actions
    highlightSegments: (state, action) => {
      const { segmentNames, explanation } = action.payload;
      state.highlightedSegments = segmentNames;
      state.selectedSegments = segmentNames;
      state.aiExplanation = explanation;
    },
    highlightCustomers: (state, action) => {
      const { customerNumbers, explanation } = action.payload;
      state.highlightedCustomers = customerNumbers;
      state.aiExplanation = explanation;
    },
    setFocusRegion: (state, action) => {
      state.focusRegion = action.payload;
    },
    clearHighlights: (state) => {
      state.highlightedCustomers = [];
      state.highlightedSegments = [];
      state.focusRegion = null;
      state.aiExplanation = null;
    },
    
    // Data Manipulation
    updateCustomerData: (state, action) => {
      const { customerId, updates } = action.payload;
      const customerIndex = state.segmentData.findIndex(c => c.customer_number === customerId);
      if (customerIndex !== -1) {
        state.segmentData[customerIndex] = { ...state.segmentData[customerIndex], ...updates };
      }
    },
    
    // Error Handling
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch segmentation data
      .addCase(fetchSegmentationData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSegmentationData.fulfilled, (state, action) => {
        state.loading = false;
        state.segmentData = action.payload.segment_data || [];
        state.segmentDistribution = action.payload.segment_distribution || [];
        state.segmentComparison = action.payload.segment_comparison || [];
        state.segmentAttributes = action.payload.segment_attributes || null;
        state.kpiData = action.payload.kpi_data || null;
        state.lastUpdated = action.payload.metadata?.last_updated || new Date().toISOString();
        state.dataQuality = action.payload.metadata?.data_quality || state.dataQuality;
      })
      .addCase(fetchSegmentationData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch segmentation data';
      })
      
      // Fetch segment customers
      .addCase(fetchSegmentCustomers.pending, (state) => {
        // Don't set global loading for this specific operation
      })
      .addCase(fetchSegmentCustomers.fulfilled, (state, action) => {
        const { segmentName, customers } = action.payload;
        state.segmentCustomers[segmentName] = customers;
      })
      .addCase(fetchSegmentCustomers.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch segment customers';
      });
  }
});

// Action creators
export const {
  setSelectedSegments,
  setSelectedCustomer,
  setSelectedSegment,
  setSelectedMetric,
  setShowPercentageView,
  setSortBy,
  setSortOrder,
  setFilters,
  resetFilters,
  highlightSegments,
  highlightCustomers,
  setFocusRegion,
  clearHighlights,
  updateCustomerData,
  clearError,
  setError
} = customerSegmentationSlice.actions;

// Selectors
export const selectSegmentationData = (state) => state.customerSegmentation.segmentData;
export const selectSegmentDistribution = (state) => state.customerSegmentation.segmentDistribution;
export const selectSegmentComparison = (state) => state.customerSegmentation.segmentComparison;
export const selectSegmentAttributes = (state) => state.customerSegmentation.segmentAttributes;
export const selectKPIData = (state) => state.customerSegmentation.kpiData;
export const selectLoading = (state) => state.customerSegmentation.loading;
export const selectError = (state) => state.customerSegmentation.error;

export const selectUIState = (state) => ({
  selectedSegments: state.customerSegmentation.selectedSegments,
  selectedCustomer: state.customerSegmentation.selectedCustomer,
  selectedSegment: state.customerSegmentation.selectedSegment,
  selectedMetric: state.customerSegmentation.selectedMetric,
  showPercentageView: state.customerSegmentation.showPercentageView,
  sortBy: state.customerSegmentation.sortBy,
  sortOrder: state.customerSegmentation.sortOrder
});

export const selectFilters = (state) => state.customerSegmentation.filters;

export const selectAIState = (state) => ({
  highlightedCustomers: state.customerSegmentation.highlightedCustomers,
  highlightedSegments: state.customerSegmentation.highlightedSegments,
  focusRegion: state.customerSegmentation.focusRegion,
  aiExplanation: state.customerSegmentation.aiExplanation
});

export const selectFilteredSegmentData = (state) => {
  const { segmentData, selectedSegments, filters } = state.customerSegmentation;
  
  return segmentData.filter(customer => {
    // Filter by selected segments
    if (selectedSegments.length > 0 && !selectedSegments.includes(customer.segment_name)) {
      return false;
    }
    
    // Filter by RFM score range
    if (filters.minRFMScore !== null && customer.rfm_rl_score < filters.minRFMScore) {
      return false;
    }
    if (filters.maxRFMScore !== null && customer.rfm_rl_score > filters.maxRFMScore) {
      return false;
    }
    
    // Filter by lifetime value range
    if (filters.minLifetimeValue !== null && customer.lifetime_value < filters.minLifetimeValue) {
      return false;
    }
    if (filters.maxLifetimeValue !== null && customer.lifetime_value > filters.maxLifetimeValue) {
      return false;
    }
    
    // Filter by customer types
    if (filters.customerTypes.length > 0 && !filters.customerTypes.includes(customer.customer_type)) {
      return false;
    }
    
    // Filter by states
    if (filters.states.length > 0 && !filters.states.includes(customer.state)) {
      return false;
    }
    
    // Filter by countries
    if (filters.countries.length > 0 && !filters.countries.includes(customer.country)) {
      return false;
    }
    
    // Filter by loyalty statuses
    if (filters.loyaltyStatuses.length > 0 && !filters.loyaltyStatuses.includes(customer.loyalty_status)) {
      return false;
    }
    
    return true;
  });
};

export const selectSegmentSummary = (state) => {
  const { segmentDistribution, kpiData } = state.customerSegmentation;
  
  if (!segmentDistribution.length || !kpiData) {
    return null;
  }
  
  return {
    totalSegments: segmentDistribution.length,
    totalCustomers: kpiData.total_customers,
    largestSegment: segmentDistribution.reduce((max, segment) => 
      segment.customer_count > max.customer_count ? segment : max
    ),
    mostValuableSegment: segmentDistribution.reduce((max, segment) => 
      segment.total_value > max.total_value ? segment : max
    ),
    segmentationQuality: kpiData.segmentation_quality,
    stabilityPercentage: kpiData.stability_percentage
  };
};

export default customerSegmentationSlice.reducer; 