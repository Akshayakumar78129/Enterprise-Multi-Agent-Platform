import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerLtvService } from '../services/customerLtvService';

export interface CustomerLtvFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  regions?: string[];
  customerTypes?: string[];
  minValue?: number;
  maxValue?: number;
}

export function useCustomerLtvData(filters: CustomerLtvFilters) {
  // Memoize filter params - map frontend dateRange to backend date_from/date_to
  const filterParams = useMemo(() => ({
    date_from: filters.dateRange.startDate,
    date_to: filters.dateRange.endDate,
    regions: filters.regions && filters.regions.length > 0 ? filters.regions : undefined,
    customerTypes: filters.customerTypes && filters.customerTypes.length > 0 ? filters.customerTypes : undefined,
    minValue: filters.minValue,
    maxValue: filters.maxValue,
  }), [filters.dateRange.startDate, filters.dateRange.endDate, filters.regions, filters.customerTypes, filters.minValue, filters.maxValue]);

  const {
    data: rawData,
    isLoading: loading,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ['customer-lifetime-value', filterParams],
    queryFn: () => customerLtvService.getDashboardSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes - matches backend cache TTL
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Memoize data arrays to prevent unnecessary re-renders
  const ltvDistribution = useMemo(() => rawData?.mainData?.ltvDistribution || [], [rawData?.mainData?.ltvDistribution]);
  const segmentAnalysis = useMemo(() => rawData?.mainData?.segmentAnalysis || [], [rawData?.mainData?.segmentAnalysis]);
  const ltvTrends = useMemo(() => rawData?.mainData?.ltvTrends || [], [rawData?.mainData?.ltvTrends]);
  const topCustomers = useMemo(() => rawData?.mainData?.topCustomers || [], [rawData?.mainData?.topCustomers]);
  const predictionData = useMemo(() => rawData?.mainData?.predictionData || [], [rawData?.mainData?.predictionData]);
  const valueContribution = useMemo(() => rawData?.mainData?.valueContribution || [], [rawData?.mainData?.valueContribution]);
  const kpiMetrics = useMemo(() => rawData?.kpiMetrics || {}, [rawData?.kpiMetrics]);
  const insights = useMemo(() => rawData?.insights || [], [rawData?.insights]);

  return {
    loading,
    error,
    isFetching,
    ltvDistribution,
    segmentAnalysis,
    ltvTrends,
    topCustomers,
    predictionData,
    valueContribution,
    kpiMetrics,
    insights,
    hasNoData: !rawData?.mainData || Object.keys(rawData?.mainData || {}).length === 0
  };
}