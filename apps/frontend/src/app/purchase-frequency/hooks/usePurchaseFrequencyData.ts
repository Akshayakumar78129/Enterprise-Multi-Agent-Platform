import { useState, useEffect } from 'react';
import { purchaseFrequencyService } from '../services/purchaseFrequencyService';

export function usePurchaseFrequencyData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await purchaseFrequencyService.getDashboardSummary(filters);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return {
    loading,
    error,
    frequencyDistribution: data?.mainData?.frequencyDistribution || [],
    intervalAnalysis: data?.mainData?.intervalAnalysis || {},
    customerSegments: data?.mainData?.customerSegments || [],
    valuePatterns: data?.mainData?.valuePatterns || {},
    kpiMetrics: data?.kpiMetrics || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}