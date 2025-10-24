import { useState, useEffect, useCallback } from 'react';
import { regionalSalesService, RegionalSalesData, RegionalSalesFilters } from '../services/regionalSalesService';

export function useRegionalSalesData(filters: RegionalSalesFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RegionalSalesData | null>(null);

  // Serialize filters to avoid infinite re-renders
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await regionalSalesService.getDashboardData(filters);
        setData(result);
      } catch (err: any) {
        console.error('Error fetching regional sales data:', err);
        setError(err.message || 'Failed to load regional sales data');
        // Set empty data on error
        setData({
          kpiMetrics: {
            totalSales: 0,
            netSales: 0,
            grossProfit: 0,
            profitMargin: 0,
            countryCount: 0,
            stateCount: 0,
            customerCount: 0,
            transactionCount: 0,
            avgTransactionValue: 0,
            growthRate: null
          },
          mainData: {
            regionalPerformance: [],
            countryPerformance: [],
            timeSeries: [],
            opportunities: [],
            topRegions: []
          },
          insights: [],
          metadata: {
            filtersApplied: filters,
            timestamp: new Date().toISOString(),
            dateRange: {
              start: filters.dateFrom || '',
              end: filters.dateTo || ''
            },
            totalRegions: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // Derived data for easier component access
  const kpiMetrics = data?.kpiMetrics || {
    totalSales: 0,
    netSales: 0,
    grossProfit: 0,
    profitMargin: 0,
    countryCount: 0,
    stateCount: 0,
    customerCount: 0,
    transactionCount: 0,
    avgTransactionValue: 0,
    growthRate: null
  };

  const regionalPerformance = data?.mainData?.regionalPerformance || [];
  const countryPerformance = data?.mainData?.countryPerformance || [];
  const timeSeries = data?.mainData?.timeSeries || [];
  const opportunities = data?.mainData?.opportunities || [];
  const topRegions = data?.mainData?.topRegions || [];

  const hasNoData = !loading && (!data ||
    (regionalPerformance.length === 0 &&
     timeSeries.length === 0));

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await regionalSalesService.getDashboardData(filters);
      setData(result);
    } catch (err: any) {
      console.error('Error fetching regional sales data:', err);
      setError(err.message || 'Failed to load regional sales data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return {
    loading,
    error,
    data,
    kpiMetrics,
    regionalPerformance,
    countryPerformance,
    timeSeries,
    opportunities,
    topRegions,
    insights: data?.insights || [],
    metadata: data?.metadata,
    hasNoData,
    refetch
  };
}
