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
  const { data, isLoading, error} = useQuery({
    queryKey: ['stock-optimization', filters],
    queryFn: () => fetchStockOptimizationSummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: typeof window !== 'undefined', // Only run on client-side
  });

  const kpiMetrics = useMemo(() => {
    if (!data?.kpiMetrics) {
      return [
        { id: 'optimized-value', title: 'Optimized Stock Value', value: 0, format: 'currency' as const, color: '#3b82f6' },
        { id: 'reorder-items', title: 'Items Needing Reorder', value: 0, format: 'number' as const, color: '#ef4444' },
        { id: 'safety-coverage', title: 'Safety Stock Coverage', value: 0, format: 'percentage' as const, color: '#10b981' },
        { id: 'order-frequency', title: 'Avg Order Frequency', value: 0, format: 'decimal' as const, suffix: '/year', color: '#f59e0b' },
        { id: 'cost-savings', title: 'Projected Cost Savings', value: 0, format: 'currency' as const, color: '#8b5cf6' },
        { id: 'service-level', title: 'Service Level', value: 0, format: 'percentage' as const, color: '#06b6d4' },
      ];
    }

    const kpis = data.kpiMetrics;
    return [
      { id: 'optimized-value', title: 'Optimized Stock Value', value: kpis.total_optimized_value || 0, format: 'currency' as const, color: '#3b82f6' },
      { id: 'reorder-items', title: 'Items Needing Reorder', value: kpis.items_needing_reorder || 0, format: 'number' as const, color: '#ef4444' },
      { id: 'safety-coverage', title: 'Safety Stock Coverage', value: kpis.safety_stock_coverage || 0, format: 'percentage' as const, color: '#10b981' },
      { id: 'order-frequency', title: 'Avg Order Frequency', value: kpis.avg_order_frequency || 0, format: 'decimal' as const, suffix: '/year', color: '#f59e0b' },
      { id: 'cost-savings', title: 'Projected Cost Savings', value: kpis.total_cost_savings || 0, format: 'currency' as const, color: '#8b5cf6' },
      { id: 'service-level', title: 'Service Level', value: kpis.service_level || 0, format: 'percentage' as const, color: '#06b6d4' },
    ];
  }, [data]);

  const recommendations = useMemo(() => data?.recommendations || [], [data]);
  const metrics = useMemo(() => data?.metrics || [], [data]);
  const reorderAnalysis = useMemo(() => data?.reorderAnalysis || [], [data]);
  const insights = useMemo(() => data?.insights || [], [data]);

  const hasNoData = !data || (
    (!data.kpiMetrics || data.kpiMetrics.total_items === 0) &&
    (!data.recommendations || data.recommendations.length === 0)
  );

  return {
    loading: isLoading,
    error: error?.message,
    data: data || {},
    kpiMetrics,
    recommendations,
    metrics,
    reorderAnalysis,
    insights,
    hasNoData,
  };
}
