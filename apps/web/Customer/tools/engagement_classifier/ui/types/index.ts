// Customer engagement data interface
export interface CustomerEngagementData {
  "Customer Key": number;
  "Customer Number": number;
  "Customer Name": string;
  "Loyalty Status": string;
  "RFM Score": number;
  "Recency Band": string;
  "Frequency Band": string;
  "Monetary Band": string;
  "Days Since Last Activity": number;
  "Number Sales Txns": number;
  "Avg Sales Amount": number;
  "LTD Sales Amount": number;
  "Last Activity Date": string;
  "First Activity Date": string;
  engagement_level: 'High' | 'Medium' | 'Low';
  engagement_sort: number;
}

// KPI interface for dashboard tiles
export interface EngagementKPIs {
  total_customers: number;
  avg_engagement_score: number;
  avg_days_since_activity: number;
  engagement_trend: 'Improving' | 'Stable' | 'Declining';
  reengagement_opportunities: number;
  engagement_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  avg_purchase_value: number;
  avg_transaction_frequency: number;
}

// Engagement distribution data for pyramid visualization
export interface EngagementDistribution {
  engagement_level: 'High' | 'Medium' | 'Low';
  customer_count: number;
  avg_transactions: number;
  avg_purchase_value: number;
  avg_days_since_activity: number;
  avg_rfm_score: number;
  loyal_customers: number;
  total_ltd_sales: number;
  percentage: number;
}

// RFM analysis data
export interface RFMAnalysis {
  engagement_level: 'High' | 'Medium' | 'Low';
  "Recency Band": string;
  "Frequency Band": string;
  "Monetary Band": string;
  customer_count: number;
  avg_rfm_score: number;
}

// Re-engagement opportunities data
export interface ReengagementOpportunity {
  opportunity_type: string;
  value_tier: 'High' | 'Medium' | 'Low';
  reengagement_potential: 'High' | 'Medium' | 'Low';
  customer_count: number;
  avg_customer_value: number;
  avg_days_inactive: number;
}

// Timeline data for temporal analysis
export interface EngagementTimeline {
  time_period: string;
  engagement_level: 'High' | 'Medium' | 'Low';
  customer_count: number;
  sort_order: number;
}

// Filter and state interfaces
export interface EngagementFilterState {
  startDate?: string;
  endDate?: string;
  engagementLevels?: ('High' | 'Medium' | 'Low')[];
  loyaltyStatus?: string[];
  minRFMScore?: number;
  maxDaysSinceActivity?: number;
}

// Complete dashboard state
export interface EngagementDashboardState {
  customers: CustomerEngagementData[];
  kpis: EngagementKPIs;
  distribution: EngagementDistribution[];
  rfm_analysis: RFMAnalysis[];
  opportunities: ReengagementOpportunity[];
  timeline: EngagementTimeline[];
  filters: EngagementFilterState;
  isLoading: boolean;
  error: string | null;
  selectedEngagementLevel?: 'High' | 'Medium' | 'Low';
  viewMode: 'dashboard' | 'pyramid' | 'timeline' | 'opportunities';
}

// Component props interfaces
export interface EngagementKPITilesProps {
  kpis: EngagementKPIs;
  isLoading?: boolean;
  onTileClick?: (metric: string) => void;
}

export interface EngagementPyramidProps {
  distribution: EngagementDistribution[];
  isLoading?: boolean;
  onLevelClick?: (level: 'High' | 'Medium' | 'Low') => void;
  selectedLevel?: 'High' | 'Medium' | 'Low';
  showPercentages?: boolean;
}

export interface EngagementTimelineProps {
  timeline: EngagementTimeline[];
  isLoading?: boolean;
  onPeriodClick?: (period: string) => void;
  selectedPeriod?: string;
  aggregationLevel?: 'week' | 'month' | 'quarter';
}

export interface RFMAnalysisProps {
  rfmData: RFMAnalysis[];
  isLoading?: boolean;
  selectedEngagementLevel?: 'High' | 'Medium' | 'Low';
  onComponentClick?: (component: 'Recency' | 'Frequency' | 'Monetary') => void;
  visualizationMode?: 'radar' | 'bar';
}

export interface OpportunityFinderProps {
  opportunities: ReengagementOpportunity[];
  isLoading?: boolean;
  onOpportunitySelect?: (opportunity: ReengagementOpportunity) => void;
  valueThreshold?: number;
  potentialThreshold?: number;
  onThresholdChange?: (type: 'value' | 'potential', value: number) => void;
}

export interface EngagementFilterControlsProps {
  filters: EngagementFilterState;
  onFiltersChange: (filters: Partial<EngagementFilterState>) => void;
  isLoading?: boolean;
  onReset?: () => void;
}

// API response interface
export interface EngagementAPIResponse {
  success: boolean;
  data: {
    customers: CustomerEngagementData[];
    kpis: EngagementKPIs;
    distribution: EngagementDistribution[];
    rfm_analysis: RFMAnalysis[];
    opportunities: ReengagementOpportunity[];
    timeline: EngagementTimeline[];
    summary: {
      total_customers: number;
      high_engagement: number;
      medium_engagement: number;
      low_engagement: number;
      avg_purchase_value: number;
      avg_transaction_frequency: number;
    };
  };
  timestamp: string;
  filters_applied: EngagementFilterState;
  error?: string;
  message?: string;
}

// Chart data interfaces for visualizations
export interface PyramidChartData {
  level: 'High' | 'Medium' | 'Low';
  count: number;
  percentage: number;
  color: string;
  avgMetric: number;
  icon: string;
}

export interface TimelineChartData {
  period: string;
  high: number;
  medium: number;
  low: number;
  total: number;
  date?: string;
}

export interface RadarChartData {
  metric: string;
  high: number;
  medium: number;
  low: number;
  max: number;
}

// Action interfaces for campaign generation
export interface CampaignTarget {
  engagementLevels: ('High' | 'Medium' | 'Low')[];
  minValue?: number;
  maxDaysInactive?: number;
  loyaltyStatus?: string[];
  estimatedAudience: number;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  category: 'winback' | 'nurture' | 'loyalty';
  effectiveness: number;
  channels: ('email' | 'sms' | 'app')[];
  thumbnail?: string;
}

export interface CampaignPerformanceProjection {
  expectedLift: number;
  estimatedROI: number;
  benchmarkComparison: number;
  confidenceRating: number;
} 