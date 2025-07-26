// Time periods and metrics
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type Metric = 'revenue' | 'units' | 'aov' | 'margin';
export type Dimension = 'product' | 'category' | 'channel' | 'region' | 'customer' | null;

// Filter state interface
export interface FilterState {
  startDate: string;
  endDate: string;
  timePeriod: TimePeriod;
  metric: Metric;
  dimension: Dimension;
  topN?: number;
}

// Main data interfaces
export interface SalesDataPoint {
  period: string;
  revenue: number;
  units: number;
  orders: number;
  dimension_id?: string;
  dimension_name?: string;
}

export interface KPIData {
  total_revenue: number;
  total_units: number;
  total_orders: number;
  avg_order_value: number;
  margin_percentage: number;
}

export interface SeasonalityDataPoint {
  period: string;
  year: string;
  month: string;
  revenue: number;
}

export interface GrowthRateDataPoint {
  period: string;
  revenue: number;
  growth_rate: number;
  avg_growth_rate: number;
  min_growth_rate: number;
  max_growth_rate: number;
}

// API response interfaces
export interface APIMetadata {
  timePeriod: TimePeriod;
  metric: Metric;
  dimension: Dimension;
  startDate: string;
  endDate: string;
}

export interface APIResponse {
  success: boolean;
  data?: {
    mainData: SalesDataPoint[];
    kpis: KPIData;
    seasonality: SeasonalityDataPoint[];
    growthRates: GrowthRateDataPoint[];
    metadata: APIMetadata;
  };
  error?: string;
  message?: string;
}

// Component prop interfaces
export interface TimeSeriesExplorerProps {
  data: SalesDataPoint[];
  isLoading?: boolean;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onDataPointClick?: (point: SalesDataPoint) => void;
}

export interface SeasonalPatternAnalyzerProps {
  data: SeasonalityDataPoint[];
  isLoading?: boolean;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export interface GrowthRateVisualizerProps {
  data: GrowthRateDataPoint[];
  isLoading?: boolean;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export interface KPITileProps {
  data: KPIData;
  isLoading?: boolean;
  previousPeriodData?: KPIData;
}

// Dashboard state interface
export interface DashboardState {
  filters: FilterState;
  data: {
    mainData: SalesDataPoint[];
    kpis: KPIData;
    seasonality: SeasonalityDataPoint[];
    growthRates: GrowthRateDataPoint[];
  } | null;
  isLoading: boolean;
  error: string | null;
}

// Theme constants
export const THEME = {
  colors: {
    midnightNavy: '#0a1224',
    electricCyan: '#00e0ff',
    signalMagenta: '#e930ff',
    cloudWhite: '#f7f9fb',
    graphite: '#232a36',
    lightGraphite: '#3a4459'
  },
  dimensions: {
    timeSeriesExplorer: { width: 760, height: 480 },
    seasonalPatternAnalyzer: { width: 720, height: 460 },
    growthRateVisualizer: { width: 680, height: 420 }
  }
} as const; 