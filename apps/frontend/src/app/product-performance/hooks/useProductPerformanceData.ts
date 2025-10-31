import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productPerformanceService, ProductFilters } from '../services/productPerformanceService';

export function useProductPerformanceData(filters: ProductFilters) {
  // Prepare filter params for query key
  const filterParams = useMemo(() => filters, [JSON.stringify(filters)]);

  // Use React Query for caching and automatic refetching
  const {
    data: rawData,
    isLoading,
    error: queryError,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['product-performance', filterParams],
    queryFn: () => productPerformanceService.getDashboardData(filterParams),
    staleTime: 3 * 60 * 1000, // 3 minutes (matches backend cache)
    retry: 1,
  });

  const loading = isLoading || isFetching;
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch data") : null;

  // Normalize data
  const data = useMemo(() => rawData, [rawData]);

  // Derived data for easier component access
  const kpiMetrics = useMemo(() => data?.kpiMetrics || {}, [data]);
  const topProducts = useMemo(() => data?.mainData?.topProducts || [], [data]);
  const categoryPerformance = useMemo(() => data?.mainData?.categoryPerformance || [], [data]);
  const marginAnalysis = useMemo(() => data?.mainData?.marginAnalysis || [], [data]);
  const priceBandDistribution = useMemo(() => data?.mainData?.priceBandDistribution || [], [data]);
  const insights = useMemo(() => data?.insights || [], [data]);
  const metadata = useMemo(() => data?.metadata || {}, [data]);

  const hasNoData = !loading && (!data?.mainData || Object.keys(data?.mainData || {}).length === 0);

  return {
    loading,
    error,
    data,
    kpiMetrics,
    topProducts,
    categoryPerformance,
    marginAnalysis,
    priceBandDistribution,
    insights,
    metadata,
    hasNoData,
    refetch
  };
}