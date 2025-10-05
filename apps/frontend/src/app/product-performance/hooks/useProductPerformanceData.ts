import { useState, useEffect, useRef } from 'react';
import { productPerformanceService, ProductFilters } from '../services/productPerformanceService';

export function useProductPerformanceData(filters: ProductFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const result = await productPerformanceService.getDashboardData(filters);
        setData(result);
        setError(null);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching product performance data:', err);
          setError(err.message || 'Failed to fetch product performance data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [JSON.stringify(filters)]);

  return {
    loading,
    error,
    kpiMetrics: data?.kpiMetrics || {},
    topProducts: data?.mainData?.topProducts || [],
    categoryPerformance: data?.mainData?.categoryPerformance || [],
    marginAnalysis: data?.mainData?.marginAnalysis || [],
    priceBandDistribution: data?.mainData?.priceBandDistribution || [],
    insights: data?.insights || [],
    metadata: data?.metadata || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}