/**
 * Engagement Classifier Service
 * Handles all API calls for engagement classifier dashboard
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface EngagementFilters {
  startDate?: string;
  endDate?: string;
  engagementLevels?: string[];
  loyaltyStatus?: string[];
  customerSearch?: string;
  minTransactions?: number;
  minLTVAmount?: number;
  rfmScoreMin?: number;
  rfmScoreMax?: number;
}

export interface EngagementSummaryResponse {
  success: boolean;
  data: {
    customers: any[];
    kpis: {
      total_customers: number;
      avg_engagement_score: number;
      avg_days_since_activity: number;
      engagement_trend: string;
      reengagement_opportunities: number;
      engagement_distribution: {
        high: number;
        medium: number;
        low: number;
      };
    };
    distribution: any[];
    rfm_analysis: any[];
    opportunities: any[];
    timeline: any[];
    summary: {
      total_customers: number;
      high_engagement: number;
      medium_engagement: number;
      low_engagement: number;
      avg_purchase_value: number;
      avg_transaction_frequency: number;
    };
  };
  kpiMetrics?: {
    totalCustomers: number;
    highlyEngaged: number;
    atRiskCount: number;
    avgEngagementScore: number;
    engagementTrend: number;
  };
  engagementDistribution?: any[];
  customerClassification?: any[];
  engagementScore?: {
    current: number;
    previous: number;
    trend: string;
  };
  actionableInsights?: any[];
  mlResults?: any;
  timestamp: string;
  filters_applied: any;
}

class EngagementClassifierService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/engagement-classifier`;
  }

  /**
   * Get dashboard summary with all data
   */
  async getDashboardSummary(filters: EngagementFilters = {}): Promise<EngagementSummaryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard summary: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Get engagement distribution data
   */
  async getEngagementDistribution(filters: EngagementFilters = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch engagement distribution: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching engagement distribution:', error);
      throw error;
    }
  }

  /**
   * Get RFM analysis data
   */
  async getRFMAnalysis(filters: EngagementFilters = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/rfm-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RFM analysis: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching RFM analysis:', error);
      throw error;
    }
  }

  /**
   * Get re-engagement opportunities
   */
  async getReengagementOpportunities(filters: EngagementFilters = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch re-engagement opportunities: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching re-engagement opportunities:', error);
      throw error;
    }
  }

  /**
   * Get engagement timeline data
   */
  async getEngagementTimeline(filters: EngagementFilters = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch engagement timeline: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching engagement timeline:', error);
      throw error;
    }
  }

  /**
   * Search customers by name or number
   */
  async searchCustomers(searchTerm: string) {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search customers: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Get detailed analytics for a specific customer
   */
  async getCustomerAnalytics(customerKey: string) {
    try {
      const response = await fetch(`${this.baseUrl}/customer-analytics/${customerKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customer analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  }

  /**
   * Export data in CSV or JSON format
   */
  async exportData(filters: EngagementFilters = {}, format: 'csv' | 'json' = 'csv') {
    try {
      const response = await fetch(`${this.baseUrl}/export?format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Failed to export data: ${response.statusText}`);
      }

      // For file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engagement-data-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Backward compatibility methods
  async getEngagementAnalysis(filters: Record<string, any> = {}) {
    return this.getDashboardSummary(filters);
  }

  async getClassifications(filters: Record<string, any> = {}) {
    return this.getRFMAnalysis(filters);
  }
}

// Export singleton instance
export const engagementClassifierService = new EngagementClassifierService();