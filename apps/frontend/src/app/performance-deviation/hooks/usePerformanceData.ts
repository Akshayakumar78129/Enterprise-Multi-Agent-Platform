import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PerformanceFilters {
  dateFrom: string;
  dateTo: string;
  businessFunctions?: string[];
  kpis?: string[];
}

async function fetchPerformanceData(filters: PerformanceFilters) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  const response = await fetch(`${apiUrl}/performance-deviation/summary`, {
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
    queryKey: ['performance-deviation', filters],
    queryFn: () => fetchPerformanceData(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  });

  const data = useMemo(() => rawData || {}, [rawData]);

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
    factorCorrelations: data.factorCorrelations || { series: {} }
  };
}
