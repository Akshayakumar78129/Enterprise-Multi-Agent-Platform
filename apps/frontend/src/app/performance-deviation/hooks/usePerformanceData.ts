import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PerformanceFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  businessFunctions?: string[];
  significanceThreshold?: number;
  productCategories?: string[];
  kpis?: string[];
}

async function fetchPerformanceData(filters: PerformanceFilters) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(`${apiUrl}/performance/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export function usePerformanceData(filters: PerformanceFilters) {
  const { data: rawData, isLoading, error: queryError } = useQuery({
    queryKey: ['performance-deviation-v2', filters],
    queryFn: () => fetchPerformanceData(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  });

  const data = useMemo(() => rawData || {}, [rawData]);

  const hasNoData = useMemo(() => {
    return !data.data || data.data.length === 0;
  }, [data]);

  return {
    loading: isLoading,
    error: queryError?.message || null,
    data: data.data || [],
    featureImportance: data.featureImportance || { aggregated: [], byKPI: {} },
    varianceDecomposition: data.varianceDecomposition || { components: [] },
    performanceExplorer: data.performanceExplorer || {},
    kpis: data.kpis || {},
    businessComparison: data.businessFunctionComparison || { radar: {} },
    deviationPatterns: data.deviationPatterns || { patterns: [], calendar: {}, monthlyStats: {} },
    factorCorrelations: data.factorCorrelations || { series: {} },
    insights: data.insights || [],
    insightsMetadata: data.insights_metadata || { rule_based_count: 0, ai_count: 0, total_count: 0, insights_version: 'unified_v2' },
    hasNoData
  };
}
