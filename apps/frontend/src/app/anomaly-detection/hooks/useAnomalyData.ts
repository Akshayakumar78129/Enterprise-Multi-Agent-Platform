import { useEffect, useState, useMemo, useRef } from "react";

function getDashboardClient(dashboardType: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  return {
    fetchSummary: async (params: any, options?: RequestInit) => {
      const response = await fetch(
        `${apiUrl}/${dashboardType}/summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params || {}),
          ...options
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch ${dashboardType} summary: ${response.statusText}`);
      }

      return response.json();
    }
  };
}

interface AnomalyFilters {
  dateFrom: string;
  dateTo: string;
  severityLevels: number[];
  segments: string[];
  regions: string[];
  contamination: number;
  search: string;
}

export function useAnomalyData(filters: AnomalyFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const lastGoodDataRef = useRef<any>(null);
  const [customerAnomalies, setCustomerAnomalies] = useState<any[]>([]);
  const [segmentDistribution, setSegmentDistribution] = useState<any[]>([]);
  const [regionDistribution, setRegionDistribution] = useState<any[]>([]);
  const [severityDistribution, setSeverityDistribution] = useState<any[]>([]);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [featureContribution, setFeatureContribution] = useState<any[]>([]);
  const [timeSeriesAnomalies, setTimeSeriesAnomalies] = useState<any[]>([]);
  const [hasNoData, setHasNoData] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const client = useMemo(() => getDashboardClient("anomaly"), []);

  function normalizeSummary(summary: any) {
    const s = summary || {};

    return {
      customerAnomalies: s.customerAnomalies || s.customer_anomalies || [],
      segmentDistribution: s.segmentDistribution || s.segment_distribution || [],
      regionDistribution: s.regionDistribution || s.region_distribution || [],
      severityDistribution: s.severityDistribution || s.severity_distribution || [],
      featureImportance: s.featureImportance || s.feature_importance || [],
      featureContribution: s.featureContribution || s.feature_contribution || [],
      timeSeriesAnomalies: s.timeSeriesAnomalies || s.time_series_anomalies || [],
    };
  }

  const emptyData = useMemo(() => ({
    customerAnomalies: [],
    segmentDistribution: [],
    regionDistribution: [],
    severityDistribution: [],
    featureImportance: [],
    featureContribution: [],
    timeSeriesAnomalies: [],
  }), []);

  useEffect(() => {
    let isMounted = true;

    // Abort previous request if exists
    if (abortControllerRef.current) abortControllerRef.current.abort('Filter changed');

    // Create new AbortController for this request
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filterParams: Record<string, any> = {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          severityLevels: filters.severityLevels.length > 0 ? filters.severityLevels : undefined,
          segments: filters.segments.length > 0 ? filters.segments : undefined,
          regions: filters.regions.length > 0 ? filters.regions : undefined,
          contamination: filters.contamination || 0.1,
          search: filters.search || undefined,
        };

        console.log('[useAnomalyData] Fetching with params:', filterParams);
        const summaryResponse = await client.fetchSummary(filterParams, { signal: ac.signal } as any);
        console.log('[useAnomalyData] Response received:', summaryResponse);

        const effective = summaryResponse ? normalizeSummary(summaryResponse) : emptyData;

        const isEmpty = !effective.customerAnomalies || effective.customerAnomalies.length === 0;
        setHasNoData(isEmpty);

        setData(effective);
        lastGoodDataRef.current = effective;

        // Process customer anomalies
        setCustomerAnomalies(effective.customerAnomalies.map((c: any) => ({
          ...c,
          id: c.customer_id,
          name: c.customer_name || `Customer ${c.customer_id}`,
          riskLevel: c.severity_level >= 4 ? 'Very High' :
                     c.severity_level >= 3 ? 'High' :
                     c.severity_level >= 2 ? 'Medium' : 'Low',
        })));

        // Process segment distribution
        setSegmentDistribution(effective.segmentDistribution);

        // Process region distribution
        setRegionDistribution(effective.regionDistribution);

        // Process severity distribution
        setSeverityDistribution(effective.severityDistribution.map((s: any) => ({
          ...s,
          color: s.severity_level === 5 ? '#e930ff' :
                 s.severity_level === 4 ? '#aa45dd' :
                 s.severity_level === 3 ? '#5891cb' :
                 s.severity_level === 2 ? '#5fd4d6' : '#00e0ff'
        })));

        // Process feature importance
        setFeatureImportance(effective.featureImportance.map((f: any) => ({
          ...f,
          displayName: f.name || f.feature,
          percentage: (f.importance * 100).toFixed(1),
        })));

        // Process feature contribution
        setFeatureContribution(effective.featureContribution);

        // Process time series anomalies
        setTimeSeriesAnomalies(effective.timeSeriesAnomalies);

      } catch (err: any) {
        // Check if it's an abort error
        const isAbortError =
          err?.name === "AbortError" ||
          err?.code === 20 ||
          err?.message === "Filter changed" ||
          err?.message === "Cleanup" ||
          err?.message?.includes("abort") ||
          err?.message?.includes("cancelled") ||
          err?.message?.includes("aborted");

        if (isAbortError) {
          // This is expected behavior when component unmounts or filters change
          return;
        }

        // Only log actual errors, not abort/cleanup events
        if (!err?.message?.includes("Cleanup")) {
          console.error("Error fetching anomaly data:", err);
        }

        if (isMounted && !err?.message?.includes("Cleanup")) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
          if (lastGoodDataRef.current) {
            const stable = lastGoodDataRef.current;
            setData(stable);
            setHasNoData(!stable.customerAnomalies || stable.customerAnomalies.length === 0);
          } else {
            setData(emptyData);
            setCustomerAnomalies([]);
            setSegmentDistribution([]);
            setRegionDistribution([]);
            setSeverityDistribution([]);
            setFeatureImportance([]);
            setFeatureContribution([]);
            setTimeSeriesAnomalies([]);
            setHasNoData(true);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Cleanup');
      }
      abortControllerRef.current = null;
    };
  }, [filters, client, emptyData]);

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    if (!data || hasNoData) {
      return {
        anomalyRate: 0,
        highSeverityCount: 0,
        topAnomalousFeature: 'N/A',
        meanAnomalyScore: 0,
        newAnomalies: 0,
      };
    }

    const totalCustomers = customerAnomalies.length;
    const anomalousCustomers = customerAnomalies.filter((c: any) => c.is_anomaly).length;
    const anomalyRate = totalCustomers > 0 ? (anomalousCustomers / totalCustomers) * 100 : 0;

    const highSeverityCount = customerAnomalies.filter((c: any) => c.severity_level >= 4).length;

    const topFeature = featureImportance[0]?.displayName || 'N/A';

    const meanScore = customerAnomalies.reduce((sum: number, c: any) => sum + (c.anomaly_score || 0), 0) / Math.max(totalCustomers, 1);

    // Count new anomalies (last 24h - simplified for demo)
    const newAnomalies = Math.floor(anomalousCustomers * 0.15); // Simulating 15% are new

    return {
      anomalyRate: anomalyRate.toFixed(1),
      highSeverityCount,
      topAnomalousFeature: topFeature,
      meanAnomalyScore: meanScore.toFixed(2),
      newAnomalies,
    };
  }, [data, customerAnomalies, featureImportance, hasNoData]);

  return {
    loading,
    error,
    data,
    customerAnomalies,
    segmentDistribution,
    regionDistribution,
    severityDistribution,
    featureImportance,
    featureContribution,
    timeSeriesAnomalies,
    hasNoData,
    kpiMetrics,
    client
  };
}