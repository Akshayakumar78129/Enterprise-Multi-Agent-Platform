import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface SegmentationFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  customerSegments: string[];
  valueCategories: string[];
  behaviorTypes: string[];
}

async function fetchSegmentationSummary(filterParams: Record<string, any>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(`${apiUrl}/segmentation/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filterParams),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch segmentation summary: ${response.statusText}`);
  }

  return response.json();
}

export function useSegmentationData(filters: SegmentationFilters) {
  // Build filter params - map frontend dateRange to backend dateFrom/dateTo
  const filterParams = useMemo(() => ({
    dateFrom: filters.dateRange.startDate,
    dateTo: filters.dateRange.endDate,
    customerSegments: filters.customerSegments.length > 0 ? filters.customerSegments : undefined,
    valueCategories: filters.valueCategories.length > 0 ? filters.valueCategories : undefined,
    behaviorTypes: filters.behaviorTypes.length > 0 ? filters.behaviorTypes : undefined,
  }), [filters]);

  // Use React Query with unique cache key per filter combination
  const {
    data: rawData,
    isLoading: loading,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ['customer-segmentation', filterParams],
    queryFn: () => fetchSegmentationSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch data") : null;

  // Process KPI data
  const kpiData = useMemo(() => {
    if (!rawData) return null;

    const kpiMetrics = rawData.kpiMetrics || {};
    return {
      total_segments: kpiMetrics.totalSegments || 0,
      largest_segment_size: kpiMetrics.largestSegmentSize || 0,
      most_valuable_segment: kpiMetrics.mostValuableSegment || 'N/A',
      segmentation_quality: kpiMetrics.segmentationQuality || 0,
      avg_segment_value: kpiMetrics.avgSegmentValue || 0,
      total_customers: kpiMetrics.totalCustomers || 0,
      segment_stability: kpiMetrics.segmentStability || 0
    };
  }, [rawData]);

  // Process segment data
  const segmentData = useMemo(() => {
    if (!rawData) return [];
    return rawData.mainData?.segmentData || [];
  }, [rawData]);

  // Process segment distribution
  const segmentDistribution = useMemo(() => {
    if (!rawData) return [];
    return rawData.mainData?.segmentDistribution || [];
  }, [rawData]);

  // Process segment comparison
  const segmentComparison = useMemo(() => {
    if (!rawData) return [];
    return rawData.mainData?.segmentComparison || [];
  }, [rawData]);

  // Process insights
  const insights = useMemo(() => {
    if (!rawData) return [];
    return rawData.insights || [];
  }, [rawData]);

  // Process customers
  const customers = useMemo(() => {
    if (!rawData) return [];
    return rawData.customers || [];
  }, [rawData]);

  return {
    loading,
    error,
    isFetching,
    kpiData,
    segmentData,
    segmentDistribution,
    segmentComparison,
    insights,
    customers
  };
}
