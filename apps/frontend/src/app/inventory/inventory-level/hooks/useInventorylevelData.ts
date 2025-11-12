"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface InventoryLevelFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  warehouse: string[];
  category: string[];
  status: string[];
}

interface InventoryKPIs {
  totalInventoryValue: number;
  stockTurnover: number;
  stockoutRisk: number;
  averageDaysOnHand: number;
  inventoryAccuracy: number;
  excessStock: number;
}

interface StockLevel {
  itemName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  stockValue: number;
  status: string;
  daysOnHand: number;
}

interface Movement {
  period: string;
  inbound: number;
  outbound: number;
  netMovement: number;
  turnoverRate: number;
}

interface InventoryLevelData {
  kpis: InventoryKPIs;
  stockLevels: StockLevel[];
  movements: Movement[];
  alerts: string[];
  insights: string[];
  filters: InventoryLevelFilters;
}

async function fetchInventoryLevelSummary(filterParams: Record<string, any>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(`${apiUrl}/inventory-level/dashboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filterParams),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory level data: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(result.message || 'Failed to fetch inventory level data');
}

export function useInventorylevelData(filters: InventoryLevelFilters) {
  // Build filter params
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {
      dateFrom: filters.dateRange.startDate,
      dateTo: filters.dateRange.endDate,
    };

    // Only include non-empty array filters
    if (filters.warehouse && filters.warehouse.length > 0) {
      params.warehouse = filters.warehouse;
    }

    if (filters.category && filters.category.length > 0) {
      params.category = filters.category;
    }

    if (filters.status && filters.status.length > 0) {
      params.status = filters.status;
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
    queryKey: ['inventory-level', filterParams],
    queryFn: () => fetchInventoryLevelSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to fetch inventory level data'
    : null;

  // Transform KPIs to standard format
  const kpiMetrics = useMemo(() => {
    if (!rawData?.kpis) {
      return {
        totalInventoryValue: 0,
        stockTurnover: 0,
        stockoutRisk: 0,
        averageDaysOnHand: 0,
        inventoryAccuracy: 0,
        excessStock: 0
      };
    }

    return rawData.kpis;
  }, [rawData]);

  // Get stock levels
  const stockLevels = useMemo(() => {
    return rawData?.stockLevels || [];
  }, [rawData]);

  // Get movements
  const movements = useMemo(() => {
    return rawData?.movements || [];
  }, [rawData]);

  // Get alerts
  const alerts = useMemo(() => {
    return rawData?.alerts || [];
  }, [rawData]);

  // Get insights
  const insights = useMemo(() => {
    return rawData?.insights || [];
  }, [rawData]);

  const hasNoData = useMemo(() => {
    return !loading && !rawData;
  }, [loading, rawData]);

  return {
    loading,
    error,
    kpiMetrics,
    stockLevels,
    movements,
    alerts,
    insights,
    hasNoData,
    rawData
  };
}
