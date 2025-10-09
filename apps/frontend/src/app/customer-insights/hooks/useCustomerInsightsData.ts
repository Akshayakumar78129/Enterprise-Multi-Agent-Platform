import { useState, useEffect } from 'react';
import { customerInsightsService } from '../services/customerInsightsService';

export function useCustomerInsightsData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await customerInsightsService.getDashboardSummary(filters);
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
    engagementOverview: data?.mainData?.engagementOverview || {},
    customerProfiles: data?.mainData?.customerProfiles || [],
    behaviorInsights: data?.mainData?.behaviorInsights || {},
    recommendations: data?.mainData?.recommendations || [],
    kpiMetrics: data?.kpiMetrics || {},
    insights: data?.insights || [],
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}