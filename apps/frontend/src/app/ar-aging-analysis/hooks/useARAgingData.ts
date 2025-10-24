import { useState, useEffect, useRef } from 'react';
import { arAgingService, ARAgingFilters } from '../services/arAgingService';

export function useARAgingData(filters: ARAgingFilters) {
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
        const result = await arAgingService.getDashboardData(filters);
        setData(result);
        setError(null);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching AR aging data:', err);
          setError(err.message || 'Failed to fetch AR aging data');
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
    data,
    kpiMetrics: data?.kpiMetrics || {},
    agingBuckets: data?.mainData?.agingBuckets || [],
    customerInsights: data?.mainData?.customerInsights || [],
    collectionForecast: data?.mainData?.collectionForecast || [],
    npvSummary: data?.mainData?.npvSummary || {},
    agingTable: data?.mainData?.agingTable || [],
    insights: data?.insights || [],
    metadata: data?.metadata || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}
