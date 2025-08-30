import { Transaction, TransactionStats, TemporalHeatmap, ProductAssociation, DateRange } from '../types/transaction';
import { AnomalyData, AnomalyStats } from '../types/anomaly';
import { callDashboardAPI } from '../../../../ui-common/utils/apiUtils.js';

// These types reflect the structure that would be returned from API calls
export interface TransactionPatternResponse {
  transactions: Transaction[];
  stats: TransactionStats;
  temporalHeatmap: TemporalHeatmap;
  productAssociations: ProductAssociation[];
}

export interface AnomalyResponse {
  anomalies: AnomalyData[];
  stats: AnomalyStats;
}

// API client for Transaction Patterns tool
export const transactionPatternApi = {
  // Fetch transaction pattern data
  async fetchTransactionPatterns(dateRange: DateRange): Promise<TransactionPatternResponse> {
    try {
      const payload = {
        dateRange: {
          start: dateRange.startDate,
          end: dateRange.endDate,
        },
      };
      
      return await callDashboardAPI('transaction-patterns', payload);
    } catch (error) {
      console.error('Error fetching transaction patterns:', error);
      throw error;
    }
  },
  
  // Fetch anomaly data (reuse the same data endpoint and extract anomalies)
  async fetchAnomalyData(dateRange: DateRange): Promise<AnomalyResponse> {
    try {
      const payload = {
        dateRange: {
          start: dateRange.startDate,
          end: dateRange.endDate,
        },
      };
      
      const full = await callDashboardAPI('transaction-patterns', payload);
      
      // The /data endpoint returns { success, data: { anomalies, ... }, ... }
      const anomalies = full?.anomalies ?? [];
      const stats = full?.kpis
        ? {
            anomalyRate: typeof full.kpis.anomalyRate === 'number' ? full.kpis.anomalyRate : 0,
            anomalyCount: Array.isArray(anomalies) ? anomalies.length : 0,
            totalTransactions: typeof full.kpis.totalTransactions === 'number' ? full.kpis.totalTransactions : 0,
            anomalyDistribution: { byHour: {}, byDay: {}, byPaymentMethod: {}, byValue: { low: 0, medium: 0, high: 0 } },
          } as AnomalyStats
        : ({} as AnomalyStats);

      return { anomalies, stats } as AnomalyResponse;
    } catch (error) {
      console.error('Error fetching anomaly data:', error);
      throw error;
    }
  },
  
  // Fetch details of a specific transaction
  async fetchTransactionDetails(transactionId: string): Promise<Transaction> {
    try {
      // Using the new API path structure
      const response = await fetch(`/api/transaction-patterns/transaction/${transactionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }
};

export default transactionPatternApi; 