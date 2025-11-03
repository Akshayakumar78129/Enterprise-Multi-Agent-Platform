import { useState, useEffect } from 'react';

export function useDemandforecastData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    // TODO: Connect to backend API
    setTimeout(() => {
      setData({
        kpiMetrics: {
          metric1: 0,
          metric2: 0,
          metric3: 0,
          metric4: 0
        },
        trends: [],
        distribution: [],
        performance: []
      });
      setLoading(false);
    }, 1000);
  }, [filters]);

  // Convert kpiMetrics object to array format for KPIRow component
  const kpiMetricsArray = data?.kpiMetrics ? [
    { id: 'metric1', label: 'Metric 1', value: data.kpiMetrics.metric1 || 0 },
    { id: 'metric2', label: 'Metric 2', value: data.kpiMetrics.metric2 || 0 },
    { id: 'metric3', label: 'Metric 3', value: data.kpiMetrics.metric3 || 0 },
    { id: 'metric4', label: 'Metric 4', value: data.kpiMetrics.metric4 || 0 },
  ] : [];

  return {
    loading,
    error,
    data,
    kpiMetrics: kpiMetricsArray,
    hasNoData: !data || Object.keys(data).length === 0
  };
}