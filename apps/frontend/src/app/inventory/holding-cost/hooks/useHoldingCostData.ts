import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { HoldingCostFilters } from "../context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchHoldingCostSummary(filters: HoldingCostFilters) {
  const payload = {
    dateFrom: filters.dateRange?.startDate,
    dateTo: filters.dateRange?.endDate,
    categories: filters.categories?.length > 0 ? filters.categories : undefined,
    warehouseIds: filters.warehouseIds?.length > 0 ? filters.warehouseIds : undefined,
    excessiveOnly: filters.excessiveOnly,
    annualHoldingCostRate: filters.annualHoldingCostRate,
    opportunityCostRate: filters.opportunityCostRate
  };

  console.log('[HoldingCost] Fetching with filters:', payload);

  const response = await fetch(`${API_BASE_URL}/inventory/holding-cost/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export function useHoldingCostData(filters: HoldingCostFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["holding-cost", filters],
    queryFn: () => fetchHoldingCostSummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: typeof window !== 'undefined', // Only run on client-side
  });

  const kpiMetrics = useMemo(() => data?.kpiMetrics || {}, [data]);
  const categoryAnalysis = useMemo(() => data?.categoryAnalysis || [], [data]);
  const warehouseAnalysis = useMemo(() => data?.warehouseAnalysis || [], [data]);
  const highCostItems = useMemo(() => data?.highCostItems || [], [data]);
  const costBreakdown = useMemo(() => data?.costBreakdown || [], [data]);
  const insights = useMemo(() => data?.insights || [], [data]);
  const trendData = useMemo(() => data?.trendData || [], [data]);
  const savingOpportunities = useMemo(() => data?.savingOpportunities || [], [data]);
  const excessiveCostItems = useMemo(() => data?.excessiveCostItems || [], [data]);

  const hasNoData = useMemo(() => {
    return !isLoading && (!data || (
      !categoryAnalysis.length &&
      !warehouseAnalysis.length &&
      !highCostItems.length
    ));
  }, [isLoading, data, categoryAnalysis, warehouseAnalysis, highCostItems]);

  return {
    loading: isLoading,
    error: error?.message,
    data,
    kpiMetrics,
    categoryAnalysis,
    warehouseAnalysis,
    highCostItems,
    costBreakdown,
    insights,
    trendData,
    savingOpportunities,
    excessiveCostItems,
    hasNoData
  };
}
