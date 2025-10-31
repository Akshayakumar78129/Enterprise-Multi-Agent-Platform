import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AnomalyFilters {
  dateFrom: string;
  dateTo: string;
  segmentIds?: number[];
  regionIds?: number[];
  severityLevels?: number[];
}

async function fetchAnomalyData(filters: AnomalyFilters) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  const response = await fetch(`${apiUrl}/anomaly-detection/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export function useAnomalyData(filters: AnomalyFilters) {
  const { data: rawData, isLoading, error: queryError } = useQuery({
    queryKey: ['anomaly-detection', filters],
    queryFn: () => fetchAnomalyData(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  });

  const data = useMemo(() => rawData || {}, [rawData]);

  const hasNoData = useMemo(() => {
    return !data.customerAnomalies || data.customerAnomalies.length === 0;
  }, [data]);

  const kpiMetrics = useMemo(() => {
    if (!data.kpiMetrics) {
      return {
        totalCustomers: 0,
        totalAnomalies: 0,
        highSeverityCount: 0,
        anomalyRate: 0,
        avgAnomalyScore: 0,
        severityDistribution: 0
      };
    }
    return data.kpiMetrics;
  }, [data]);

  return {
    loading: isLoading,
    error: queryError?.message || null,
    customerAnomalies: data.customerAnomalies || [],
    segmentDistribution: data.segmentDistribution || [],
    regionDistribution: data.regionDistribution || [],
    severityDistribution: data.severityDistribution || [],
    featureImportance: data.featureImportance || [],
    featureContribution: data.featureContribution || [],
    timeSeriesAnomalies: data.timeSeriesAnomalies || [],
    kpiMetrics,
    hasNoData
  };
}
