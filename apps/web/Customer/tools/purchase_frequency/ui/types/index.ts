// Type definitions for Purchase Frequency Analyzer

export interface PurchaseData {
  customer_id: string;
  total_purchases: number;
  avg_interval_days: number;
  first_purchase: string;
  last_purchase: string;
  total_spent: number;
  avg_transaction: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FrequencySegment {
  name: string;
  count: number;
  percentage: number;
  threshold: number;
}

export interface KPIData {
  total_customers: number;
  avg_purchase_frequency: number;
  avg_interval_days: number;
  active_customers_percentage: number;
  high_value_customers_percentage: number;
  previous_period_comparison?: {
    total_customers: number;
    avg_purchase_frequency: number;
    avg_interval_days: number;
    active_customers_percentage: number;
  };
}

export interface KPITileProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'percentage' | 'currency' | 'days';
  trend?: 'up' | 'down' | 'neutral';
  isCritical?: boolean;
  showSpark?: boolean;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export interface HighlightedElements {
  histogramBins: number[];
  intervalCells: Array<{day: string; hour: number}>;
  customerSegments: string[];
  valueSegments: string[];
  regularityAxes: string[];
}

export interface HistogramData {
  frequency: number;
  bin: number;
  count: number;
  percentage: number;
  segmentType?: 'high' | 'medium' | 'low';
}

export interface FrequencyHistogramProps {
  data: HistogramData[];
  meanFrequency: number;
  highThreshold: number;
  lowThreshold: number;
  width?: number;
  height?: number;
  colorScale?: string[];
  onBarClick?: (frequency: number) => void;
  onChartElementClick?: (clickData: any) => void;
  componentId?: string;
  highlightBins?: number[];
  focusRegion?: {start: number; end: number};
}

export interface IntervalData {
  day: string;
  hour: number;
  volume: number;
  avg_value: number;
}

export interface IntervalHeatmapProps {
  data: IntervalData[];
  dateRange: DateRange;
  width?: number;
  height?: number;
  colorScale?: string[];
  onCellClick?: (day: string, hour: number) => void;
  onChartElementClick?: (clickData: any) => void;
  componentId?: string;
  onDateRangeChange?: (newRange: DateRange) => void;
  highlightCells?: Array<{day: string; hour: number}>;
  focusRegion?: {
    startDay: string;
    endDay: string;
    startHour: number;
    endHour: number;
  };
}

export interface CustomerSegment {
  segment: string;
  frequency: number;
  recency: number;
  monetary: number;
  count: number;
  percentage: number;
  avg_value: number;
  id?: string;
}

export interface SegmentQuadrantProps {
  data: CustomerSegment[];
  width?: number;
  height?: number;
  onSegmentClick?: (segment: string) => void;
  onCustomerClick?: (customerId: string) => void;
  onChartElementClick?: (clickData: any) => void;
  componentId?: string;
  highlightSegments?: string[];
  focusRegion?: {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  };
}

export interface RegularityData {
  timeframe: string;
  regularity_score: number;
  description: string;
}

export interface RegularityChartProps {
  data: RegularityData[];
  previousPeriodData?: RegularityData[];
  width?: number;
  height?: number;
  showComparison?: boolean;
  onAxisClick?: (timeframe: string) => void;
  onChartElementClick?: (clickData: any) => void;
  componentId?: string;
}

export interface ValueSegment {
  segment: string;
  count: number;
  percentage: number;
  avgValue: number;
}

export interface ValueTreemapProps {
  data: ValueSegment[];
  width?: number;
  height?: number;
  onSegmentClick?: (segment: string) => void;
  onChartElementClick?: (clickData: any) => void;
  componentId?: string;
  highlightSegments?: string[];
}

export interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Array<{
    label: string;
    range: DateRange;
  }>;
  isLoading?: boolean;
}

export interface FilterControlProps {
  segments: string[];
  selectedSegments: string[];
  onChange: (segments: string[]) => void;
  isLoading?: boolean;
}

export interface PatternIntelligenceProps {
  isExpanded: boolean;
  onToggle: () => void;
  onQuery: (query: string) => void;
  response?: string;
  isLoading?: boolean;
  suggestedQueries?: string[];
}

export interface RecommendationCard {
  id: string;
  title: string;
  description: string;
  actionText: string;
  category: 'frequency' | 'value' | 'retention';
  priority: number;
}

// Function declaration type for LLM control
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: {
      [key: string]: {
        type: string;
        description: string;
        enum?: string[];
        items?: {
          type: string;
        };
      }
    };
    required?: string[];
  };
}

// Main data interfaces for Purchase Frequency Analyzer
export interface CustomerPurchaseData {
  'Customer Key': number;
  'Customer Name': string;
  total_purchases: number;
  first_purchase: string;
  last_purchase: string;
  total_spent: number;
  avg_transaction_value: number;
  days_span: number;
  avg_days_between: number | null;
  frequency_segment: 'One-time' | 'High Frequency' | 'Medium Frequency' | 'Low Frequency';
  value_segment: 'Premium' | 'Standard' | 'Budget' | 'Occasional';
  recency_status: 'Active' | 'Inactive';
}

