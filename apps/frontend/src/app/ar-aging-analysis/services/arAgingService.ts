import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ARAgingData {
  kpiMetrics: {
    totalAR: {
      value: number;
      change: number;
      trend: string;
      status: string;
      formatted_value: string;
    };
    dso: {
      value: number;
      change: number;
      trend: string;
      status: string;
      formatted_value: string;
    };
    overdueAmount: {
      value: number;
      change: number;
      trend: string;
      status: string;
      formatted_value: string;
    };
    collectionEfficiency: {
      value: number;
      change: number;
      trend: string;
      status: string;
      formatted_value: string;
    };
    riskExposure: {
      value: number;
      change: number;
      trend: string;
      status: string;
      formatted_value: string;
    };
  };
  mainData: {
    agingBuckets: Array<{
      range: string;
      amount: number;
      npvAdjustedAmount: number;
      count: number;
      percentOfTotal: number;
      valueErosion: number;
      color: string;
    }>;
    customerInsights: Array<{
      customerId: string;
      customerName: string;
      outstandingAmount: number;
      daysPastDue: number;
      riskScore: number;
      clv: number;
      paymentRiskScore: number;
      profitability: number;
      collectionProbability: number;
      segment: string;
      region: string;
      customerType: string;
      creditLimit: number;
      rfmScore: number;
    }>;
    collectionForecast: Array<{
      date: string;
      predictedAmount: number;
      upperBound: number;
      lowerBound: number;
      confidence: number;
    }>;
    npvSummary: {
      totalValueErosion: number;
      dailyErosionRate: number;
      waccUsed: number;
      totalArBookValue: number;
      totalArNpvAdjusted: number;
      erosionPercentage: number;
    };
    agingTable: Array<{
      customerId: string;
      customerName: string;
      totalOutstanding: number;
      avgDaysOverdue: number;
      invoiceCount: number;
      region: string;
      customerType: string;
    }>;
  };
  insights: string[];
  metadata: {
    generated_at: string;
    filters_applied: any;
    total_customers: number;
    total_invoices: number;
  };
}

export interface ARAgingFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  customerType: string;
  region: string;
  segment: string;
}

class ARAgingService {
  private baseUrl = `${API_BASE_URL}/ar-aging`;

  async getDashboardData(filters: ARAgingFilters): Promise<ARAgingData> {
    try {
      // Convert to POST /summary format
      const postFilters: any = {
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate
      };

      // Only include non-"all" filters
      if (filters.customerType && filters.customerType !== 'all') {
        postFilters.customerType = filters.customerType;
      }

      if (filters.region && filters.region !== 'all') {
        postFilters.region = filters.region;
      }

      if (filters.segment && filters.segment !== 'all') {
        postFilters.segment = filters.segment;
      }

      const response = await axios.post(`${this.baseUrl}/summary`, postFilters);
      return response.data;
    } catch (error) {
      console.error('Error fetching AR aging data:', error);
      throw error;
    }
  }

  async getCustomerDetails(customerId: string, filters: ARAgingFilters): Promise<any> {
    try {
      const postFilters: any = {
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate
      };

      const response = await axios.post(`${this.baseUrl}/customer-details/${customerId}`, postFilters);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer details:', error);
      throw error;
    }
  }

  async getCollectionForecast(filters: ARAgingFilters): Promise<any> {
    try {
      const postFilters: any = {
        dateFrom: filters.dateRange.startDate,
        dateTo: filters.dateRange.endDate
      };

      const response = await axios.post(`${this.baseUrl}/forecast`, postFilters);
      return response.data;
    } catch (error) {
      console.error('Error fetching collection forecast:', error);
      throw error;
    }
  }
}

export const arAgingService = new ARAgingService();
