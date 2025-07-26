export interface AnomalyData {
  transactionId: string;
  timestamp: string;
  value: number;
  hour: number;
  dayOfWeek: number;
  productsCount: number;
  paymentMethod: string;
  location: string;
  isAnomaly: boolean;
  anomalyScore?: number;
  anomalyReasons?: string[];
}

export interface AnomalyStats {
  anomalyRate: number;
  anomalyCount: number;
  totalTransactions: number;
  anomalyDistribution: {
    byHour: Record<number, number>;
    byDay: Record<number, number>;
    byPaymentMethod: Record<string, number>;
    byValue: {
      low: number;
      medium: number;
      high: number;
    };
  };
} 