// KPI data interface
export interface PurchaseFrequencyKPIs {
  totalCustomers: number;
  avgPurchaseFrequency: number;
  avgDaysBetween: number;
  activeCustomerPercentage: number;
  highValuePercentage: number;
  avgCustomerValue: number;
}

// Frequency distribution for histogram
export interface FrequencyDistribution {
  bin: string;
  count: number;
  percentage: string;
}

// Interval heatmap data
export interface IntervalHeatmapData {
  dayOfWeek: number;
  weekNumber: number;
  date: string;
  transactionCount: number;
  totalSales: number;
  avgTransactionValue: number;
}

// Customer segment data for quadrant visualization
export interface CustomerSegmentData {
  customerId: number;
  customerName: string;
  frequency: number;
  monetaryValue: number;
  recencyDays: number;
  segment: 'Champions' | 'Loyal' | 'Big Spenders' | 'At Risk' | 'Others';
  avgTransactionValue: number;
}

// Value segment data for treemap
export interface ValueSegmentData {
  segment: 'Premium' | 'Standard' | 'Budget' | 'Occasional';
  customerCount: number;
  avgValue: number;
  totalValue: number;
  avgPurchases: number;
  percentage: string;
}

// Filter interface
export interface PurchaseFrequencyFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  segments?: string[];
  frequencyRange?: {
    min: number;
    max: number;
  };
  valueRange?: {
    min: number;
    max: number;
  };
}

// Dashboard state interface
export interface PurchaseFrequencyState {
  mainData: CustomerPurchaseData[];
  kpis: PurchaseFrequencyKPIs;
  frequencyDistribution: FrequencyDistribution[];
  intervalHeatmap: IntervalHeatmapData[];
  customerSegments: CustomerSegmentData[];
  valueSegments: ValueSegmentData[];
  filters: PurchaseFrequencyFilters;
  isLoading: boolean;
  error: string | null;
  selectedCustomers: number[];
  selectedSegment: string | null;
}

// Component props interfaces
export interface KPITilesProps {
  kpis: PurchaseFrequencyKPIs;
  isLoading?: boolean;
  onKPIClick?: (kpiType: string) => void;
}

export interface FrequencyDistributionProps {
  data: FrequencyDistribution[];
  isLoading?: boolean;
  onBinClick?: (bin: string) => void;
  selectedBin?: string | null;
  width?: number;
  height?: number;
}

export interface IntervalHeatmapProps {
  data: IntervalHeatmapData[];
  isLoading?: boolean;
  onDateClick?: (date: string) => void;
  selectedDate?: string | null;
  width?: number;
  height?: number;
}

export interface CustomerSegmentQuadrantProps {
  data: CustomerSegmentData[];
  isLoading?: boolean;
  onCustomerClick?: (customerId: number) => void;
  onSegmentFilter?: (segment: string) => void;
  selectedCustomers?: number[];
  selectedSegment?: string | null;
  width?: number;
  height?: number;
}

export interface ValueSegmentTreemapProps {
  data: ValueSegmentData[];
  isLoading?: boolean;
  onSegmentClick?: (segment: string) => void;
  selectedSegment?: string | null;
  width?: number;
  height?: number;
}

export interface PurchaseRegularityRadarProps {
  data: CustomerPurchaseData[];
  isLoading?: boolean;
  comparisonData?: CustomerPurchaseData[];
  width?: number;
  height?: number;
}

// AI Interaction interfaces
export interface PurchaseFrequencyInsight {
  id: string;
  type: 'frequency' | 'value' | 'recency' | 'trend';
  title: string;
  description: string;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
  relatedCustomers?: number[];
  actionButton?: {
    label: string;
    action: string;
  };
}

export interface PatternIntelligencePanelProps {
  insights: PurchaseFrequencyInsight[];
  isLoading?: boolean;
  onQuerySubmit?: (query: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// API Response interface
export interface PurchaseFrequencyAPIResponse {
  success: boolean;
  data: {
    mainData: CustomerPurchaseData[];
    kpis: PurchaseFrequencyKPIs;
    frequencyDistribution: FrequencyDistribution[];
    intervalHeatmap: IntervalHeatmapData[];
    customerSegments: CustomerSegmentData[];
    valueSegments: ValueSegmentData[];
    metadata: {
      totalCustomers: number;
      activeCustomers: number;
      avgFrequency: number;
      dataUpdated: string;
      filters: PurchaseFrequencyFilters;
    };
  };
  error?: string;
  message?: string;
}

// Function call interfaces for LLM integration
export interface HighlightCustomerParams {
  customerId: number | number[];
  explanation?: string;
}

export interface FilterBySegmentParams {
  segment: string | string[];
  explanation?: string;
}

export interface ComparePeriodsParams {
  startPeriod: { start: string; end: string };
  endPeriod: { start: string; end: string };
  metric?: 'frequency' | 'value' | 'recency';
}

export interface AnalyzeFrequencyParams {
  frequencyBin?: string;
  includeRecommendations?: boolean;
}

export interface FocusDateRangeParams {
  startDate: string;
  endDate: string;
  explanation?: string;
} 