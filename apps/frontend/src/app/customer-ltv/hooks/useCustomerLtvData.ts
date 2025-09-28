import { useState, useEffect } from 'react';
import { customerLtvService } from '../services/customerLtvService';

export function useCustomerLtvData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await customerLtvService.getDashboardSummary(filters);
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
    ltvDistribution: data?.mainData?.ltvDistribution || [],
    segmentAnalysis: data?.mainData?.segmentAnalysis || [],
    ltvTrends: data?.mainData?.ltvTrends || [],
    topCustomers: data?.mainData?.topCustomers || [],
    kpiMetrics: data?.kpiMetrics || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}