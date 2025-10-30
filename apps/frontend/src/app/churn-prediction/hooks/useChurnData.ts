import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

async function fetchChurnSummary(filterParams: Record<string, any>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const response = await fetch(
    `${apiUrl}/churn/summary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filterParams),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch churn summary: ${response.statusText}`);
  }

  return response.json();
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
  // Map frontend segment values to backend values
  // CUSTOMER_SEGMENT_OPTIONS uses lowercase snake_case values like 'enterprise', 'mid_market'
  const segmentMap: Record<string, string> = {
    'enterprise': 'High-Value',
    'mid_market': 'Mid-Value',
    'small_business': 'Standard',
    'startup': 'Small',
    'individual': 'Small'  // Map individual to Small segment
  };

  // Reverse map for display (backend to frontend)
  const segmentDisplayMap: Record<string, string> = {
    'High-Value': 'Enterprise',
    'Mid-Value': 'Mid-Market',
    'Standard': 'Small Business',
    'Small': 'Startup'
  };

  // Build filter params
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {
      riskLevels: filters.riskLevels.length > 0 ? filters.riskLevels : undefined,
      segments: filters.segments.length > 0 ? filters.segments.map(s => segmentMap[s] || s) : undefined,
      productCategories: filters.productCategories && filters.productCategories.length > 0 ? filters.productCategories : undefined,
    };

    // Always use dateRange
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      params.dateFrom = filters.dateRange.startDate;
      params.dateTo = filters.dateRange.endDate;
    } else {
      // Default to full data range 2017-2021
      params.dateFrom = "2017-01-01";
      params.dateTo = "2021-12-31";
    }

    return params;
  }, [filters, segmentMap]);

  // Use React Query for data fetching with caching
  const {
    data: rawData,
    isLoading: loading,
    error: queryError,
    isFetching
  } = useQuery({
    queryKey: ['churn-prediction', filterParams],
    queryFn: () => fetchChurnSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch data") : null;

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

  // Normalize and process data
  const data = useMemo(() => {
    if (!rawData) return emptyData;
    return normalizeSummary(rawData);
  }, [rawData, emptyData]);

  const hasNoData = useMemo(() => {
    return !data.customerStats || data.customerStats.length === 0;
  }, [data]);

  // Process feature importance
  const featureImportance = useMemo(() => {
    return (data.featureImportance || []).map((f: any) => ({
      name: f.name ?? f.factor ?? "Feature",
      importance: Number(f.importance ?? 0),
      impact: Number(f.impact ?? f.importance ?? 0),
      icon: f.icon,
      color: f.color,
    }));
  }, [data]);

  // Process segment comparison
  const segmentComparison = useMemo(() => {
    const riskLevels = ["Very High", "High", "Medium", "Low"] as const;
    return (data.segmentRisk || []).flatMap((seg: any) => {
      return riskLevels.map((level) => {
        const key = level.toLowerCase().replace(" ", "_");
        return {
          segment: segmentDisplayMap[seg.segment] || seg.segment,
          riskLevel: level,
          count: Number(seg[key] ?? 0),
          percentage: 0,
        };
      });
    });
  }, [data, segmentDisplayMap]);

  // Process risk trends
  const riskTrends = useMemo(() => {
    return (data.monthlyRisk || []).map((m: any) => ({
      date: m.month,
      low: Number(m.low_risk ?? m.low ?? 0),
      medium: Number(m.medium_risk ?? m.medium ?? 0),
      high: Number(m.high_risk ?? m.high ?? 0),
      veryHigh: Number(m.very_high_risk ?? m.veryHigh ?? 0),
    }));
  }, [data]);

  // Process customers
  const customers = useMemo(() => {
    return (data.customerStats || []).map((c: any, index: number) => ({
      id: String(c.id ?? c.customer_id ?? index),
      name: c.name ?? c.customer_name ?? `Customer ${index + 1}`,
      customerId: Number(c.customerId ?? c.customer_id ?? index),
      clv: Number(c.clv ?? c.lifetime_sales ?? 0),
      riskLevel: c.riskLevel ?? c.risk_level ?? "Low",
      riskPercentage: c.riskPercentage ?? Math.round((c.churn_probability ?? 0) * 100),
    }));
  }, [data]);

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

  // Use unified insights from backend (combines rule-based + AI insights)
  const insights = useMemo(() => {
    // Backend now returns unified insights array (rule-based + AI combined)
    return rawData?.insights || [];
  }, [rawData]);

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
    isFetching, // Additional flag to show background refetching
  };
}