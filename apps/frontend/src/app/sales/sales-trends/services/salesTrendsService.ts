import { SalesTrendsFilters } from '../context';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface SalesTrendKPIs {
  totalRevenue: number;
  totalUnits: number;
  avgOrderValue: number;
  marginPercentage: number;
  revenueGrowth: number;
  transactionCount: number;
}

export interface TimeSeriesDataPoint {
  period: string;
  revenue: number;
  units: number;
  orders: number;
  avgOrderValue: number;
  growthRate?: number;
  movingAverage?: number;
}

export interface SeasonalityDataPoint {
  year: string;
  month: string;
  revenue: number;
  period?: string;
}

export interface GrowthRateDataPoint {
  period: string;
  revenue: number;
  growthRate: number;
  avgGrowthRate?: number;
  minGrowthRate?: number;
  maxGrowthRate?: number;
}

export interface TopPerformerDataPoint {
  name: string;
  revenue: number;
  units: number;
  orders: number;
  marketShare: number;
  growthRate: number;
}

export interface SalesTrendsMainData {
  timeSeries: TimeSeriesDataPoint[];
  seasonality: SeasonalityDataPoint[];
  growthRates: GrowthRateDataPoint[];
  topPerformers: TopPerformerDataPoint[];
}

export interface SalesTrendsInsight {
  type: string;
  message: string;
  priority?: string;
}

export interface SalesTrendsData {
  kpiMetrics: SalesTrendKPIs;
  mainData: SalesTrendsMainData;
  insights: SalesTrendsInsight[];
  metadata: {
    filtersApplied: any;
    timestamp: string;
    recordCount?: number;
    dateRange?: {
      from: string;
      to: string;
    };
  };
}

export interface FilterOptions {
  customerCategories: string[];
  customerRegions: string[];
  itemNames: string[];
  granularities: string[];
  metrics: string[];
  dimensions: string[];
}

class SalesTrendsService {
  async getDashboardData(filters: SalesTrendsFilters): Promise<SalesTrendsData> {
    try {
      const response = await fetch(`${API_BASE_URL}/sales-trends/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching sales trends data:', error);
      throw error;
    }
  }

  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await fetch(`${API_BASE_URL}/sales-trends/filter-options`);

      if (!response.ok) {
        throw new Error(`Failed to fetch filter options: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Return empty options on error
      return {
        customerCategories: [],
        customerRegions: [],
        itemNames: [],
        granularities: ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
        metrics: ['revenue', 'units', 'aov', 'margin'],
        dimensions: ['product', 'category', 'region', 'customer']
      };
    }
  }

  async getKPIs(dateFrom: string, dateTo: string): Promise<SalesTrendKPIs> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sales-trends/kpis?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  async getTimeSeries(
    dateFrom: string,
    dateTo: string,
    granularity: string
  ): Promise<TimeSeriesDataPoint[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sales-trends/time-series?dateFrom=${dateFrom}&dateTo=${dateTo}&granularity=${granularity}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch time series: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching time series:', error);
      throw error;
    }
  }

  async getSeasonality(dateFrom: string, dateTo: string): Promise<SeasonalityDataPoint[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sales-trends/seasonality?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch seasonality: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching seasonality:', error);
      throw error;
    }
  }

  async getGrowthRates(
    dateFrom: string,
    dateTo: string,
    granularity: string
  ): Promise<GrowthRateDataPoint[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sales-trends/growth-rates?dateFrom=${dateFrom}&dateTo=${dateTo}&granularity=${granularity}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch growth rates: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching growth rates:', error);
      throw error;
    }
  }

  async getTopPerformers(
    dateFrom: string,
    dateTo: string,
    dimension: string,
    topN: number = 10
  ): Promise<TopPerformerDataPoint[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sales-trends/top-performers?dateFrom=${dateFrom}&dateTo=${dateTo}&dimension=${dimension}&topN=${topN}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch top performers: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching top performers:', error);
      throw error;
    }
  }
}

export const salesTrendsService = new SalesTrendsService();
