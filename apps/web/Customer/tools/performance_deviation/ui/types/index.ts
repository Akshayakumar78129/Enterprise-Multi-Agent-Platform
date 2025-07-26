// Main data interfaces for performance deviation analysis

export interface KPIDataPoint {
  date: string;
  function: 'sales' | 'customer' | 'finance';
  kpi_name: string;
  value: number;
  transaction_count: number;
  avg_value: number;
}

export interface ExternalFactor {
  date: string;
  is_weekend: number;
  is_holiday: number;
  season: 'winter' | 'spring' | 'summer' | 'fall';
  market_condition: 'stable' | 'growing' | 'declining';
  competitor_activity_level: number;
  economic_index: number;
  promotional_activity: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface VarianceDecomposition {
  total: number;
  explained: number;
  unexplained: number;
}

export interface ModelMetrics {
  r_squared: number;
  mean_absolute_error: number;
  root_mean_squared_error: number;
}

export interface KPIAnalysisResult {
  actual_values: number[];
  predictions: number[];
  deviations: number[];
  feature_importance: FeatureImportance[];
  variance_decomposition: VarianceDecomposition;
  model_metrics: ModelMetrics;
}

export interface AnalysisResults {
  [kpiName: string]: KPIAnalysisResult;
}

// Performance deviation KPIs
export interface PerformanceDeviationKPIs {
  averageDeviation: number;
  explanationPower: number;
  anomalyCount: number;
  topFactor: string;
  forecastTrend: 'improving' | 'declining' | 'stable';
  totalDataPoints: number;
  avgDailyRevenue: number;
}

// Visualization data interfaces
export interface TimeSeriesDataPoint {
  date: string;
  actual: number;
  predicted?: number;
  deviation?: number;
  function: string;
}

export interface TimeSeriesData {
  [kpiName: string]: TimeSeriesDataPoint[];
}

export interface FeatureImportanceVisualizationData {
  aggregated: {
    feature: string;
    total_importance: number;
    kpi_count: number;
    avg_importance: number;
    kpi_details: { [kpiName: string]: number };
  }[];
  byKPI: AnalysisResults;
}

export interface VarianceVisualizationData {
  [kpiName: string]: {
    total_variance: number;
    explained_variance: number;
    unexplained_variance: number;
    explanation_power: number;
    model_accuracy: number;
    mean_absolute_error: number;
    rmse: number;
  };
}

export interface DeviationPattern {
  date: string;
  deviation_magnitude: number;
  is_significant: boolean;
  pattern_type: 'normal' | 'positive_anomaly' | 'negative_anomaly';
  day_of_week: number;
  month: number;
  year: number;
}

export interface PatternCalendarDay {
  date: string;
  magnitude: number;
  isSignificant: boolean;
  type: string;
  day: number;
}

export interface MonthlyPatternStats {
  totalDeviations: number;
  significantDeviations: number;
  averageMagnitude: number;
  positiveAnomalies: number;
  negativeAnomalies: number;
}

export interface PatternVisualizationData {
  calendar: {
    [year: number]: {
      [month: number]: PatternCalendarDay[];
    };
  };
  monthlyStats: { [monthKey: string]: MonthlyPatternStats };
  patterns: DeviationPattern[];
}

export interface BusinessFunctionMetric {
  kpi: string;
  modelAccuracy: number;
  explanationPower: number;
  avgDeviation: number;
}

export interface RadarVisualizationData {
  [functionName: string]: {
    name: string;
    metrics: BusinessFunctionMetric[];
  };
}

export interface FactorCorrelation {
  factor: string;
  kpi: string;
  correlation: number;
  is_significant: boolean;
  p_value: number;
}

export interface CorrelationMatrixData {
  matrix: { [factor: string]: number }[];
  factors: string[];
  kpis: string[];
  significantCorrelations: {
    factor: string;
    kpi: string;
    correlation: number;
    pValue: number;
  }[];
}

// Component prop interfaces
export interface PerformanceExplorerProps {
  data: TimeSeriesData;
  selectedKPIs?: string[];
  onKPISelect?: (kpis: string[]) => void;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  isLoading?: boolean;
}

export interface FeatureImportanceProps {
  data: FeatureImportanceVisualizationData;
  selectedKPI?: string;
  onFeatureSelect?: (feature: string) => void;
  significanceThreshold?: number;
  isLoading?: boolean;
}

export interface VarianceDecompositionProps {
  data: VarianceVisualizationData;
  selectedKPI?: string;
  onKPISelect?: (kpi: string) => void;
  showComparison?: boolean;
  isLoading?: boolean;
}

export interface DeviationPatternProps {
  data: PatternVisualizationData;
  selectedYear?: number;
  onYearSelect?: (year: number) => void;
  significanceThreshold?: number;
  onThresholdChange?: (threshold: number) => void;
  isLoading?: boolean;
}

export interface BusinessFunctionComparisonProps {
  data: RadarVisualizationData;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  showBenchmark?: boolean;
  isLoading?: boolean;
}

export interface FactorCorrelationMatrixProps {
  data: CorrelationMatrixData;
  onCellClick?: (factor: string, kpi: string, correlation: number) => void;
  showSignificantOnly?: boolean;
  colorScale?: string[];
  isLoading?: boolean;
}

export interface PerformanceKPITilesProps {
  kpis: PerformanceDeviationKPIs;
  isLoading?: boolean;
}

// Filter and state interfaces
export interface PerformanceFilters {
  startDate?: string;
  endDate?: string;
  businessFunctions?: string[];
  significanceThreshold?: number;
  selectedKPIs?: string[];
}

export interface DashboardState {
  data: {
    kpiData: KPIDataPoint[];
    analysisResults: AnalysisResults;
    externalFactors: ExternalFactor[];
    summaryMetrics: any;
  };
  visualizationData: {
    performanceExplorer: TimeSeriesData;
    featureImportance: FeatureImportanceVisualizationData;
    varianceDecomposition: VarianceVisualizationData;
    deviationPatterns: PatternVisualizationData;
    businessFunctionComparison: RadarVisualizationData;
    factorCorrelations: CorrelationMatrixData;
  };
  kpis: PerformanceDeviationKPIs;
  filters: PerformanceFilters;
  selectedKPI: string | null;
  selectedTimeRange: { start: string; end: string } | null;
  isLoading: boolean;
  error: string | null;
}

// Insight and recommendation interfaces
export interface PerformanceInsight {
  id: string;
  type: 'investigation' | 'action' | 'pattern' | 'opportunity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  relatedKPIs: string[];
  relatedFactors: string[];
  suggestedActions?: string[];
  expectedImpact?: {
    metric: string;
    estimatedChange: number;
    confidence: number;
  };
}

export interface RecommendationCard {
  id: string;
  type: 'investigation' | 'action' | 'pattern' | 'opportunity';
  header: string;
  description: string;
  impact: {
    metric: string;
    expectedImprovement: number;
    confidence: number;
  };
  evidence: {
    chartData?: any;
    bulletPoints: string[];
    analysisLink?: string;
  };
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed';
}

// API response interfaces
export interface PerformanceDeviationAPIResponse {
  success: boolean;
  data: {
    kpiData: KPIDataPoint[];
    analysisResults: AnalysisResults;
    externalFactors: ExternalFactor[];
    summaryMetrics: any;
    kpis: PerformanceDeviationKPIs;
    visualizationData: {
      performanceExplorer: TimeSeriesData;
      featureImportance: FeatureImportanceVisualizationData;
      varianceDecomposition: VarianceVisualizationData;
      deviationPatterns: PatternVisualizationData;
      businessFunctionComparison: RadarVisualizationData;
      factorCorrelations: CorrelationMatrixData;
    };
    metadata: {
      totalDataPoints: number;
      dateRange: { start: string; end: string };
      businessFunctions: string[];
      lastUpdated: string;
    };
  };
  error?: string;
} 