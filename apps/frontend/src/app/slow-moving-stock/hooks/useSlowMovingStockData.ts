import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SlowMovingStockFilters } from '../context';

interface SlowMovingStockSummary {
  kpis: {
    totalItems: number;
    totalInventoryValue: number;
    avgTurnoverRate: number;
    avgDaysSinceLastSale: number;
    slowMovingItems: number;
    carryingCost: number;
  };
  slowMovingItems: Array<{
    itemName: string;
    category: string;
    currentStock: number;
    stockValue: number;
    turnoverRate: number;
    daysSinceLastSale: number;
    lastSaleDate: string;
    transactionCount: number;
  }>;
  turnoverDistribution: Array<{
    category: string;
    itemCount: number;
    totalValue: number;
  }>;
  agingAnalysis: Array<{
    agingPeriod: string;
    itemCount: number;
    totalValue: number;
  }>;
  categoryAnalysis: Array<{
    category: string;
    totalItems: number;
    slowMovingItems: number;
    totalValue: number;
    avgTurnoverRate: number;
  }>;
}

async function fetchSlowMovingStockSummary(filterParams: any): Promise<SlowMovingStockSummary> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(`${apiUrl}/slow-moving-stock/dashboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filterParams),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch slow moving stock data: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(result.message || 'Failed to fetch slow moving stock data');
}

export function useSlowMovingStockData(filters: SlowMovingStockFilters) {
  const filterParams = useMemo(() => ({
    dateFrom: filters.dateRange.startDate,
    dateTo: filters.dateRange.endDate,
    category: filters.category?.length > 0 ? filters.category : undefined,
    turnoverThreshold: filters.turnoverThreshold
  }), [filters]);

  const { data: rawData, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['slow-moving-stock', filterParams],
    queryFn: () => fetchSlowMovingStockSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const data = useMemo(() => {
    if (!rawData) return null;

    return {
      kpis: rawData.kpis || {},
      slowMovingItems: rawData.slowMovingItems || [],
      turnoverDistribution: rawData.turnoverDistribution || [],
      agingAnalysis: rawData.agingAnalysis || [],
      categoryAnalysis: rawData.categoryAnalysis || []
    };
  }, [rawData]);

  return {
    data,
    loading: isLoading,
    isFetching,
    error,
    refetch
  };
}
