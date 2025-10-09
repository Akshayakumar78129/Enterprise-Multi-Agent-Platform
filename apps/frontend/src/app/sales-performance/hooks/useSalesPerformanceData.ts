import { useState, useEffect, useCallback } from 'react';
import { salesPerformanceService, SalesPerformanceData } from '../services/salesPerformanceService';
import { SalesPerformanceFilters } from '../context';

export function useSalesPerformanceData(filters: SalesPerformanceFilters, dimension?: string, metric?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SalesPerformanceData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filtersWithDimensionMetric = {
        ...filters,
        dimension,
        metric
      };

      const result = await salesPerformanceService.getDashboardData(filtersWithDimensionMetric);
      setData(result);
    } catch (err: any) {
      console.error('Error fetching sales performance data:', err);
      setError(err.message || 'Failed to load sales performance data');
      // Set empty data on error
      setData({
        kpiMetrics: {
          totalRevenue: 0,
          totalUnits: 0,
          avgOrderValue: 0,
          uniqueCustomers: 0,
          revenueGrowth: 0,
          conversionRate: 0
        },
        mainData: {
          productPerformance: [],
          regionPerformance: [],
          salesTrends: [],
          categoryPerformance: [],
          topCustomers: []
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
  }, [filters, dimension, metric]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived data for easier component access
  const kpiMetrics = data?.kpiMetrics || {
    totalRevenue: 0,
    totalUnits: 0,
    avgOrderValue: 0,
    uniqueCustomers: 0,
    revenueGrowth: 0,
    conversionRate: 0
  };

  const salesOverview = data?.mainData || null;
  const topProducts = data?.mainData?.productPerformance || [];
  const teamPerformance = data?.mainData?.regionPerformance || [];
  const revenueTrends = data?.mainData?.salesTrends || [];
  const salesTargets = data?.mainData?.categoryPerformance || [];
  const topCustomers = data?.mainData?.topCustomers || [];

  const hasNoData = !loading && (!data ||
    (topProducts.length === 0 &&
     teamPerformance.length === 0 &&
     revenueTrends.length === 0));

  return {
    loading,
    error,
    data,
    kpiMetrics,
    salesOverview,
    topProducts,
    teamPerformance,
    revenueTrends,
    salesTargets,
    topCustomers,
    insights: data?.insights || [],
    hasNoData,
    refetch: fetchData
  };
}