import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SalesPerformanceData {
  kpis: {
    totalRevenue: number;
    totalUnits: number;
    avgOrderValue: number;
    uniqueCustomers: number;
    revenueGrowth: number;
    conversionRate: number;
  };
  productPerformance: Array<{
    productName: string;
    category: string;
    revenue: number;
    unitsSold: number;
    avgPrice: number;
    marketShare: number;
  }>;
  regionPerformance: Array<{
    regionName: string;
    customerCount: number;
    revenue: number;
    units: number;
    avgTransactionValue: number;
    growthRate: number;
  }>;
  salesTrends: Array<{
    date: string;
    revenue: number;
    units: number;
    customers: number;
    transactions: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    productCount: number;
    revenue: number;
    units: number;
    avgPrice: number;
  }>;
  topCustomers: Array<{
    customerName: string;
    segment: string;
    purchaseDays: number;
    totalRevenue: number;
    totalUnits: number;
    avgOrderValue: number;
  }>;
}

export interface SalesFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  region?: string[];
  category?: string[];
  product?: string[];
  customer?: string[];
  segment?: string[];
}

class SalesPerformanceService {
  private baseUrl = `${API_URL}/api/sales-performance`;

  async getDashboardData(filters: SalesFilters = {}): Promise<SalesPerformanceData> {
    try {
      const params = new URLSearchParams();

      if (filters.dateRange) {
        params.append('dateRange_startDate', filters.dateRange.startDate);
        params.append('dateRange_endDate', filters.dateRange.endDate);
      }

      if (filters.region?.length) {
        filters.region.forEach(r => params.append('region', r));
      }

      if (filters.category?.length) {
        filters.category.forEach(c => params.append('category', c));
      }

      if (filters.product?.length) {
        filters.product.forEach(p => params.append('product', p));
      }

      if (filters.customer?.length) {
        filters.customer.forEach(c => params.append('customer', c));
      }

      if (filters.segment?.length) {
        filters.segment.forEach(s => params.append('segment', s));
      }

      const response = await axios.get(`${this.baseUrl}/dashboard?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sales performance data:', error);
      throw error;
    }
  }

  async getKPIs(filters: SalesFilters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.dateRange) {
        params.append('dateRange_startDate', filters.dateRange.startDate);
        params.append('dateRange_endDate', filters.dateRange.endDate);
      }

      const response = await axios.get(`${this.baseUrl}/kpis?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  async getProductPerformance(filters: SalesFilters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.dateRange) {
        params.append('dateRange_startDate', filters.dateRange.startDate);
        params.append('dateRange_endDate', filters.dateRange.endDate);
      }

      if (filters.category?.length) {
        filters.category.forEach(c => params.append('category', c));
      }

      const response = await axios.get(`${this.baseUrl}/products?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching product performance:', error);
      throw error;
    }
  }

  async getRegionalPerformance(filters: SalesFilters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.dateRange) {
        params.append('dateRange_startDate', filters.dateRange.startDate);
        params.append('dateRange_endDate', filters.dateRange.endDate);
      }

      if (filters.region?.length) {
        filters.region.forEach(r => params.append('region', r));
      }

      const response = await axios.get(`${this.baseUrl}/regions?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching regional performance:', error);
      throw error;
    }
  }

  async getSalesTrends(filters: SalesFilters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.dateRange) {
        params.append('dateRange_startDate', filters.dateRange.startDate);
        params.append('dateRange_endDate', filters.dateRange.endDate);
      }

      const response = await axios.get(`${this.baseUrl}/trends?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sales trends:', error);
      throw error;
    }
  }
}

export const salesPerformanceService = new SalesPerformanceService();