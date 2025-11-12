import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

async function fetchNextPurchaseSummary(filterParams: Record<string, any>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(`${apiUrl}/next-purchase/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filterParams),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch next purchase summary: ${response.statusText}`);
  }

  return response.json();
}

interface NextPurchaseFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  productCategories?: string[];
  probabilityThreshold?: number;
  dayRange?: {
    min: number;
    max: number;
  };
}

export function useNextPurchaseData(filters: NextPurchaseFilters | Record<string, any>) {
  // Build filter params with defaults
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {};

    // Always use dateRange - default to full data range 2017-2021
    if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
      params.dateFrom = filters.dateRange.startDate;
      params.dateTo = filters.dateRange.endDate;
    } else {
      // Default to full data range 2017-2021
      params.dateFrom = '2017-01-01';
      params.dateTo = '2021-12-31';
    }

    // Add product categories filter if provided
    if (filters.productCategories && filters.productCategories.length > 0) {
      params.productCategories = filters.productCategories;
    }

    // Add probability threshold if provided
    if (filters.probabilityThreshold !== undefined) {
      params.probabilityThreshold = filters.probabilityThreshold;
    }

    // Add day range filter if provided
    if (filters.dayRange) {
      params.dayRange = filters.dayRange;
    }

    return params;
  }, [filters]);

  // Use React Query for data fetching with caching
  const {
    data: rawData,
    isLoading: loading,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ['next-purchase', filterParams],
    queryFn: () => fetchNextPurchaseSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch data') : null;

  // Normalize and process data
  const processedData = useMemo(() => {
    if (!rawData) return null;

    // Normalize data structure
    const mainData = rawData.mainData || {};
    const kpiMetrics = rawData.kpiMetrics || {};

    return {
      nextPurchasePredictions: mainData.nextPurchasePredictions || [],
      purchaseProbability: mainData.purchaseProbability || {},
      recommendedProducts: mainData.recommendedProducts || [],
      timingForecast: mainData.timingForecast || [],
      productAffinityNetwork: mainData.productAffinityNetwork || { nodes: [], links: [] },
      confidenceMatrix: mainData.confidenceMatrix || { matrix: [], products: [], segments: [] },
      customerJourneys: mainData.customerJourneys || mainData.customerTimeline || {},
      categoryPerformance: mainData.categoryPerformance || [],
      purchaseTimingData: mainData.purchaseTimingData || mainData.purchaseTiming || [],
      categorySeries: mainData.categorySeries || mainData.categoryRevenueSeries || [],
      kpiMetrics: kpiMetrics,
      insights: rawData.insights || [],
      ai_insights: rawData.ai_insights || [],
    };
  }, [rawData]);

  // Check if there's no data
  const hasNoData = useMemo(() => {
    if (!processedData) return true;
    const { kpiMetrics } = processedData;
    return !kpiMetrics || Object.keys(kpiMetrics).length === 0 || kpiMetrics.totalPredictions === 0;
  }, [processedData]);

  return {
    loading,
    error,
    nextPurchasePredictions: processedData?.nextPurchasePredictions || [],
    purchaseProbability: processedData?.purchaseProbability || {},
    recommendedProducts: processedData?.recommendedProducts || [],
    timingForecast: processedData?.timingForecast || [],
    productAffinityNetwork: processedData?.productAffinityNetwork || { nodes: [], links: [] },
    confidenceMatrix: processedData?.confidenceMatrix || { matrix: [], products: [], segments: [] },
    customerJourneys: processedData?.customerJourneys || {},
    categoryPerformance: processedData?.categoryPerformance || [],
    purchaseTimingData: processedData?.purchaseTimingData || [],
    categorySeries: processedData?.categorySeries || [],
    kpiMetrics: processedData?.kpiMetrics || {},
    insights: processedData?.insights || [],
    ai_insights: processedData?.ai_insights || [],
    hasNoData,
    isFetching, // Shows if background refetch is happening
  };
}
