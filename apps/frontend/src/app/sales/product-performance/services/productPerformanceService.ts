import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ProductPerformanceData {
  kpiMetrics: {
    totalRevenue: number;
    totalUnits: number;
    avgPrice: number;
    avgMargin: number;
    topCategory: {
      name: string;
      revenue: number;
    };
    totalProducts: number;
  };
  mainData: {
    topProducts: Array<{
      productName: string;
      category: string;
      revenue: number;
      unitsSold: number;
      avgPrice: number;
      margin: number;
      marginPercent: number;
    }>;
    categoryPerformance: Array<{
      category: string;
      productCount: number;
      revenue: number;
      unitsSold: number;
      avgPrice: number;
    }>;
    marginAnalysis: Array<{
      productName: string;
      category: string;
      revenue: number;
      unitsSold: number;
      totalMargin: number;
      marginPercent: number;
      avgPrice: number;
      avgCost: number;
    }>;
    priceBandDistribution: Array<{
      name: string;
      count: number;
      revenue: number;
    }>;
  };
  insights: string[];
  metadata: {
    dateFrom?: string;
    dateTo?: string;
    filtersApplied: any;
    timestamp: string;
  };
}

export interface ProductFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  categories?: string[];
  subcategories?: string[];
  products?: string[];
  priceBands?: string[];
  minMargin?: number;
  maxMargin?: number;
  minRevenue?: number;
  maxRevenue?: number;
  topN?: number;
}

class ProductPerformanceService {
  private baseUrl = `${API_BASE_URL}/product-performance`;

  async getDashboardData(filters: ProductFilters = {}): Promise<ProductPerformanceData> {
    try {
      // Convert to POST /summary format
      const postFilters: any = {};

      if (filters.dateRange) {
        postFilters.dateFrom = filters.dateRange.startDate;
        postFilters.dateTo = filters.dateRange.endDate;
      }

      if (filters.categories?.length) {
        postFilters.categories = filters.categories;
      }

      if (filters.products?.length) {
        postFilters.products = filters.products;
      }

      if (filters.priceBands?.length) {
        postFilters.priceBands = filters.priceBands;
      }

      if (filters.minMargin !== undefined) {
        postFilters.minMargin = filters.minMargin;
      }

      if (filters.maxMargin !== undefined) {
        postFilters.maxMargin = filters.maxMargin;
      }

      if (filters.minRevenue !== undefined) {
        postFilters.minRevenue = filters.minRevenue;
      }

      if (filters.maxRevenue !== undefined) {
        postFilters.maxRevenue = filters.maxRevenue;
      }

      if (filters.topN) {
        postFilters.topN = filters.topN;
      }

      const response = await axios.post(`${this.baseUrl}/summary`, postFilters);
      return response.data;
    } catch (error) {
      console.error('Error fetching product performance data:', error);
      throw error;
    }
  }
}

export const productPerformanceService = new ProductPerformanceService();
