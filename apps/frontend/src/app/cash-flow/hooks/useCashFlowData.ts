import { useState, useEffect, useCallback } from 'react';
import { cashFlowService, CashFlowData, CashFlowFilters } from '../services/cashFlowService';

export function useCashFlowData(filters: CashFlowFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CashFlowData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await cashFlowService.getDashboardData(filters);
      setData(result);
    } catch (err: any) {
      console.error('Error fetching cash flow data:', err);
      setError(err.message || 'Failed to load cash flow data');
      // Set empty data on error
      setData({
        kpiMetrics: {
          netCashFlow: 0,
          operatingCashFlow: 0,
          investingCashFlow: 0,
          financingCashFlow: 0,
          cashRatio: 0,
          freeCashFlow: 0
        },
        mainData: {
          trends: [],
          operating: [],
          investing: [],
          financing: [],
          projection: [],
          transactions: []
        },
        insights: [],
        metadata: {
          filtersApplied: filters,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived data for easier component access
  const kpiMetrics = data?.kpiMetrics || {
    netCashFlow: 0,
    operatingCashFlow: 0,
    investingCashFlow: 0,
    financingCashFlow: 0,
    cashRatio: 0,
    freeCashFlow: 0
  };

  const cashFlowTrends = data?.mainData?.trends || [];
  const operatingCashFlow = data?.mainData?.operating || [];
  const investmentCashFlow = data?.mainData?.investing || [];
  const financingCashFlow = data?.mainData?.financing || [];
  const cashFlowProjection = data?.mainData?.projection || [];
  const cashFlowItems = data?.mainData?.transactions || [];
  const fcfBridge = data?.mainData?.fcfBridge || [];
  const liquidityTimeline = data?.mainData?.liquidityTimeline || [];
  const capitalAllocation = data?.mainData?.capitalAllocation || [];
  const insights = data?.insights || [];

  const hasNoData = !loading && (!data ||
    (cashFlowTrends.length === 0 &&
     operatingCashFlow.length === 0 &&
     investmentCashFlow.length === 0 &&
     financingCashFlow.length === 0));

  return {
    loading,
    error,
    data,
    kpiMetrics,
    cashFlowTrends,
    operatingCashFlow,
    investmentCashFlow,
    financingCashFlow,
    cashFlowProjection,
    cashFlowItems,
    fcfBridge,
    liquidityTimeline,
    capitalAllocation,
    hasNoData,
    insights
  };
}
