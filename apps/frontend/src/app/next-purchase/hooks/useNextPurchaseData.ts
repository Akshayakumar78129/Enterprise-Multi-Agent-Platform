import { useState, useEffect } from 'react';
import { nextPurchaseService } from '../services/nextPurchaseService';

export function useNextPurchaseData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await nextPurchaseService.getDashboardSummary(filters);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        // Set default empty data on error
        setData({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return {
    loading,
    error,
    nextPurchasePredictions: data?.mainData?.nextPurchasePredictions || {},
    purchaseProbability: data?.mainData?.purchaseProbability || {},
    recommendedProducts: data?.mainData?.recommendedProducts || {},
    timingForecast: data?.mainData?.timingForecast || {},
    kpiMetrics: data?.kpiMetrics || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}