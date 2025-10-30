import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { transactionPatternsService } from '../services/transactionPatternsService';

export function useTransactionPatternsData(filters: Record<string, any>) {
  // Memoize filter params to prevent unnecessary refetches
  const filterParams = useMemo(() => filters, [JSON.stringify(filters)]);

  // Use React Query with caching
  const {
    data,
    isLoading,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ['transaction-patterns', filterParams],
    queryFn: () => transactionPatternsService.getDashboardSummary(filterParams),
    staleTime: 5 * 60 * 1000,      // 5 minutes (matches backend cache TTL)
    gcTime: 10 * 60 * 1000,        // 10 minutes garbage collection
    retry: 1,
    refetchOnWindowFocus: false
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch data") : null;

  // Memoize processed data to prevent unnecessary re-renders
  const temporalPatterns = useMemo(() => ({
    heatmapData: data?.mainData?.distribution || [],
    timeSeries: data?.mainData?.timeSeries || []
  }), [data]);

  const productCombinations = useMemo(() => ({
    products: data?.mainData?.productMetrics || data?.mainData?.topMetrics || []
  }), [data]);

  const anomalyDetection = useMemo(() => ({
    amountDistribution: data?.mainData?.anomalyData || []  // Fixed: was using wrong key 'distribution'
  }), [data]);

  const paymentMethods = useMemo(() =>
    data?.mainData?.paymentMethods || {}, [data]
  );

  const kpiMetrics = useMemo(() =>
    data?.kpiMetrics || {}, [data]
  );

  const insights = useMemo(() =>
    data?.insights || [], [data]
  );

  const hasNoData = useMemo(() =>
    !data?.mainData || Object.keys(data?.mainData || {}).length === 0,
    [data]
  );

  return {
    loading: isLoading,
    error,
    isFetching,
    temporalPatterns,
    productCombinations,
    anomalyDetection,
    paymentMethods,
    kpiMetrics,
    insights,
    hasNoData
  };
}
