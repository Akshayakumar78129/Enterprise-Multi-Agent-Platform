import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ARAgingFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  customerSegments: string[];
  regions: string[];
  riskLevels: string[];
  minAmount?: number;
  maxAmount?: number;
  wacc: number;
}

async function fetchARAgingSummary(filterParams: Record<string, any>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(`${apiUrl}/ar-aging/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filterParams),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AR aging data: ${response.statusText}`);
  }

  return response.json();
}

export function useARAgingData(filters: ARAgingFilters) {
  // Build filter params
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {
      dateFrom: filters.dateRange.startDate,
      dateTo: filters.dateRange.endDate,
      wacc: filters.wacc || 10.0,
    };

    // Only include non-empty array filters
    if (filters.customerSegments && filters.customerSegments.length > 0) {
      params.customerSegments = filters.customerSegments;
    }

    if (filters.regions && filters.regions.length > 0) {
      params.regions = filters.regions;
    }

    if (filters.riskLevels && filters.riskLevels.length > 0) {
      params.riskLevels = filters.riskLevels;
    }

    if (filters.minAmount !== undefined && filters.minAmount !== null) {
      params.minAmount = filters.minAmount;
    }

    if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
      params.maxAmount = filters.maxAmount;
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
    queryKey: ['ar-aging-analysis', filterParams],
    queryFn: () => fetchARAgingSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to fetch AR aging data'
    : null;

  return {
    loading,
    error,
    data,
    kpiMetrics: data?.kpiMetrics || {},
    agingBuckets: data?.mainData?.agingBuckets || [],
    customerInsights: data?.mainData?.customerInsights || [],
    collectionForecast: data?.mainData?.collectionForecast || [],
    npvSummary: data?.mainData?.npvSummary || {},
    agingTable: data?.mainData?.agingTable || [],
    insights: data?.insights || [],
    metadata: data?.metadata || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0,
  };
}
