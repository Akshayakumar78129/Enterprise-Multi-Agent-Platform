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

interface ChurnFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  riskLevels: string[];
  segments: string[];
  productCategories?: string[];
  search: string;
}

export function useChurnData(filters: ChurnFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const lastGoodDataRef = useRef<any>(null);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [segmentComparison, setSegmentComparison] = useState<any[]>([]);
  const [riskTrends, setRiskTrends] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [hasNoData, setHasNoData] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Map frontend segment labels to backend values
  const segmentMap: Record<string, string> = {
    'Enterprise': 'High-Value',
    'Mid-Market': 'Mid-Value',
    'Small Business': 'Standard',
    'Startup': 'Small'
  };

  // Reverse map for display (backend to frontend)
  const segmentDisplayMap: Record<string, string> = {
    'High-Value': 'Enterprise',
    'Mid-Value': 'Mid-Market',
    'Standard': 'Small Business',
    'Small': 'Startup'
  };

  const client = useMemo(() => getDashboardClient("churn"), []);
  function normalizeSummary(summary: any) {
    const s = summary || {};

    const segmentRisk = s.segmentRisk || s.segment_risk || s.segmentRisks || s.segment_risks || [];

    const rawBuckets = s.probabilityDistribution || s.probability_distribution || s.probabilityBuckets || s.buckets || [];
    const probabilityDistribution = rawBuckets.map((b: any) => {
      if (b?.range) return { range: b.range, count: Number(b.count ?? 0) };
      const start = b?.start ?? b?.binStart ?? b?.from ?? 0;
      const end = b?.end ?? b?.binEnd ?? b?.to ?? start;
      return { range: `${start}-${end}`, count: Number(b?.count ?? 0) };
    });

    const monthlyRisk = s.monthlyRisk || s.monthly_risk || s.riskOverTime || [];
    const featureImportance = s.featureImportance || s.feature_importance || s.features || [];
    const customerStats = s.customerStats || s.customers || s.customer_stats || [];

    return {
      segmentRisk,
      probabilityDistribution,
      monthlyRisk,
      featureImportance,
      customerStats,
    };
  }

  const emptyData = useMemo(() => ({
    segmentRisk: [],
    probabilityDistribution: [],
    monthlyRisk: [],
    featureImportance: [],
    customerStats: [],
  }), []);

  useEffect(() => {
    let isMounted = true;

    // Abort previous request if exists (switching to latest)
    if (abortControllerRef.current) abortControllerRef.current.abort('Filter changed');

    // Create new AbortController for this request
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filterParams: Record<string, any> = {
          riskLevels: filters.riskLevels.length > 0 ? filters.riskLevels : undefined,
          segments: filters.segments.length > 0 ? filters.segments.map(s => segmentMap[s] || s) : undefined,
          productCategories: filters.productCategories && filters.productCategories.length > 0 ? filters.productCategories : undefined,
        };

        // Always use dateRange - no timeRange fallback
        if (filters.dateRange.startDate && filters.dateRange.endDate) {
          filterParams.dateFrom = filters.dateRange.startDate;
          filterParams.dateTo = filters.dateRange.endDate;
        } else {
          // If no dates are set (shouldn't happen with new defaults), use full year 2021
          filterParams.dateFrom = "2021-01-01";
          filterParams.dateTo = "2021-12-31";
        }

        console.log('[useChurnData] Fetching with params:', filterParams);
        const summaryResponse = await client.fetchSummary(filterParams, { signal: ac.signal } as any) as any;
        console.log('[useChurnData] Response received:', summaryResponse);
        const effective = summaryResponse ? normalizeSummary(summaryResponse) : emptyData;

        const isEmpty = !effective.customerStats || effective.customerStats.length === 0;
        setHasNoData(isEmpty);

        setData(effective);
        lastGoodDataRef.current = effective;

        setFeatureImportance(((effective as any).featureImportance || []).map((f: any) => ({
          name: f.name ?? f.factor ?? "Feature",
          importance: Number(f.importance ?? 0),
          impact: Number(f.impact ?? f.importance ?? 0),
          icon: f.icon,
          color: f.color,
        })));

        const riskLevels = ["Very High", "High", "Medium", "Low"] as const;
        const segMatrix = ((effective as any).segmentRisk || []).flatMap((seg: any) => {
          return riskLevels.map((level) => {
            const key = level.toLowerCase().replace(" ", "_");
            return {
              segment: segmentDisplayMap[seg.segment] || seg.segment, // Map to frontend display names
              riskLevel: level,
              count: Number(seg[key] ?? 0),
              percentage: 0,
            };
          });
        });
        setSegmentComparison(segMatrix);

        setRiskTrends(((effective as any).monthlyRisk || []).map((m: any) => ({
          date: m.month,
          low: Number(m.low_risk ?? m.low ?? 0),
          medium: Number(m.medium_risk ?? m.medium ?? 0),
          high: Number(m.high_risk ?? m.high ?? 0),
          veryHigh: Number(m.very_high_risk ?? m.veryHigh ?? 0),
        })));

        setCustomers(((effective as any).customerStats || []).map((c: any, index: number) => ({
          id: String(c.id ?? c.customer_id ?? index),
          name: c.name ?? c.customer_name ?? `Customer ${index + 1}`,
          customerId: Number(c.customerId ?? c.customer_id ?? index),
          clv: Number(c.clv ?? c.lifetime_sales ?? 0),
          riskLevel: c.riskLevel ?? c.risk_level ?? "Low",
          riskPercentage: c.riskPercentage ?? Math.round((c.churn_probability ?? 0) * 100),
        })));
      } catch (err: any) {
        // Check if it's an abort error (various forms)
        const isAbortError =
          err?.name === "AbortError" ||
          err?.code === 20 ||
          err?.message === "Filter changed" ||
          err?.message === "Cleanup" ||
          err?.message?.includes("abort") ||
          err?.message?.includes("cancelled") ||
          err?.message?.includes("The user aborted a request");

        if (isAbortError) {
          // Don't log or change state on expected aborts - request was cancelled
          console.log("[useChurnData] Request cancelled (expected behavior on unmount or filter change)");
          return;
        }

        // Only log real errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!errorMessage.includes("Cleanup") && !errorMessage.includes("abort")) {
          console.error("Error fetching churn data:", err);
        }

        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
          if (lastGoodDataRef.current) {
            const stable = lastGoodDataRef.current;
            setData(stable);
            setHasNoData(!stable.customerStats || stable.customerStats.length === 0);
          } else {
            setData(emptyData);
            setFeatureImportance([]);
            setSegmentComparison([]);
            setRiskTrends([]);
            setCustomers([]);
            setHasNoData(true);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Fetch immediately (no debounce) so logs are visible and data loads reliably
    fetchData();

    return () => {
      isMounted = false;
      // Abort in-flight request on cleanup - only use 'Component unmounted' when truly unmounting
      if (abortControllerRef.current) {
        // This cleanup runs on dependency changes AND unmounting
        // We check isMounted to differentiate (though it's set to false above)
        abortControllerRef.current.abort('Cleanup');
      }
      abortControllerRef.current = null;
    };
  }, [filters, client]);

  const riskPyramidData = useMemo(() => {
    if (!data?.segmentRisk || data.segmentRisk.length === 0) {
      console.log('[useChurnData] No segmentRisk data available');
      return [];
    }

    console.log('[useChurnData] Processing segmentRisk:', data.segmentRisk);

    const totals = data.segmentRisk.reduce(
      (acc: any, seg: any) => {
        // Handle both snake_case and camelCase field names
        acc["Very High"] += Number(seg.very_high || seg.veryHigh || 0);
        acc.High += Number(seg.high || 0);
        acc.Medium += Number(seg.medium || 0);
        acc.Low += Number(seg.low || 0);
        return acc;
      },
      { "Very High": 0, High: 0, Medium: 0, Low: 0 }
    );

    const total = Object.values(totals).reduce((a: any, b: any) => a + b, 0);

    console.log('[useChurnData] Risk totals:', totals, 'Total customers:', total);

    // If no data, return empty array
    if (total === 0) {
      return [];
    }

    return [
      { level: "Very High", count: totals["Very High"], percentage: Number(((totals["Very High"] / total) * 100).toFixed(1)), color: "#ef4444" },
      { level: "High", count: totals.High, percentage: Number(((totals.High / total) * 100).toFixed(1)), color: "#f59e0b" },
      { level: "Medium", count: totals.Medium, percentage: Number(((totals.Medium / total) * 100).toFixed(1)), color: "#eab308" },
      { level: "Low", count: totals.Low, percentage: Number(((totals.Low / total) * 100).toFixed(1)), color: "#10b981" },
    ];
  }, [data]);

  const probabilityArray = useMemo(() => {
    const dist = data?.probabilityDistribution as Array<{ range: string; count: number }> | undefined;
    if (!dist || dist.length === 0) return [];
    const arr: number[] = [];
    dist.forEach((bucket) => {
      const [start, end] = bucket.range.split('-').map(parseFloat);
      const mid = (start + end) / 2;
      const repeats = Math.min(bucket.count, 500);
      for (let i = 0; i < repeats; i++) arr.push(mid);
    });
    return arr;
  }, [data]);

  // Calculate KPI metrics from data
  const kpiMetrics = useMemo(() => {
    if (!data || !customers.length) return {};

    const highRisk = customers.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Very High').length;
    const totalCustomers = customers.length;
    const avgRisk = customers.reduce((sum, c) => sum + (c.riskPercentage || 0), 0) / totalCustomers;
    const totalCLVAtRisk = customers
      .filter(c => c.riskLevel === 'High' || c.riskLevel === 'Very High')
      .reduce((sum, c) => sum + (c.clv || 0), 0);

    return {
      totalCustomers,
      highRiskCount: highRisk,
      avgRiskPercentage: avgRisk.toFixed(1),
      totalCLVAtRisk: totalCLVAtRisk.toFixed(0)
    };
  }, [data, customers]);

  // Generate simple insights
  const insights = useMemo(() => {
    if (!customers.length) return [];

    const highRisk = customers.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Very High');
    const veryHighRisk = customers.filter(c => c.riskLevel === 'Very High');

    const insightsList = [];

    if (veryHighRisk.length > 0) {
      insightsList.push(`${veryHighRisk.length} customers at very high churn risk require immediate attention`);
    }

    if (highRisk.length > 0) {
      const riskPct = ((highRisk.length / customers.length) * 100).toFixed(1);
      insightsList.push(`${highRisk.length} customers (${riskPct}%) are at high or very high churn risk`);
    }

    if (featureImportance.length > 0) {
      const topFactor = featureImportance[0];
      insightsList.push(`${topFactor.name} is the top factor influencing churn with ${topFactor.importance}% importance`);
    }

    return insightsList;
  }, [customers, featureImportance]);

  return {
    loading,
    error,
    data,
    featureImportance,
    segmentComparison,
    riskTrends,
    customers,
    riskPyramidData,
    probabilityArray,
    hasNoData,
    insights,
    kpiMetrics,
    client
  };
}