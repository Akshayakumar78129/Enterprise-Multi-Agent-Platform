import { useState, useEffect, useCallback } from 'react';
import { salesTrendsService, SalesTrendsData } from '../services/salesTrendsService';
import { SalesTrendsFilters } from '../context';

export function useSalesTrendsData(filters: SalesTrendsFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SalesTrendsData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await salesTrendsService.getDashboardData(filters);
      setData(result);
    } catch (err: any) {
      console.error('Error fetching sales trends data:', err);
      setError(err.message || 'Failed to load sales trends data');
      // Set empty data on error
      setData({
        kpiMetrics: {
          totalRevenue: 0,
          totalUnits: 0,
          avgOrderValue: 0,
          marginPercentage: 0,
          revenueGrowth: 0,
          transactionCount: 0
        },
        mainData: {
          timeSeries: [],
          seasonality: [],
          growthRates: [],
          topPerformers: []
        },
        insights: [],
        metadata: {
          filtersApplied: filters,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived data for easier component access
  const kpiMetrics = data?.kpiMetrics || {
    totalRevenue: 0,
    totalUnits: 0,
    avgOrderValue: 0,
    marginPercentage: 0,
    revenueGrowth: 0,
    transactionCount: 0
  };

  const timeSeries = data?.mainData?.timeSeries || [];
  const seasonality = data?.mainData?.seasonality || [];
  const growthRates = data?.mainData?.growthRates || [];
  const topPerformers = data?.mainData?.topPerformers || [];
  const insights = data?.insights || [];

  const hasNoData = !loading && (!data ||
    (timeSeries.length === 0 &&
     seasonality.length === 0 &&
     growthRates.length === 0));

  return {
    loading,
    error,
    data,
    kpiMetrics,
    timeSeries,
    seasonality,
    growthRates,
    topPerformers,
    insights,
    hasNoData,
    refetch: fetchData
  };
}
