// Main regional sales data interface
export interface RegionalSalesData {
  country: string;
  state: string;
  totalSales: number;
  netSales: number;
  totalQuantity: number;
  grossProfit: number;
  customerCount: number;
  transactionCount: number;
  avgSalesAmount: number;
  firstSaleDate: string;
  lastSaleDate: string;
}

// Country-level aggregated data
export interface CountryLevelData {
  country: string;
  totalSales: number;
  netSales: number;
  totalQuantity: number;
  grossProfit: number;
  profitMargin: number;
  customerCount: number;
  transactionCount: number;
  stateCount: number;
}

// Time series data for temporal analysis
export interface TimeSeriesData {
  period: string;
  country: string;
  state: string;
  totalSales: number;
  netSales: number;
  totalQuantity: number;
  grossProfit: number;
  customerCount: number;
  transactionCount: number;
}

// Processed time series for visualization
export interface ProcessedTimeSeriesData {
  byPeriod: Array<{
    period: string;
    totalSales: number;
    totalQuantity: number;
    transactionCount: number;
    regionCount: number;
  }>;
  byRegion: Array<{
    country: string;
    state: string;
    data: Array<{
      period: string;
      totalSales: number;
      totalQuantity: number;
      transactionCount: number;
    }>;
  }>;
  summary: {
    totalPeriods: number;
    totalRegions: number;
    averageGrowth: number;
  };
}

// Regional KPI metrics
export interface RegionalKPIs {
  totalSales: number;
  countryCount: number;
  stateCount: number;
  customerCount: number;
  avgTransactionValue: number;
  growthRate: number | null;
  totalRevenue: number;
  totalTransactions: number;
  uniqueCountries: number;
  uniqueStates: number;
  concentrationRatio: number;
  growthOpportunities: number;
  avgRevenuePerRegion: number;
  topRegions: Array<{
    country: string;
    state: string;
    totalSales: number;
    profitMargin: number;
  }>;
}

// Opportunity analysis data
export interface OpportunityAnalysis {
  country: string;
  state: string;
  totalSales: number;
  grossProfit: number;
  customerCount: number;
  transactionCount: number;
  avgTransactionValue: number;
  opportunityCategory: 'Star Region' | 'Growth Opportunity' | 'Cash Cow' | 'Focus Area';
  salesVsAvg: number;
  customersVsAvg: number;
  profitMargin: number;
}

// Available regions for filtering
export interface AvailableRegion {
  country: string;
  state: string;
}

// Filter state interface
export interface FilterState {
  dateRange?: {
    start: string;
    end: string;
  };
  country?: string;
  state?: string;
  region?: string;
  aggregation?: 'day' | 'week' | 'month' | 'quarter';
  compareRegions?: string[];
}

// Dashboard state interface
export interface RegionalSalesAnalyzerDashboardState {
  regionalSalesData: RegionalSalesData[];
  countryLevelData: CountryLevelData[];
  timeSeriesData: ProcessedTimeSeriesData;
  kpis: RegionalKPIs;
  opportunityAnalysis: OpportunityAnalysis[];
  availableRegions: AvailableRegion[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
  selectedRegion: string | null;
  selectedCountry: string | null;
  metadata: {
    totalRegions: number;
    dateRange: {
      start: string;
      end: string;
    };
    appliedFilters: {
      country: string | null;
      state: string | null;
      aggregation: string;
    };
  };
}

// Component prop interfaces

export interface RegionalPerformanceMapProps {
  data: RegionalSalesData[];
  countryData: CountryLevelData[];
  selectedMetric?: 'totalSales' | 'profitMargin' | 'customerCount' | 'growthRate';
  selectedRegions?: string[];
  onRegionSelect?: (country: string, state: string) => void;
  onRegionHover?: (country: string, state: string) => void;
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  isLoading?: boolean;
}

export interface RegionalTimeSeriesExplorerProps {
  data: ProcessedTimeSeriesData;
  selectedRegions?: string[];
  dateRange?: { start: string; end: string };
  aggregation?: 'day' | 'week' | 'month' | 'quarter';
  onTimeRangeChange?: (range: { start: string; end: string }) => void;
  onRegionToggle?: (region: string) => void;
  onAggregationChange?: (aggregation: string) => void;
  isLoading?: boolean;
}

export interface RegionalComparisonMatrixProps {
  data: RegionalSalesData[];
  metrics?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (metric: string, direction: 'asc' | 'desc') => void;
  onRegionSelect?: (region: RegionalSalesData) => void;
  highlightedMetric?: string;
  isLoading?: boolean;
}

export interface RegionalGrowthOpportunityAnalyzerProps {
  data: OpportunityAnalysis[];
  selectedQuadrant?: string;
  onRegionSelect?: (region: OpportunityAnalysis) => void;
  onQuadrantFilter?: (quadrant: string) => void;
  xAxisMetric?: string;
  yAxisMetric?: string;
  bubbleSizeMetric?: string;
  isLoading?: boolean;
}

export interface RegionalKPITilesProps {
  kpis: RegionalKPIs;
  isLoading?: boolean;
  comparisonPeriod?: 'previous_period' | 'year_over_year' | 'none';
  onKPIClick?: (kpiType: string) => void;
}

export interface RegionalHierarchyExplorerProps {
  data: RegionalSalesData[];
  currentLevel?: 'country' | 'state';
  selectedPath?: string[];
  metric?: 'totalSales' | 'profitMargin' | 'customerCount';
  onDrillDown?: (level: string, value: string) => void;
  onBreadcrumbClick?: (level: number) => void;
  isLoading?: boolean;
}

export interface RegionalPerformanceCalendarProps {
  data: TimeSeriesData[];
  selectedRegion?: { country: string; state: string };
  metric?: string;
  colorScale?: string[];
  onDateSelect?: (date: string) => void;
  onDateRangeSelect?: (startDate: string, endDate: string) => void;
  isLoading?: boolean;
}

// Function call interfaces for LLM integration
export interface RegionalSalesAnalyzerFunctionCall {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// Event interfaces for component communication
export interface RegionalSelectionEvent {
  country: string;
  state: string;
  data: RegionalSalesData;
  source: 'map' | 'table' | 'chart' | 'opportunity';
}

export interface MetricChangeEvent {
  metric: string;
  value: number;
  region: { country: string; state: string };
  previousValue?: number;
}

export interface FilterChangeEvent {
  filters: FilterState;
  source: 'user' | 'ai' | 'system';
}

// API response interfaces
export interface RegionalSalesAnalyzerAPIResponse {
  success: boolean;
  data: {
    regionalSalesData: RegionalSalesData[];
    countryLevelData: CountryLevelData[];
    timeSeriesData: ProcessedTimeSeriesData;
    kpis: RegionalKPIs;
    opportunityAnalysis: OpportunityAnalysis[];
    availableRegions: AvailableRegion[];
    metadata: {
      totalRegions: number;
      dateRange: { start: string; end: string };
      appliedFilters: {
        country: string | null;
        state: string | null;
        aggregation: string;
      };
    };
  };
  error?: string;
  message?: string;
} 