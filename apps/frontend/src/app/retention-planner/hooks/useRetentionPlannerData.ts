import { useState, useEffect, useMemo } from 'react';
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

  // Memoize the returned values to prevent infinite loops in useEffect dependencies
  const retentionStrategies = useMemo(() => data?.mainData?.retentionStrategies || {}, [data?.mainData?.retentionStrategies]);
  const churnRiskAnalysis = useMemo(() => data?.mainData?.churnRiskAnalysis || {}, [data?.mainData?.churnRiskAnalysis]);
  const customerLifecycle = useMemo(() => data?.mainData?.customerLifecycle || {}, [data?.mainData?.customerLifecycle]);
  const retentionCampaigns = useMemo(() => data?.mainData?.retentionCampaigns || {}, [data?.mainData?.retentionCampaigns]);
  const kpiMetrics = useMemo(() => data?.kpiMetrics || {}, [data?.kpiMetrics]);
  const insights = useMemo(() => data?.insights || [], [data?.insights]);

  return {
    loading,
    error,
    retentionStrategies,
    churnRiskAnalysis,
    customerLifecycle,
    retentionCampaigns,
    kpiMetrics,
    insights,
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}