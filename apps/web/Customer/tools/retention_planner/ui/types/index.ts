// Main customer data interface
export interface CustomerData {
  "Customer Key": number;
  "Customer Number": number;
  "Customer Name": string;
  "Customer City": string;
  "Customer State/Prov": string;
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
  "At Risk Customer Count": number;
  "Lost Customer Count": number;
  churn_indicator: number;
  customer_value: 'High' | 'Medium' | 'Low';
  churn_cause: 'Inactive' | 'At Risk' | 'Engaged';
}

// KPI interface
export interface RetentionKPIs {
  totalCustomers: number;
  highRiskCount: number;
  highRiskPercentage: number;
  avgChurnRisk: number;
  avgRfmScore: number;
  totalValue: number;
  actionCount: number;
  expectedEffectiveness: number;
  totalROI: number;
}

// Visualization data interfaces
export interface ChurnRiskDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface ValueRiskPoint {
  id: number;
  name: string;
  value: 'High' | 'Medium' | 'Low';
  risk: number;
  recency: number;
}

export interface ValueRiskMatrix {
  highValueLowRisk: ValueRiskPoint[];
  highValueHighRisk: ValueRiskPoint[];
  lowValueLowRisk: ValueRiskPoint[];
  lowValueHighRisk: ValueRiskPoint[];
}

export interface ActionAllocationNode {
  id: string;
  type: 'segment' | 'action';
}

export interface ActionAllocationLink {
  source: string;
  target: string;
  value: number;
  effectiveness: number;
}

export interface ActionAllocation {
  nodes: ActionAllocationNode[];
  links: ActionAllocationLink[];
}

export interface ROIProjectionItem {
  action: string;
  customer_count: number;
  total_cost: number;
  total_benefit: number;
  roi_percentage: number;
  expected_effectiveness: number;
}

export interface RetentionAction {
  action: string;
  count: number;
  avg_effectiveness: number;
}

export interface SegmentCause {
  customer_count: number;
  avg_churn_risk: number;
  recommended_actions: RetentionAction[];
}

export interface SegmentPlaybook {
  [segment: string]: {
    [cause: string]: SegmentCause;
  };
}

// Filter and state interfaces
export interface RetentionFilters {
  customer_segments?: string[];
  churn_risk_threshold?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface RetentionDashboardState {
  customerData: CustomerData[];
  kpis: RetentionKPIs;
  visualizations: {
    churnRiskDistribution: ChurnRiskDistribution[];
    valueRiskMatrix: ValueRiskMatrix;
    actionAllocation: ActionAllocation;
    roiProjection: ROIProjectionItem[];
  };
  segmentPlaybooks: SegmentPlaybook;
  retentionActions: any[];
  filters: RetentionFilters;
  isLoading: boolean;
  error: string | null;
}

// Component props interfaces
export interface RetentionKPITilesProps {
  kpis: RetentionKPIs;
  isLoading?: boolean;
}

export interface ChurnRiskGaugeProps {
  data: ChurnRiskDistribution[];
  avgRisk: number;
  threshold?: number;
  isLoading?: boolean;
  onThresholdChange?: (threshold: number) => void;
}

export interface ValueRiskMatrixProps {
  data: ValueRiskMatrix;
  isLoading?: boolean;
  onQuadrantClick?: (quadrant: string) => void;
  onCustomerClick?: (customerId: number) => void;
}

export interface ActionSankeyProps {
  data: ActionAllocation;
  isLoading?: boolean;
  onSegmentClick?: (segment: string) => void;
  onActionClick?: (action: string) => void;
}

export interface ROIWaterfallProps {
  data: ROIProjectionItem[];
  isLoading?: boolean;
  onActionClick?: (action: string) => void;
}

export interface SegmentPlaybookCardsProps {
  playbooks: SegmentPlaybook;
  isLoading?: boolean;
  onActionClick?: (segment: string, cause: string, action: string) => void;
}

export interface RetentionFilterPanelProps {
  filters: RetentionFilters;
  onFiltersChange: (filters: RetentionFilters) => void;
  availableSegments: string[];
}

// AI interaction interfaces
export interface RetentionHighlightConfig {
  highlightCustomers?: number[];
  highlightQuadrant?: string;
  highlightAction?: string;
  explanation?: string;
}

export interface RetentionControlRefs {
  highlightCustomer: (customerId: number, explanation?: string) => void;
  highlightQuadrant: (quadrant: string, explanation?: string) => void;
  filterBySegment: (segments: string[]) => void;
  filterByRisk: (threshold: number) => void;
  compareActions: (actions: string[], explanation?: string) => void;
  explainSegment: (segment: string) => void;
  resetView: () => void;
} 