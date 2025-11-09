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
        // Map frontend filters to backend format
        const apiFilters: any = {};

        if (filters.dateRange) {
          apiFilters.date_from = filters.dateRange.startDate;
          apiFilters.date_to = filters.dateRange.endDate;
        }

        if (filters.loyaltyStatus && filters.loyaltyStatus.length > 0) {
          apiFilters.loyalty_status = filters.loyaltyStatus;
        }

        if (filters.riskThreshold !== undefined) {
          apiFilters.risk_threshold = filters.riskThreshold;
        }

        const response = await retentionPlannerService.getDashboardSummary(apiFilters);
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
  const kpiMetrics = useMemo(() => data?.kpiMetrics || {}, [data?.kpiMetrics]);
  const riskDistribution = useMemo(() => data?.mainData?.riskDistributionData || [], [data?.mainData?.riskDistributionData]);
  const valueRiskMatrix = useMemo(() => data?.mainData?.valueRiskMatrixData || [], [data?.mainData?.valueRiskMatrixData]);
  const interventionROI = useMemo(() => data?.mainData?.interventionroiData || [], [data?.mainData?.interventionroiData]);
  const lifecycleStages = useMemo(() => data?.mainData?.customerLifecycleData || [], [data?.mainData?.customerLifecycleData]);
  const retentionStrategies = useMemo(() => data?.mainData?.retentionStrategiesData || [], [data?.mainData?.retentionStrategiesData]);
  const campaignRecommendations = useMemo(() => data?.mainData?.campaignRecommendationsData || [], [data?.mainData?.campaignRecommendationsData]);
  const insights = useMemo(() => data?.insights || [], [data?.insights]);

  return {
    loading,
    error,
    kpiMetrics,
    riskDistribution,
    valueRiskMatrix,
    interventionROI,
    lifecycleStages,
    retentionStrategies,
    campaignRecommendations,
    insights,
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}