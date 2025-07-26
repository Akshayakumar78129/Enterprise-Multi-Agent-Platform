import { Transaction, TransactionStats, TemporalHeatmap, ProductAssociation, DateRange } from '../types/transaction';
import { AnomalyData, AnomalyStats } from '../types/anomaly';

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
      // Using the new API path structure
      const response = await fetch(`/api/transaction-patterns/data?start=${dateRange.startDate}&end=${dateRange.endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction patterns:', error);
      throw error;
    }
  },
  
  // Fetch anomaly data
  async fetchAnomalyData(dateRange: DateRange): Promise<AnomalyResponse> {
    try {
      // Using the new API path structure
      const response = await fetch(`/api/transaction-patterns/anomalies?start=${dateRange.startDate}&end=${dateRange.endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch anomaly data');
      }
      
      return await response.json();
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