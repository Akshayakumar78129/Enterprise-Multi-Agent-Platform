export interface SalesData {
  // Define based on Spec_UI_SalesPerformanceAnalyzer.md
  id: string;
  dimension: string; // e.g., product, category, channel, region, customer, time
  metricValue: number;
  date?: string; // Added optional date field for time series data
  currentMetric?: string; // Added for multi-metric support
  metricLabel?: string; // Added for display purposes
  // Raw metrics from database
  revenue?: number;
  units_sold?: number;
  order_count?: number;
  cost_of_goods?: number;
  // Calculated metrics
  aov?: number; // Average Order Value
  margin?: number; // Gross Margin percentage
  // Add other relevant fields based on the spec
}

export interface SalesKpiData {
  // Define based on Spec_UI_SalesPerformanceAnalyzer.md section 4.4
  totalRevenue: { value: number; trend: number; direction: 'up' | 'down' | 'neutral' };
  averageOrderValue: { value: number; trend: number; direction: 'up' | 'down' | 'neutral' };
  totalUnitsSold: { value: number; trend: number; direction: 'up' | 'down' | 'neutral' };
  topPerformingRegion: { value: string; percentage: number };
  conversionRate: { value: number; trend: number; direction: 'up' | 'down' | 'neutral' };
}


export interface SalesPerformanceState {
  loading: boolean;
  error: string | null;
  data: SalesData[];
  // Specific chart data structures can be added later based on chosen visualizations
  // e.g., timeSeriesData: any[]; distributionData: any[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedDimension: string | null; // e.g., 'product', 'region'
  selectedMetric: string | null; // e.g., 'revenue', 'units'
  // Add other filter states as needed
  // e.g., selectedRegion: string | null; selectedChannel: string | null;
  analysisResult: SalesAnalysisResult | null; // Define SalesAnalysisResult if detailed analysis is performed
  // availableDimensions: string[]; // Could be fetched or static
  // availableMetrics: string[]; // Could be fetched or static
}

// Example for AnalysisResult - adapt as needed
export interface SalesAnalysisResult {
  status: 'success' | 'error' | 'loading';
  results?: {
    kpiData: SalesKpiData;
    chartData?: SalesData[];
    // other analysis outputs, e.g., for specific chart structures if needed
    // timeSeriesData?: any[]; 
    // distributionData?: any[];
  };
  message?: string;
}

export interface DimensionOption {
  value: string;
  label: string;
}

export interface MetricOption {
  value: string;
  label: string;
}

// Add other types as needed, e.g., for filter controls, specific chart data points, etc. 