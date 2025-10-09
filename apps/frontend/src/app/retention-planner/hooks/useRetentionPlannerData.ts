import { useState, useEffect } from 'react';
import { retentionPlannerService } from '../services/retentionPlannerService';

export function useRetentionPlannerData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await retentionPlannerService.getDashboardSummary(filters);
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
    retentionStrategies: data?.mainData?.retentionStrategies || {},
    churnRiskAnalysis: data?.mainData?.churnRiskAnalysis || {},
    customerLifecycle: data?.mainData?.customerLifecycle || {},
    retentionCampaigns: data?.mainData?.retentionCampaigns || {},
    kpiMetrics: data?.kpiMetrics || {},
    insights: data?.insights || [],
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}