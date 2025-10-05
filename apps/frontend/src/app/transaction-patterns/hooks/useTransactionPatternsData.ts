import { useState, useEffect } from 'react';
import { transactionPatternsService } from '../services/transactionPatternsService';

export function useTransactionPatternsData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await transactionPatternsService.getDashboardSummary(filters);
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
    // Map backend keys to frontend expected keys
    temporalPatterns: {
      heatmapData: data?.mainData?.distribution || [],
      timeSeries: data?.mainData?.timeSeries || []
    },
    productCombinations: {
      products: data?.mainData?.productMetrics || data?.mainData?.topMetrics || []
    },
    anomalyDetection: {
      amountDistribution: data?.mainData?.distribution || []
    },
    paymentMethods: data?.mainData?.paymentMethods || {},
    kpiMetrics: data?.kpiMetrics || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}