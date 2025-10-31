import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesPerformanceService, SalesPerformanceData } from '../services/salesPerformanceService';
import { SalesPerformanceFilters } from '../context';

export function useSalesPerformanceData(filters: SalesPerformanceFilters, dimension?: string, metric?: string) {
  // Prepare filter params for query key
  const filterParams = useMemo(() => ({
    ...filters,
    dimension,
    metric
  }), [filters, dimension, metric]);

  // Use React Query for caching and automatic refetching
  const {
    data: rawData,
    isLoading,
    error: queryError,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['sales-performance', filterParams],
    queryFn: () => salesPerformanceService.getDashboardData(filterParams),
    staleTime: 3 * 60 * 1000, // 3 minutes (matches backend cache)
    retry: 1,
  });

  const loading = isLoading || isFetching;
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch data") : null;

  // Normalize data
  const data = useMemo(() => rawData, [rawData]);

  // Derived data for easier component access
  const kpiMetrics = useMemo(() => data?.kpiMetrics || {
    totalRevenue: 0,
    totalUnits: 0,
    avgOrderValue: 0,
    uniqueCustomers: 0,
    revenueGrowth: 0,
    conversionRate: 0
  }, [data]);

  const salesOverview = useMemo(() => data?.mainData || null, [data]);
  const topProducts = useMemo(() => data?.mainData?.productPerformance || [], [data]);
  const teamPerformance = useMemo(() => data?.mainData?.regionPerformance || [], [data]);
  const revenueTrends = useMemo(() => data?.mainData?.salesTrends || [], [data]);
  const salesTargets = useMemo(() => data?.mainData?.categoryPerformance || [], [data]);
  const topCustomers = useMemo(() => data?.mainData?.topCustomers || [], [data]);
  const insights = useMemo(() => data?.insights || [], [data]);

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
    insights,
    hasNoData,
    refetch
  };
}