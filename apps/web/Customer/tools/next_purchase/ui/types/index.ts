// Main data interfaces
export interface PurchaseRecord {
  'Customer Key': number;
  'Customer Name': string;
  'Txn Date': string;
  'Item Number': string;
  'Sales Amount': number;
  'Net Sales Quantity': number;
  product_category: string;
  purchase_sequence: number;
}

export interface PurchaseSequence {
  'Customer Key': number;
  'Txn Date': string;
  product_category: string;
  'Sales Amount': number;
  sequence_order: number;
  days_since_last: number;
}

export interface ProductAssociation {
  product_a: string;
  product_b: string;
  co_occurrence_count: number;
  association_strength: number;
}

export interface PredictionData {
  'Customer Key': number;
  total_purchases: number;
  avg_amount: number;
  unique_categories: number;
  days_since_last_purchase: number;
  prediction_probability: number;
  predicted_days_to_purchase: number;
  predicted_product: string;
}

// KPI interface
export interface NextPurchaseKPIs {
  totalCustomers: number;
  activeCustomers: number;
  avgDaysBetween: number;
  totalTransactions: number;
  avgCategoriesPerCustomer: number;
  predictionCoverage: number;
  modelAccuracy: number;
  topRecommendation: string;
  avgPurchaseWindow: number;
}

// Visualization data interfaces
export interface ConfidenceMatrixData {
  segment: string;
  predictions: Array<{
    product: string;
    confidence: number;
    count: number;
  }>;
}

export interface CustomerTimelineData {
  customerId: number;
  purchases: Array<{
    date: string;
    category: string;
    amount: number;
    sequenceOrder: number;
    daysSinceLast: number;
  }>;
}

export interface AffinityNetworkData {
  nodes: Array<{
    id: string;
    category: string;
    size: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    strength: number;
    count: number;
  }>;
}

export interface PurchaseTimingData {
  customerId: number;
  product: string;
  daysToPurchase: number;
  probability: number;
  confidence: {
    min: number;
    max: number;
  };
}

// Filter and state interfaces
export interface FilterState {
  dateRange?: { start: string; end: string };
  customerKey?: number;
  productCategory?: string[];
  confidenceThreshold?: number;
  timeWindow?: number;
}

export interface DashboardState {
  data: PurchaseRecord[];
  kpis: NextPurchaseKPIs;
  visualizationData: {
    confidenceMatrix: ConfidenceMatrixData[];
    customerTimeline: CustomerTimelineData[];
    affinityNetwork: AffinityNetworkData;
    purchaseTiming: PurchaseTimingData[];
  };
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
}

// Component prop interfaces
export interface NextPurchaseKPITilesProps {
  kpis: NextPurchaseKPIs;
  isLoading?: boolean;
}

export interface PredictionConfidenceMatrixProps {
  data: ConfidenceMatrixData[];
  isLoading?: boolean;
  onCellClick?: (segment: string, product: string) => void;
  highlightProduct?: string;
  timeframe?: '7days' | '30days' | '90days';
  onTimeframeChange?: (timeframe: string) => void;
}

export interface CustomerPurchaseJourneyProps {
  data: CustomerTimelineData[];
  isLoading?: boolean;
  selectedCustomer?: number;
  onCustomerChange?: (customerId: number) => void;
  onPurchaseClick?: (purchase: any) => void;
  showPredictions?: boolean;
}

export interface ProductAffinityNetworkProps {
  data: AffinityNetworkData;
  isLoading?: boolean;
  onNodeClick?: (nodeId: string) => void;
  highlightPath?: string[];
  filterStrength?: number;
}

export interface TimeToPurchasePredictorProps {
  data: PurchaseTimingData[];
  isLoading?: boolean;
  timeScale?: 'days' | 'weeks' | 'months';
  onTimeScaleChange?: (scale: string) => void;
  onProductClick?: (product: string) => void;
  selectedProducts?: string[];
}

export interface SegmentPredictionComparisonProps {
  data: any[];
  isLoading?: boolean;
  segments: string[];
  onSegmentToggle?: (segment: string) => void;
}

export interface PredictionTableProps {
  data: PredictionData[];
  isLoading?: boolean;
  onRowClick?: (prediction: PredictionData) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
} 