import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesTrendsService, SalesTrendsData } from '../services/salesTrendsService';
import { SalesTrendsFilters } from '../context';

export function useSalesTrendsData(filters: SalesTrendsFilters) {
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
    queryKey: ['sales-trends', filterParams],
    queryFn: () => salesTrendsService.getDashboardData(filterParams),
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
    marginPercentage: 0,
    revenueGrowth: 0,
    transactionCount: 0
  }, [data]);

  const timeSeries = useMemo(() => data?.mainData?.timeSeries || [], [data]);
  const seasonality = useMemo(() => data?.mainData?.seasonality || [], [data]);
  const growthRates = useMemo(() => data?.mainData?.growthRates || [], [data]);
  const topPerformers = useMemo(() => data?.mainData?.topPerformers || [], [data]);
  const insights = useMemo(() => data?.insights || [], [data]);

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
    refetch
  };
}
