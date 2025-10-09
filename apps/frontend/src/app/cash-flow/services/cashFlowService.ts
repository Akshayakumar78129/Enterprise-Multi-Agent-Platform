import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface CashFlowData {
  kpiMetrics: {
    netCashFlow: number;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    cashRatio: number;
    freeCashFlow: number;
  };
  mainData: {
    trends: Array<{ date: string; operating: number; investing: number; financing: number; net: number }>;
    operating: Array<{ category: string; inflow: number; outflow: number; net: number }>;
    investing: Array<{ category: string; amount: number; type: string }>;
    financing: Array<{ category: string; amount: number; type: string }>;
    projection: Array<{ month: string; historical?: number | null; projected?: number | null; optimistic?: number | null; pessimistic?: number | null }>;
    transactions: Array<{ date: string; category: string; description: string; amount: number; type: string; flowDirection: string }>;
  };
  insights: any[];
  metadata: { filtersApplied: any; timestamp: string };
}

export interface CashFlowFilters {
  dateRange?: { startDate: string; endDate: string };
  cashFlowType?: string;
  departments?: string[];
  regions?: string[];
  minAmount?: number | null;
}

class CashFlowService {
  private baseUrl = `${API_BASE_URL}/cash-flow`;

  async getDashboardData(filters: CashFlowFilters = {}): Promise<CashFlowData> {
    try {
      const postFilters: any = {};

      if (filters.dateRange) {
        postFilters.dateFrom = filters.dateRange.startDate;
        postFilters.dateTo = filters.dateRange.endDate;
      }

      if (filters.cashFlowType) {
        postFilters.cashFlowType = filters.cashFlowType;
      }

      if (filters.departments?.length) {
        postFilters.departments = filters.departments;
      }

      if (filters.regions?.length) {
        postFilters.regions = filters.regions;
      }

      if (filters.minAmount !== null && filters.minAmount !== undefined) {
        postFilters.minAmount = filters.minAmount;
      }

      const response = await axios.post(`${this.baseUrl}/summary`, postFilters);
      return response.data;
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      throw error;
    }
  }
}

export const cashFlowService = new CashFlowService();
