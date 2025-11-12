import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { StockOptimizationFilters } from '../context';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchStockOptimizationSummary(filters: StockOptimizationFilters) {
  const payload = {
    dateFrom: filters.dateRange?.startDate,
    dateTo: filters.dateRange?.endDate,
    categories: filters.categories?.length > 0 ? filters.categories : undefined,
    warehouseIds: filters.warehouseIds?.length > 0 ? filters.warehouseIds : undefined,
    optimizationLevel: filters.optimizationLevel
  };

  console.log('[StockOptimization] Fetching with filters:', payload);

  const response = await fetch(`${API_BASE_URL}/inventory/stock-optimization/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export function useStockoptimizationData(filters: StockOptimizationFilters = {}) {
  const { data, isLoading, isFetching, error} = useQuery({
    queryKey: ['stock-optimization', filters],
    queryFn: () => fetchStockOptimizationSummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: typeof window !== 'undefined', // Only run on client-side
  });

  const kpiMetrics = useMemo(() => {
    // Return the raw backend data object directly for the KPIs component
    if (!data?.kpiMetrics) {
      return {
        total_optimized_value: 0,
        items_needing_reorder: 0,
        safety_stock_coverage: 0,
        avg_order_frequency: 0,
        total_cost_savings: 0,
        service_level: 0,
        total_items: 0,
        items_overstock: 0,
        items_understock: 0
      };
    }

    return data.kpiMetrics;
  }, [data]);

  const recommendations = useMemo(() => data?.recommendations || [], [data]);
  const metrics = useMemo(() => data?.metrics || [], [data]);
  const reorderAnalysis = useMemo(() => data?.reorderAnalysis || [], [data]);
  const insights = useMemo(() => data?.insights || [], [data]);
  const heatmapData = useMemo(() => data?.heatmapData || { cells: [], categories: [], warehouses: [] }, [data]);
  const optimizationMatrix = useMemo(() => data?.optimizationMatrix || [], [data]);
  const serviceLevelImpact = useMemo(() => data?.serviceLevelImpact || { impactData: [], currentServiceLevel: 95, optimalServiceLevel: 95 }, [data]);
  const valueTreemap = useMemo(() => data?.valueTreemap || [], [data]);
  const performanceGauge = useMemo(() => data?.performanceGauge || { score: 0, status: 'unknown', serviceScore: 0, stockScore: 0, costScore: 0, breakdown: {} }, [data]);

  const hasNoData = !data || (
    (!data.kpiMetrics || data.kpiMetrics.total_items === 0) &&
    (!data.recommendations || data.recommendations.length === 0)
  );

  return {
    loading: isLoading || isFetching,
    error: error?.message,
    data: data || {},
    kpiMetrics,
    recommendations,
    metrics,
    reorderAnalysis,
    insights,
    heatmapData,
    optimizationMatrix,
    serviceLevelImpact,
    valueTreemap,
    performanceGauge,
    hasNoData,
  };
}
