import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { regionalSalesService, RegionalSalesData, RegionalSalesFilters } from '../services/regionalSalesService';

export function useRegionalSalesData(filters: RegionalSalesFilters) {
  // Build filter params - memoize to avoid unnecessary re-renders
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {};

    if (filters.dateFrom) {
      params.dateFrom = filters.dateFrom;
    }

    if (filters.dateTo) {
      params.dateTo = filters.dateTo;
    }

    // Only include non-empty array filters
    if (filters.countries && filters.countries.length > 0) {
      params.countries = filters.countries;
    }

    if (filters.states && filters.states.length > 0) {
      params.states = filters.states;
    }

    return params;
  }, [filters]);

  // Use React Query for data fetching with caching
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['regional-sales', filterParams],
    queryFn: () => regionalSalesService.getDashboardData(filterParams as RegionalSalesFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes - matches backend cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const error = queryError ? (queryError as Error).message : null;

  // Derived data for easier component access
  const kpiMetrics = data?.kpiMetrics || {
    totalSales: 0,
    netSales: 0,
    grossProfit: 0,
    profitMargin: 0,
    countryCount: 0,
    stateCount: 0,
    customerCount: 0,
    transactionCount: 0,
    avgTransactionValue: 0,
    growthRate: null
  };

  const regionalPerformance = data?.mainData?.regionalPerformance || [];
  const countryPerformance = data?.mainData?.countryPerformance || [];
  const timeSeries = data?.mainData?.timeSeries || [];
  const opportunities = data?.mainData?.opportunities || [];
  const topRegions = data?.mainData?.topRegions || [];

  const hasNoData = !loading && (!data ||
    (regionalPerformance.length === 0 &&
     timeSeries.length === 0));

  return {
    loading,
    error,
    data,
    kpiMetrics,
    regionalPerformance,
    countryPerformance,
    timeSeries,
    opportunities,
    topRegions,
    insights: data?.insights || [],
    metadata: data?.metadata,
    hasNoData,
    refetch
  };
}
