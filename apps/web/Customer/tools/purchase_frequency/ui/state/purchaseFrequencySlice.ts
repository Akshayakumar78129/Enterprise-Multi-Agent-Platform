// Redux state management for Purchase Frequency Analyzer
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  DateRange, 
  KPIData, 
  HistogramData, 
  IntervalData, 
  CustomerSegment, 
  RegularityData, 
  ValueSegment, 
  RecommendationCard 
} from '../types';

interface PurchaseFrequencyState {
  // Filters and controls
  dateRange: DateRange;
  selectedSegments: string[];
  frequencyRange: { min: number; max?: number };
  isLoading: boolean;
  
  // KPI data
  kpiData: KPIData | null;
  
  // Visualization data
  histogramData: HistogramData[];
  meanFrequency: number;
  highThreshold: number;
  lowThreshold: number;
  
  intervalData: IntervalData[];
  
  customerSegments: CustomerSegment[];
  
  regularityData: RegularityData[];
  previousPeriodRegularity?: RegularityData[];
  
  valueSegments: ValueSegment[];
  
  // UI state
  intelligencePanelExpanded: boolean;
  intelligenceResponse: string | null;
  intelligenceLoading: boolean;
  
  recommendations: RecommendationCard[];
  highlightedElements: {
    histogramBins?: number[];
    intervalCells?: Array<{ day: string; hour: number }>;
    customerSegments?: string[];
    valueSegments?: string[];
  };
  
  // Comparison mode
  comparisonActive: boolean;
  comparisonData?: {
    period1: DateRange;
    period2: DateRange;
    label1: string;
    label2: string;
    histogramData1: HistogramData[];
    histogramData2: HistogramData[];
    kpiData1: KPIData;
    kpiData2: KPIData;
  };
}

const initialState: PurchaseFrequencyState = {
  // Default to last 90 days
  dateRange: {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  selectedSegments: [],
  frequencyRange: { min: 0 },
  isLoading: false,
  
  kpiData: null,
  
  histogramData: [],
  meanFrequency: 0,
  highThreshold: 0,
  lowThreshold: 0,
  
  intervalData: [],
  
  customerSegments: [],
  
  regularityData: [],
  
  valueSegments: [],
  
  intelligencePanelExpanded: false,
  intelligenceResponse: null,
  intelligenceLoading: false,
  
  recommendations: [],
  highlightedElements: {},
  
  comparisonActive: false
};

export const purchaseFrequencySlice = createSlice({
  name: 'purchaseFrequency',
  initialState,
  reducers: {
    // Filter actions
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload;
      state.isLoading = true;
    },
    setSelectedSegments: (state, action: PayloadAction<string[]>) => {
      state.selectedSegments = action.payload;
      state.isLoading = true;
    },
    setFrequencyRange: (state, action: PayloadAction<{ min: number; max?: number }>) => {
      state.frequencyRange = action.payload;
      state.isLoading = true;
    },
    
    // Data loading actions
    setKPIData: (state, action: PayloadAction<KPIData>) => {
      state.kpiData = action.payload;
    },
    setHistogramData: (state, action: PayloadAction<{ 
      data: HistogramData[]; 
      mean: number; 
      highThreshold: number; 
      lowThreshold: number 
    }>) => {
      state.histogramData = action.payload.data;
      state.meanFrequency = action.payload.mean;
      state.highThreshold = action.payload.highThreshold;
      state.lowThreshold = action.payload.lowThreshold;
    },
    setIntervalData: (state, action: PayloadAction<IntervalData[]>) => {
      state.intervalData = action.payload;
    },
    setCustomerSegments: (state, action: PayloadAction<CustomerSegment[]>) => {
      state.customerSegments = action.payload;
    },
    setRegularityData: (state, action: PayloadAction<RegularityData[]>) => {
      state.regularityData = action.payload;
    },
    setPreviousPeriodRegularity: (state, action: PayloadAction<RegularityData[]>) => {
      state.previousPeriodRegularity = action.payload;
    },
    setValueSegments: (state, action: PayloadAction<ValueSegment[]>) => {
      state.valueSegments = action.payload;
    },
    setRecommendations: (state, action: PayloadAction<RecommendationCard[]>) => {
      state.recommendations = action.payload;
    },
    
    // UI state actions
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    toggleIntelligencePanel: (state) => {
      state.intelligencePanelExpanded = !state.intelligencePanelExpanded;
    },
    setIntelligencePanelState: (state, action: PayloadAction<boolean>) => {
      state.intelligencePanelExpanded = action.payload;
    },
    setIntelligenceResponse: (state, action: PayloadAction<string | null>) => {
      state.intelligenceResponse = action.payload;
      state.intelligenceLoading = false;
    },
    setIntelligenceLoading: (state, action: PayloadAction<boolean>) => {
      state.intelligenceLoading = action.payload;
    },
    
    // Highlighting actions
    highlightHistogramBins: (state, action: PayloadAction<number[]>) => {
      state.highlightedElements.histogramBins = action.payload;
    },
    highlightIntervalCells: (state, action: PayloadAction<Array<{ day: string; hour: number }>>) => {
      state.highlightedElements.intervalCells = action.payload;
    },
    highlightCustomerSegments: (state, action: PayloadAction<string[]>) => {
      state.highlightedElements.customerSegments = action.payload;
    },
    highlightValueSegments: (state, action: PayloadAction<string[]>) => {
      state.highlightedElements.valueSegments = action.payload;
    },
    clearHighlights: (state) => {
      state.highlightedElements = {};
    },
    
    // Comparison actions
    setComparisonMode: (state, action: PayloadAction<boolean>) => {
      state.comparisonActive = action.payload;
    },
    setComparisonData: (state, action: PayloadAction<{
      period1: DateRange;
      period2: DateRange;
      label1: string;
      label2: string;
      histogramData1: HistogramData[];
      histogramData2: HistogramData[];
      kpiData1: KPIData;
      kpiData2: KPIData;
    }>) => {
      state.comparisonData = action.payload;
    },
    
    // Reset action
    resetView: (state, action: PayloadAction<string | undefined>) => {
      const component = action.payload;
      
      if (!component || component === 'all') {
        // Reset everything except the date range
        return {
          ...initialState,
          dateRange: state.dateRange
        };
      }
      
      // Reset specific component
      switch (component) {
        case 'histogram':
          state.highlightedElements.histogramBins = undefined;
          break;
        case 'heatmap':
          state.highlightedElements.intervalCells = undefined;
          break;
        case 'quadrant':
          state.highlightedElements.customerSegments = undefined;
          break;
        case 'treemap':
          state.highlightedElements.valueSegments = undefined;
          break;
        case 'regularity':
          // No specific highlight for regularity chart
          break;
      }
    }
  }
});

export const {
  setDateRange,
  setSelectedSegments,
  setFrequencyRange,
  setKPIData,
  setHistogramData,
  setIntervalData,
  setCustomerSegments,
  setRegularityData,
  setPreviousPeriodRegularity,
  setValueSegments,
  setRecommendations,
  setIsLoading,
  toggleIntelligencePanel,
  setIntelligencePanelState,
  setIntelligenceResponse,
  setIntelligenceLoading,
  highlightHistogramBins,
  highlightIntervalCells,
  highlightCustomerSegments,
  highlightValueSegments,
  clearHighlights,
  setComparisonMode,
  setComparisonData,
  resetView
} = purchaseFrequencySlice.actions;

export default purchaseFrequencySlice.reducer; 