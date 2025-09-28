import { useState, useEffect } from 'react';
import { engagementClassifierService } from '../services/engagementClassifierService';

export function useEngagementClassifierData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await engagementClassifierService.getDashboardSummary(filters);
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
    engagementDistribution: data?.mainData?.engagementDistribution || {},
    customerClassification: data?.mainData?.customerClassification || {},
    engagementScore: data?.mainData?.engagementScore || {},
    actionableInsights: data?.mainData?.actionableInsights || {},
    kpiMetrics: data?.kpiMetrics || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}