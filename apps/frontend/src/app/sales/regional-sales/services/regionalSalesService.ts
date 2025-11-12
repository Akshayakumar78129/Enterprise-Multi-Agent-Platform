import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface RegionalSalesData {
  kpiMetrics: {
    totalSales: number;
    netSales: number;
    grossProfit: number;
    profitMargin: number;
    countryCount: number;
    stateCount: number;
    customerCount: number;
    transactionCount: number;
    avgTransactionValue: number;
    growthRate: number | null;
  };
  mainData: {
    regionalPerformance: Array<{
      country: string;
      state: string;
      totalSales: number;
      netSales: number;
      totalQuantity: number;
      grossProfit: number;
      profitMargin: number;
      customerCount: number;
      transactionCount: number;
      avgTransactionValue: number;
      firstSaleDate: string | null;
      lastSaleDate: string | null;
    }>;
    countryPerformance: Array<{
      country: string;
      totalSales: number;
      netSales: number;
      totalQuantity: number;
      grossProfit: number;
      profitMargin: number;
      customerCount: number;
      transactionCount: number;
      stateCount: number;
    }>;
    timeSeries: Array<{
      period: string;
      country: string;
      state: string;
      totalSales: number;
      netSales: number;
      totalQuantity: number;
      grossProfit: number;
      customerCount: number;
      transactionCount: number;
    }>;
    opportunities: Array<{
      country: string;
      state: string;
      totalSales: number;
      grossProfit: number;
      customerCount: number;
      transactionCount: number;
      avgTransactionValue: number;
      opportunityCategory: string;
      salesVsAvg: number;
      customersVsAvg: number;
      profitMargin: number;
    }>;
    topRegions: Array<{
      country: string;
      state: string;
      totalSales: number;
      profitMargin: number;
    }>;
  };
  insights: string[];  // Unified insights array (rule-based + AI)
  insights_metadata?: {
    total_count: number;
    rule_based_count: number;
    ai_count: number;
    insights_version: string;
  };
  metadata: {
    filtersApplied: any;
    timestamp: string;
    dateRange: {
      start: string;
      end: string;
    };
    totalRegions: number;
  };
}

export interface RegionalSalesFilters {
  dateFrom?: string;
  dateTo?: string;
  countries?: string[];
  states?: string[];
}

export interface FilterOptions {
  countries: string[];
  states: Array<{
    country: string;
    state: string;
  }>;
}

class RegionalSalesService {
  private baseUrl = `${API_BASE_URL}/regional-sales-analyzer`;

  async getDashboardData(filters: RegionalSalesFilters = {}): Promise<RegionalSalesData> {
    try {
      const postFilters: any = {};

      if (filters.dateFrom) {
        postFilters.dateFrom = filters.dateFrom;
      }

      if (filters.dateTo) {
        postFilters.dateTo = filters.dateTo;
      }

      if (filters.countries && filters.countries.length > 0) {
        postFilters.countries = filters.countries;
      }

      if (filters.states && filters.states.length > 0) {
        postFilters.states = filters.states;
      }

      const response = await axios.post(`${this.baseUrl}/summary`, postFilters);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await axios.get(`${this.baseUrl}/filter-options`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const regionalSalesService = new RegionalSalesService();
