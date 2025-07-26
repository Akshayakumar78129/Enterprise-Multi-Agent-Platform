export interface Customer {
  customer_id: string;
  customer_type: string;
  status: string;
  region: string;
  industry: string;
  transaction_count: number;
  avg_order_value: number;
  total_spend: number;
  last_purchase_date: string;
  credit_limit: number;
  recency: number;
  segment: string | number;
}

export interface SegmentSummary {
  segment: string | number;
  count: number;
  avg_order_value: number;
  avg_recency: number;
  avg_total_spend: number;
  customer_types: string[];
  regions: string[];
}

export interface KPI {
  totalSegments: number;
  largestSegment: SegmentSummary;
  mostValuableSegment: SegmentSummary;
  avgSegmentSize: number;
}

export interface ScatterDatum {
  x: number;
  y: number;
  z: number;
  segment: string | number;
  customer_id: string;
}

// Main data interfaces
export interface CustomerSegmentData {
  customer_number: number;
  customer_name: string;
  rfm_rl_score: number;
  rfm_score: number;
  recency_band: string;
  frequency_band: string;
  monetary_band: string;
  relationship_band: string;
  lifetime_value: number;
  avg_order_value: number;
  transaction_count: number;
  days_since_last_activity: number;
  current_year_sales: number;
  loyalty_status: string;
  customer_type: string;
  state: string;
  country: string;
  segment_name: string;
  segment_id: number;
  x_coordinate: number;
  y_coordinate: number;
  segment_color: string;
}

// Segment distribution for cards and charts
export interface SegmentDistribution {
  segment_name: string;
  segment_id: number;
  customer_count: number;
  percentage: number;
  total_value: number;
  avg_customer_value: number;
  avg_rfm_score: number;
  avg_recency: number;
  segment_color: string;
}

// Segment comparison metrics
export interface SegmentComparison {
  segment_name: string;
  avg_order_value: number;
  avg_frequency: number;
  avg_lifetime_value: number;
  avg_recency_days: number;
  avg_loyalty_score: number;
  engagement_rate: number;
  segment_color: string;
}

// Segment attributes for heatmap
export interface SegmentAttributes {
  segments: string[];
  attributes: string[];
  values: number[][];
  colors: string[];
}

// KPI data structure
export interface SegmentationKPIs {
  total_segments: number;
  total_customers: number;
  segmentation_quality: number;
  largest_segment_percentage: number;
  most_valuable_segment: string;
  stability_percentage: number;
  segments_with_data: number;
  avg_customer_value: number;
  high_value_customers: number;
}

// Filter state interface
export interface SegmentationFilters {
  segmentNames?: string[];
  minRFMScore?: number;
  maxRFMScore?: number;
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  customerTypes?: string[];
  states?: string[];
  countries?: string[];
  loyaltyStatuses?: string[];
}

// Complete dashboard state
export interface CustomerSegmentationState {
  segmentData: CustomerSegmentData[];
  kpiData: SegmentationKPIs | null;
  segmentDistribution: SegmentDistribution[];
  segmentComparison: SegmentComparison[];
  segmentAttributes: SegmentAttributes | null;
  filters: SegmentationFilters;
  selectedSegments: string[];
  selectedCustomer: CustomerSegmentData | null;
  selectedMetric: string;
  showPercentageView: boolean;
  loading: boolean;
  error: string | null;
  highlightedCustomers: number[];
  focusRegion: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null;
  lastUpdated: string | null;
  dataQuality: {
    completeness: number;
    segmentsIdentified: boolean;
  };
}

// Component prop interfaces
export interface SegmentKPITilesProps {
  kpiData: SegmentationKPIs;
  loading?: boolean;
  className?: string;
}

