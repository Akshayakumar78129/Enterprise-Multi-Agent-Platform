// Main data interfaces for Customer Lifetime Value
export interface CustomerLTVData {
  customer_id: number;
  customer_name: string;
  customer_type: string;
  region: string;
  credit_limit: number;
  transaction_count: number;
  first_purchase_date: string;
  last_purchase_date: string;
  total_revenue: number;
  avg_transaction_value: number;
  unique_products: number;
  relationship_length_days: number;
  monthly_frequency: number;
  calculated_ltv: number;
  value_tier?: 'Low' | 'Medium' | 'High' | 'Premium';
}

// KPI data structure
export interface LTVKPIs {
  avg_ltv: number;
  median_ltv: number;
  min_ltv: number;
  max_ltv: number;
  total_customers: number;
  premium_customers: number;
  top_value_region: string;
  region_total_value: number;
  region_customer_count: number;
  top_region_percentage: number;
  total_ltv: number;
  avg_transaction_count: number;
  prediction_accuracy_score: number;
  model_confidence: 'Low' | 'Medium' | 'High';
  low_error_customers: number;
  medium_error_customers: number;
  high_error_customers: number;
}

// LTV Distribution data
export interface LTVDistributionData {
  value_range: string;
  customer_count: number;
  avg_ltv_in_range: number;
  min_ltv_in_range: number;
  max_ltv_in_range: number;
  percentage: number;
}

// Prediction accuracy data
export interface PredictionAccuracyData {
  customer_id: number;
  customer_name: string;
  actual_value: number;
  predicted_ltv: number;
  transaction_count: number;
  absolute_error: number;
  percentage_error: number;
  error_category: 'Low' | 'Medium' | 'High';
}

// Geographic value data
export interface GeographicValueData {
  region: string;
  customer_count: number;
  total_transactions: number;
  total_revenue: number;
  avg_transaction_value: number;
  avg_ltv: number;
}

// Value contribution data
export interface ValueContributionData {
  region: string;
  customer_count: number;
  region_ltv: number;
  customer_percentage: number;
  value_percentage: number;
}

// LTV over time data
export interface LTVOverTimeData {
  month: string;
  active_customers: number;
  monthly_revenue: number;
  cumulative_revenue: number;
  three_month_avg: number;
  avg_transaction_value: number;
  transaction_count: number;
  projected_ltv: number;
}

// Filter interfaces
export interface LTVFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  region?: string[];
  customerType?: string[];
  valueRange?: {
    min: number;
    max: number;
  };
  search?: string;
  limit?: number;
  offset?: number;
}

// Dashboard state
export interface LTVDashboardState {
  mainData: CustomerLTVData[];
  kpis: LTVKPIs;
  ltvDistribution: LTVDistributionData[];
  predictionAccuracy: PredictionAccuracyData[];
  geographicValue: GeographicValueData[];
  customerExplorer: CustomerLTVData[];
  valueContribution: ValueContributionData[];
  ltvOverTime: LTVOverTimeData[];
  filters: LTVFilters;
  isLoading: boolean;
  error: string | null;
  selectedCustomer: CustomerLTVData | null;
  highlightedRegions: string[];
  selectedValueTier: string | null;
}

// API Response interface
export interface LTVApiResponse {
  success: boolean;
  data: {
    mainData: CustomerLTVData[];
    kpis: LTVKPIs;
    ltvDistribution: LTVDistributionData[];
    predictionAccuracy: PredictionAccuracyData[];
    geographicValue: GeographicValueData[];
    customerExplorer: CustomerLTVData[];
    valueContribution: ValueContributionData[];
    ltvOverTime: LTVOverTimeData[];
    metadata: {
      totalCustomers: number;
      dataFetched: string;
      filtersApplied: LTVFilters;
      avgPredictionError: number;
      predictionAccuracyScore: number;
    };
  };
  error?: string;
  message?: string;
}

// Component Props Interfaces

// KPI Tiles Props
export interface LTVKPITilesProps {
  kpis: LTVKPIs | null;
  isLoading?: boolean;
  onTileClick?: (metric: string) => void;
}

