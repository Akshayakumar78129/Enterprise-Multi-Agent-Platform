import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface RevenueForecastFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  companyCode: string;
  segments: string[];
  products: string[];
  regions: string[];
  customerTypes: string[];
  forecastHorizon: number;
  confidenceLevel: number;
  scenario: string;
}

async function fetchRevenueForecastSummary(filterParams: Record<string, any>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(`${apiUrl}/revenue-forecast/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filterParams),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch revenue forecast data: ${response.statusText}`);
  }

  return response.json();
}

export function useRevenueForecastData(filters: RevenueForecastFilters) {
  // Build filter params
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {
      dateFrom: filters.dateRange.startDate,
      dateTo: filters.dateRange.endDate,
      companyCode: filters.companyCode || 'all',
      forecastHorizon: filters.forecastHorizon || 12,
      confidenceLevel: filters.confidenceLevel || 80.0,
      scenario: filters.scenario || 'base'
    };

    // Only include non-empty array filters
    if (filters.segments && filters.segments.length > 0) {
      params.segments = filters.segments;
    }

    if (filters.products && filters.products.length > 0) {
      params.products = filters.products;
    }

    if (filters.regions && filters.regions.length > 0) {
      params.regions = filters.regions;
    }

    if (filters.customerTypes && filters.customerTypes.length > 0) {
      params.customerTypes = filters.customerTypes;
    }

    return params;
  }, [filters]);

  // Use React Query for data fetching with caching
  const {
    data,
    isLoading: loading,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ['revenue-forecast', filterParams],
    queryFn: () => fetchRevenueForecastSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to fetch revenue forecast data'
    : null;

  return {
    loading,
    error,
    data,
    kpiMetrics: data?.kpiMetrics || {},
    growthDecomposition: data?.mainData?.growthDecomposition || [],
    cohortRetention: data?.mainData?.cohortRetention || [],
    segmentForecast: data?.mainData?.segmentForecast || [],
    customerEconomics: data?.mainData?.customerEconomics || {},
    monthlyTrend: data?.mainData?.monthlyTrend || [],
    insights: data?.insights || [],
    metadata: data?.metadata || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0,
  };
}
