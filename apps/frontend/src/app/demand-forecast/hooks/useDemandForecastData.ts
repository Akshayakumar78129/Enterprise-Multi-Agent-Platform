import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

async function fetchDemandForecastSummary(filterParams: Record<string, any>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(
    `${apiUrl}/demand-forecast/summary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filterParams),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch demand forecast summary: ${response.statusText}`);
  }

  return response.json();
}

export function useDemandforecastData(filters: Record<string, any>) {
  // Build filter params
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {};

    // Always use dateRange
    if (filters?.dateRange?.startDate && filters?.dateRange?.endDate) {
      params.dateFrom = filters.dateRange.startDate;
      params.dateTo = filters.dateRange.endDate;
    } else {
      // Default to full data range 2017-2021
      params.dateFrom = '2017-01-01';
      params.dateTo = '2021-12-31';
    }

    // Add other filters if present
    if (filters?.productCategories?.length > 0) {
      params.productCategories = filters.productCategories;
    }
    if (filters?.regions?.length > 0) {
      params.regions = filters.regions;
    }

    return params;
  }, [filters]);

  // Use React Query for data fetching with caching
  const {
    data: rawData,
    isLoading: loading,
    error: queryError,
    isFetching
  } = useQuery({
    queryKey: ['demand-forecast', filterParams],
    queryFn: () => fetchDemandForecastSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch data') : null;

  const hasNoData = useMemo(() => {
    return !rawData || !rawData.mainData;
  }, [rawData]);

  // Convert kpiMetrics object to array format for KPIRow component
  const kpiMetricsArray = useMemo(() => {
    const kpis = rawData?.kpiMetrics;
    if (!kpis) return [];

    return Object.entries(kpis).map(([key, value]: [string, any]) => ({
      id: key,
      label: value.label || key,
      value: value.value || 0,
      change: value.change || 0,
      trend: value.trend || 'neutral',
      status: value.status || 'normal'
    }));
  }, [rawData]);

  return {
    loading,
    error,
    data: rawData?.mainData || {},
    kpiMetrics: kpiMetricsArray,
    insights: rawData?.insights || [],
    hasNoData,
    isFetching,
  };
}