export interface AnomalyDataPoint {
  customerId: number;
  customerName: string;
  anomalyScore: number;
  severity: number; // 1-5 scale
  region: string;
  state: string;
  country: string;
  features: AnomalousFeature[];
  detectionDate: string;
  transactionCount: number;
  totalAmount: number;
  avgAmount: number;
  segment: string;
}

export interface AnomalousFeature {
  name: string;
  value: number;
  normalRange: [number, number];
  severity: number;
  zScore: number;
  contribution: number; // Percentage contribution to anomaly score
}

export interface SeverityDistribution {
  level: number;
  count: number;
  percentage: number;
  color: string;
}

export interface RegionAnomalyData {
  region: string;
  state: string;
  country: string;
  anomalyCount: number;
  totalCustomers: number;
  percentage: number;
  severity: number;
  topFeatures: string[];
}

export interface FeatureContribution {
  featureName: string;
  importance: number;
  normalMean: number;
  anomalousMean: number;
  normalStd: number;
  anomalousStd: number;
  separationIndex: number;
}

export interface AnomalyKPI {
  anomalyRate: number;
  anomalyRateTrend: number;
  highSeverityCount: number;
  topAnomalousFeature: string;
  meanAnomalyScore: number;
  meanAnomalyScoreTrend: number;
  newAnomalies24h: number;
}

export interface TemporalAnomalyData {
  date: string;
  anomalyCount: number;
  anomalyRate: number;
  avgSeverity: number;
  threshold: number;
}

export interface AnomalyInvestigation {
  id: string;
  customerId: number;
  anomalyId: string;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignee?: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  actions: string[];
}

export interface FilterState {
  severityLevels: number[];
  regions: string[];
  segments: string[];
  dateRange: {
    start: string;
    end: string;
  };
  features: string[];
  anomalyScoreRange: [number, number];
}

export interface DashboardState {
  anomalies: AnomalyDataPoint[];
  severityDistribution: SeverityDistribution[];
  regionData: RegionAnomalyData[];
  featureContributions: FeatureContribution[];
  kpis: AnomalyKPI;
  temporalData: TemporalAnomalyData[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
} 