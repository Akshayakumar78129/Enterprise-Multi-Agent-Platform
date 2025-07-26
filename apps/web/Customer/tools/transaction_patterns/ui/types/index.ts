// Main transaction data interface
export interface TransactionData {
  'Sales Txn Key': number;
  'Customer Key': number;
  'Item Key': number;
  'Item Number': string;
  'Txn Date': string;
  'Posting Time': number;
  'Sales Amount': number;
  'Sales Quantity': number;
  'Net Sales Amount': number;
  'Discount Reason': string;
  'Sales Txn Type': string;
  'Sales Txn Number': string;
  hour: number;
  day_of_week: number;
  date_only: string;
}

// KPI data interface
export interface TransactionKPIs {
  totalTransactions: number;
  anomalyRate: number;
  peakHour: number;
  topPaymentMethod: string;
  topPaymentPercentage: number;
  totalAmount: number;
  avgAmount: number;
  uniqueCustomers: number;
  uniqueItems: number;
  dateRange: {
    start: string;
    end: string;
  };
}

// Temporal heatmap data interface
export interface TemporalDataPoint {
  day: string;
  dayIndex: number;
  hour: number;
  transactionCount: number;
  totalAmount: number;
  avgAmount: number;
}

// Time series data interface
export interface TimeSeriesDataPoint {
  date: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  unique_customers: number;
  unique_items: number;
}

// Product association interface
export interface ProductAssociation {
  source: string;
  target: string;
  weight: number;
  confidence: number;
  sourceTotal: number;
  targetTotal: number;
}

// Anomaly data interface
export interface AnomalyData {
  id: number;
  customerKey: number;
  itemNumber: string;
  txnDate: string;
  salesAmount: number;
  salesQuantity: number;
  txnNumber: string;
  anomalyScore: number;
  anomalyLevel: 'Low' | 'Medium' | 'High';
  amountAnomalyScore: number;
  quantityAnomalyScore: number;
}

// Payment method distribution interface
export interface PaymentMethodData {
  payment_method: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  percentage: number;
}

// Daily volume distribution interface
export interface DailyVolumeData {
  day_of_week: number;
  day_name: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
}

// Filter state interface
export interface FilterState {
  dateRange?: {
    start: string;
    end: string;
  };
  customerKey?: number;
  anomalyLevel?: string[];
  paymentMethod?: string[];
  minAmount?: number;
  maxAmount?: number;
}

// Dashboard state interface
export interface DashboardState {
  transactions: TransactionData[];
  kpis: TransactionKPIs;
  temporalHeatmap: TemporalDataPoint[];
  timeSeriesData: TimeSeriesDataPoint[];
  productAssociations: ProductAssociation[];
  anomalies: AnomalyData[];
  paymentMethods: PaymentMethodData[];
  dailyVolume: DailyVolumeData[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
  selectedTransaction?: TransactionData;
  selectedAnomaly?: AnomalyData;
}

// Component props interfaces
export interface TransactionKPITilesProps {
  kpis: TransactionKPIs;
  isLoading?: boolean;
  onKPIClick?: (kpiType: string) => void;
}

export interface TemporalHeatmapProps {
  data: TemporalDataPoint[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onCellClick?: (day: string, hour: number) => void;
  highlightCells?: Array<{ day: string; hour: number }>;
  colorScale?: string[];
}

export interface DualAxisTimeSeriesProps {
  data: TimeSeriesDataPoint[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onDataPointClick?: (dataPoint: TimeSeriesDataPoint) => void;
  highlightDateRange?: { start: string; end: string };
}

export interface ProductAssociationNetworkProps {
  data: ProductAssociation[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onNodeClick?: (productId: string) => void;
  onEdgeClick?: (association: ProductAssociation) => void;
  highlightNodes?: string[];
  minConfidenceThreshold?: number;
}

export interface AnomalyScatterPlotProps {
  data: AnomalyData[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onAnomalyClick?: (anomaly: AnomalyData) => void;
  highlightAnomalies?: number[];
  filterLevel?: 'Low' | 'Medium' | 'High' | 'All';
}

export interface PaymentMethodChartProps {
  data: PaymentMethodData[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onSegmentClick?: (paymentMethod: string) => void;
  highlightMethods?: string[];
}

export interface DailyVolumeChartProps {
  data: DailyVolumeData[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onDayClick?: (day: string) => void;
  highlightDays?: string[];
}

export interface TransactionTableProps {
  data: TransactionData[];
  isLoading?: boolean;
  pageSize?: number;
  onRowClick?: (transaction: TransactionData) => void;
  onPageChange?: (page: number) => void;
  selectedRows?: number[];
  sortConfig?: {
    key: keyof TransactionData;
    direction: 'asc' | 'desc';
  };
}

// Control component props
export interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isLoading?: boolean;
  availablePaymentMethods?: string[];
  availableAnomalyLevels?: string[];
}

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
  minDate?: string;
  maxDate?: string;
  presets?: Array<{
    label: string;
    start: string;
    end: string;
  }>;
}

// AI interaction interfaces
export interface TransactionInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  relatedData?: {
    transactions?: number[];
    products?: string[];
    timeRange?: { start: string; end: string };
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relatedInsights?: string[];
  suggestedActions?: string[];
}

// API response interfaces
export interface TransactionPatternsAPIResponse {
  success: boolean;
  data: {
    transactions: TransactionData[];
    kpis: TransactionKPIs;
    temporalHeatmap: TemporalDataPoint[];
    timeSeriesData: TimeSeriesDataPoint[];
    productAssociations: ProductAssociation[];
    anomalies: AnomalyData[];
    paymentMethods: PaymentMethodData[];
    dailyVolume: DailyVolumeData[];
  };
  filters: FilterState;
  timestamp: string;
  error?: string;
}

// Event handler types
export type TransactionEventHandler = (transaction: TransactionData) => void;
export type AnomalyEventHandler = (anomaly: AnomalyData) => void;
export type FilterChangeHandler = (filters: FilterState) => void;
export type TimeRangeChangeHandler = (start: string, end: string) => void;

// Utility types
export type ChartDimensions = {
  width: number;
  height: number;
};

export type LoadingState = boolean;
export type ErrorState = string | null;

// Theme and styling interfaces
export interface ChartTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  highlightColor: string;
} 