export interface SegmentDistributionMapProps {
  data: CustomerSegmentData[];
  width?: number;
  height?: number;
  selectedSegments?: string[];
  selectedCustomer?: CustomerSegmentData | null;
  onSegmentFilter?: (segments: string[]) => void;
  onCustomerSelect?: (customer: CustomerSegmentData | null) => void;
  onDimensionChange?: (xDim: string, yDim: string) => void;
  highlightedCustomers?: number[];
  focusRegion?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  className?: string;
}

export interface SegmentProfileCardsProps {
  segmentDistribution: SegmentDistribution[];
  segmentComparison: SegmentComparison[];
  selectedSegment?: string | null;
  onSegmentSelect?: (segmentName: string) => void;
  onSegmentExport?: (segmentName: string) => void;
  onSegmentAnalyze?: (segmentName: string) => void;
  className?: string;
}

export interface SegmentMetricComparisonProps {
  data: SegmentComparison[];
  selectedMetric?: string;
  showPercentage?: boolean;
  sortBy?: 'name' | 'value';
  sortOrder?: 'asc' | 'desc';
  onMetricChange?: (metric: string) => void;
  onViewToggle?: (showPercentage: boolean) => void;
  onSortChange?: (sortBy: string, order: 'asc' | 'desc') => void;
  highlightedSegments?: string[];
  className?: string;
}

// Dashboard and view interfaces
export interface CustomerSegmentationDashboardProps {
  initialFilters?: SegmentationFilters;
  onFiltersChange?: (filters: SegmentationFilters) => void;
  className?: string;
}

// AI control interfaces for LLM function calls
export interface SegmentHighlightOptions {
  segmentNames: string[];
  explanation?: string;
  duration?: number;
}

export interface CustomerFilterOptions {
  rfmScoreRange?: [number, number];
  lifetimeValueRange?: [number, number];
  segmentCharacteristics?: {
    highValue?: boolean;
    atRisk?: boolean;
    loyal?: boolean;
    recent?: boolean;
  };
  explanation?: string;
}

export interface SegmentComparisonOptions {
  segments: string[];
  metrics: string[];
  showPercentage?: boolean;
  highlightDifferences?: boolean;
  explanation?: string;
}

// Marketing recommendation interfaces
export interface MarketingRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'retention' | 'acquisition' | 'upsell' | 'engagement';
  estimatedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  channels: string[];
  timeline: string;
}

export interface SegmentProfile {
  segment_name: string;
  segment_id: number;
  customer_count: number;
  percentage: number;
  characteristics: {
    avgLifetimeValue: number;
    avgOrderValue: number;
    avgFrequency: number;
    avgRecency: number;
    loyaltyScore: number;
    engagementRate: number;
  };
  keyBehaviors: string[];
  marketingRecommendations: MarketingRecommendation[];
  riskFactors?: string[];
  opportunities?: string[];
}

// Event interfaces for component interactions
export interface SegmentSelectionEvent {
  segmentName: string;
  segmentId: number;
  customerCount: number;
  action: 'select' | 'deselect' | 'toggle';
}

export interface CustomerSelectionEvent {
  customer: CustomerSegmentData;
  action: 'select' | 'deselect' | 'highlight';
  source: 'map' | 'table' | 'search';
}

export interface MetricChangeEvent {
  metric: string;
  previousMetric: string;
  showPercentage: boolean;
}

// Utility type for component refs
export interface SegmentationComponentRef {
  highlightSegments: (segments: string[], explanation?: string) => void;
  filterCustomers: (filters: CustomerFilterOptions) => void;
  compareSegments: (options: SegmentComparisonOptions) => void;
  resetView: () => void;
  exportData: (format: 'csv' | 'json' | 'excel') => void;
  focusOnRegion: (region: { xMin: number; xMax: number; yMin: number; yMax: number }) => void;
}

// Export all interfaces for easy importing
export type {
  CustomerSegmentData,
  SegmentDistribution,
  SegmentComparison,
  SegmentAttributes,
  SegmentationKPIs,
  SegmentationFilters,
  CustomerSegmentationState
}; 