// LTV Distribution Chart Props
export interface LTVDistributionProps {
  data: LTVDistributionData[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onBinClick?: (range: string) => void;
  highlightedRange?: string;
  showPercentage?: boolean;
}

// Prediction Accuracy Chart Props
export interface PredictionAccuracyProps {
  data: PredictionAccuracyData[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onPointClick?: (customer: PredictionAccuracyData) => void;
  highlightErrorCategory?: 'Low' | 'Medium' | 'High';
  showErrorBands?: boolean;
}

// Geographic Value Map Props
export interface GeographicValueMapProps {
  data: GeographicValueData[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onRegionClick?: (region: string) => void;
  highlightedRegions?: string[];
  valueMetric?: 'avg_ltv' | 'total_revenue' | 'customer_count';
  showNormalized?: boolean;
}

// Customer Value Explorer Props
export interface CustomerValueExplorerProps {
  data: CustomerLTVData[];
  isLoading?: boolean;
  onCustomerSelect?: (customer: CustomerLTVData) => void;
  selectedCustomer?: CustomerLTVData | null;
  sortBy?: keyof CustomerLTVData;
  sortDirection?: 'asc' | 'desc';
  pageSize?: number;
  currentPage?: number;
  onFilterChange?: (filters: Partial<LTVFilters>) => void;
}

// Value Contribution Chart Props
export interface ValueContributionProps {
  data: ValueContributionData[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  chartType?: 'bar' | 'pie' | 'scatter';
  onSegmentClick?: (region: string) => void;
  highlightedSegments?: string[];
}

// LTV Over Time Chart Props
export interface LTVOverTimeProps {
  data: LTVOverTimeData[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  showProjection?: boolean;
  timeHorizon?: number;
  onPointClick?: (dataPoint: LTVOverTimeData) => void;
  confidenceInterval?: boolean;
}

// Dashboard container props
export interface LTVDashboardProps {
  initialFilters?: Partial<LTVFilters>;
  onDataChange?: (data: LTVApiResponse['data']) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Event interfaces for interactions
export interface LTVInteractionEvent {
  type: 'customer_select' | 'region_highlight' | 'value_filter' | 'error_focus' | 'time_filter';
  payload: any;
  source: string;
}

// Chart configuration interfaces
export interface ChartColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  error: string;
  warning: string;
  success: string;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Model performance metrics
export interface ModelMetrics {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  r2: number; // R-squared
  mape: number; // Mean Absolute Percentage Error
  accuracy_score: number;
  confidence_level: 'Low' | 'Medium' | 'High';
}

// Feature importance data
export interface FeatureImportance {
  feature_name: string;
  importance_score: number;
  description: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
}

// Value optimization scenario
export interface ValueOptimizationScenario {
  scenario_name: string;
  target_customers: string[];
  intervention_type: string;
  investment_amount: number;
  expected_lift: number;
  roi_projection: number;
  risk_level: 'Low' | 'Medium' | 'High';
  implementation_timeline: number;
}

// Customer segmentation for LTV analysis
export interface LTVCustomerSegment {
  segment_id: string;
  segment_name: string;
  customer_count: number;
  avg_ltv: number;
  total_value: number;
  characteristics: string[];
  growth_potential: 'Low' | 'Medium' | 'High';
}

// Export all types
export type {
  CustomerLTVData,
  LTVKPIs,
  LTVDistributionData,
  PredictionAccuracyData,
  GeographicValueData,
  ValueContributionData,
  LTVOverTimeData,
  LTVFilters,
  LTVDashboardState,
  LTVApiResponse,
  LTVKPITilesProps,
  LTVDistributionProps,
  PredictionAccuracyProps,
  GeographicValueMapProps,
  CustomerValueExplorerProps,
  ValueContributionProps,
  LTVOverTimeProps,
  LTVDashboardProps,
  LTVInteractionEvent,
  ChartColors,
  ChartDimensions,
  ModelMetrics,
  FeatureImportance,
  ValueOptimizationScenario,
  LTVCustomerSegment
}; 