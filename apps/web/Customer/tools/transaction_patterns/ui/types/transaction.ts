/**
 * Transaction data types for the Transaction Patterns UI
 */

export interface Transaction {
  id: string;
  customerId: string;
  timestamp: string;
  value: number;
  totalValue: number;
  products: string[];
  paymentMethod: string;
  location: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface TimeFilter {
  hour?: number;
  day?: string;
}

export interface DailyDistribution {
  day: string;
  count: number;
  percentage: number;
}

export interface HourlyDistribution {
  hour: number;
  count: number;
  percentage: number;
}

export interface PaymentMethodDistribution {
  method: string;
  count: number;
  percentage: number;
}

export interface ProductAssociation {
  sourceProduct: string;
  targetProduct: string;
  strength: number;
  count: number;
}

export interface TransactionStats {
  totalTransactions: number;
  startDate: string;
  endDate: string;
  anomalyRate: number;
  peakHours: { hour: number; count: number; percentage: number }[];
  dailyDistribution: { day: string; count: number; percentage: number }[];
  paymentDistribution: { method: string; count: number; percentage: number }[];
}

export interface TemporalHeatmap {
  hourlyMatrix: number[][];
  days: string[];
  hours: number[];
}

export interface TransactionState {
  transactions: Transaction[];
  stats: TransactionStats | null;
  temporalHeatmap: TemporalHeatmap | null;
  productAssociations: ProductAssociation[];
  dateRange: DateRange;
  selectedTimeFilter: TimeFilter | null;
  loading: boolean;
  error: string | null;
}

export interface Anomaly {
  transactionId: string;
  timestamp: string;
  value: number;
  hour: number;
  dayOfWeek: number;
  productsCount: number;
  paymentMethod: string;
  location: string;
  isAnomaly: boolean;
  anomalyScore: number;
}

export interface AnomalyStats {
  anomalyRate: number;
  anomalyCount: number;
  totalTransactions: number;
  anomalyDistribution: {
    byHour: Record<string, number>;
    byDay: Record<string, number>;
    byPaymentMethod: Record<string, number>;
    byValue: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

export interface AnomalyState {
  anomalies: Anomaly[];
  stats: AnomalyStats | null;
  selectedAnomaly: Anomaly | null;
  loading: boolean;
  error: string | null;
}

export interface SQLiteTransactionData {
  transactions: Transaction[];
  stats: TransactionStats;
  temporalHeatmap: TemporalHeatmap;
  productAssociations: ProductAssociation[];
} 