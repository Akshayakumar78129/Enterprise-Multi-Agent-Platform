import { useEffect, useState, useMemo, useRef } from "react";

function getDashboardClient(dashboardType: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // Special handling for customer-behavior endpoint
  const endpoint = dashboardType === 'behavior' ? 'customer-behavior' : dashboardType;

  return {
    fetchSummary: async (params: any, options?: RequestInit) => {
      const response = await fetch(
        `${apiUrl}/${endpoint}/summary`,
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

interface BehaviorFilters {
  timePeriod: string;
  segmentId: string | null;
  segmentIds?: string[];  // Support multiple segments
  behaviorTypes: string[];
  minTransactions: number;
  customerIds: string[];
  loyaltyStatus: string[];
}

export function useBehaviorData(filters: BehaviorFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const lastGoodDataRef = useRef<any>(null);
  const [purchasePatterns, setPurchasePatterns] = useState<any>(null);
  const [productPreferences, setProductPreferences] = useState<any>(null);
  const [channelUsage, setChannelUsage] = useState<any>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null);
  const [customerSegments, setCustomerSegments] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [hasNoData, setHasNoData] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const client = useMemo(() => getDashboardClient("customer-behavior"), []);

  function normalizeSummary(summary: any) {
    const s = summary || {};

    // Normalize channel usage to ensure channel_distribution is available
    const channelUsage = s.channelUsage || s.channel_usage || {};
    if (channelUsage.channelDistribution && !channelUsage.channel_distribution) {
      channelUsage.channel_distribution = channelUsage.channelDistribution;
    }

    // Normalize engagement metrics
    const engagementMetrics = s.engagementMetrics || s.engagement_metrics || {};

    // Normalize product preferences
    const productPreferences = s.productPreferences || s.product_preferences || {};
    if (!productPreferences.topCategories && productPreferences.top_categories) {
      productPreferences.topCategories = productPreferences.top_categories;
    }

    return {
      purchasePatterns: s.purchasePatterns || s.purchase_patterns || {},
      productPreferences,
      channelUsage,
      engagementMetrics,
      customerSegments: s.customerSegments || s.customer_segments || [],
      topCustomers: s.topCustomers || s.top_customers || [],
      behaviorTrends: s.behaviorTrends || s.behavior_trends || [],
      rfmAnalysis: s.rfmAnalysis || s.rfm_analysis || {},
      clvAnalysis: s.clvAnalysis || s.clv_analysis || {},
    };
  }

  const emptyData = useMemo(() => ({
    purchasePatterns: {},
    productPreferences: {},
    channelUsage: {},
    engagementMetrics: {},
    customerSegments: [],
    topCustomers: [],
    behaviorTrends: [],
    rfmAnalysis: {},
    clvAnalysis: {},
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
          time_period: filters.timePeriod,
          segment_id: filters.segmentId ? parseInt(filters.segmentId) : null,
          segment_ids: filters.segmentIds && filters.segmentIds.length > 0 ? filters.segmentIds : undefined,
          behavior_types: filters.behaviorTypes.length > 0 ? filters.behaviorTypes : ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"],
          min_transactions: filters.minTransactions || 2,
          customer_ids: filters.customerIds.length > 0 ? filters.customerIds : undefined,
          loyalty_status: filters.loyaltyStatus.length > 0 ? filters.loyaltyStatus : undefined,
        };

        console.log('[useBehaviorData] Fetching with params:', filterParams);
        const summaryResponse = await client.fetchSummary(filterParams, { signal: ac.signal } as any);
        console.log('[useBehaviorData] Response received:', summaryResponse);

        const effective = summaryResponse ? normalizeSummary(summaryResponse) : emptyData;

        const isEmpty = !effective.topCustomers || effective.topCustomers.length === 0;
        setHasNoData(isEmpty);

        setData(effective);
        lastGoodDataRef.current = effective;

        // Process purchase patterns
        setPurchasePatterns(effective.purchasePatterns);

        // Process product preferences
        setProductPreferences(effective.productPreferences);

        // Process channel usage
        setChannelUsage(effective.channelUsage);

        // Process engagement metrics
        setEngagementMetrics(effective.engagementMetrics);

        // Process customer segments
        setCustomerSegments(effective.customerSegments);

        // Process top customers - preserve original field names
        setTopCustomers(effective.topCustomers.map((c: any) => ({
          ...c,
          id: c.customerId || c.customer_id,
          name: c.customerName || c.customer_name || `Customer ${c.customerId || c.customer_id}`,
          segment: c.customerType || c.customer_type || c.segment || 'Unknown',
          avgOrderValue: c.avgOrderValue || 0,
          totalSpend: c.totalSpend || 0,
          transactionCount: c.transactionCount || 0,
          engagementScore: c.engagementScore || c.engagement_score || 0,
          riskLevel: c.engagementScore && c.engagementScore < 0.3 ? 'High' :
                     c.engagementScore && c.engagementScore < 0.6 ? 'Medium' : 'Low',
        })));

      } catch (err: any) {
        // Check if it's an abort error
        const errString = String(err);
        const isAbortError =
          err?.name === "AbortError" ||
          err?.code === 20 ||
          err?.message === "Filter changed" ||
          err?.message === "Cleanup" ||
          err === "Cleanup" ||
          errString === "Cleanup" ||
          errString.includes("Cleanup") ||
          err?.message?.includes("abort") ||
          err?.message?.includes("cancelled");

        if (isAbortError) {
          console.log("[useBehaviorData] Request cancelled (expected behavior)");
          return;
        }
        console.error("Error fetching behavior data:", err);

        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
          if (lastGoodDataRef.current) {
            const stable = lastGoodDataRef.current;
            setData(stable);
            setHasNoData(!stable.topCustomers || stable.topCustomers.length === 0);
          } else {
            setData(emptyData);
            setPurchasePatterns(null);
            setProductPreferences(null);
            setChannelUsage(null);
            setEngagementMetrics(null);
            setCustomerSegments([]);
            setTopCustomers([]);
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
        avgFrequency: 0,
        avgOrderValue: 0,
        topCategory: 'N/A',
        primaryChannel: 'N/A',
        avgEngagement: 0,
      };
    }

    // Use correct field names based on API response
    const avgFrequency = purchasePatterns?.avgDaysBetweenPurchases || 0;

    // Calculate average order value from top customers
    let avgOrderValue = 0;
    if (topCustomers && topCustomers.length > 0) {
      const totalAvgOrderValue = topCustomers.reduce((sum, c) =>
        sum + (c.avgOrderValue || 0), 0);
      avgOrderValue = totalAvgOrderValue / topCustomers.length;
    }

    // Get top category from product preferences
    const topCategory = productPreferences?.topCategories?.[0]?.category ||
                       productPreferences?.topCategories?.[0]?.name || 'N/A';

    // Get primary channel from channel usage distribution
    const channelDist = channelUsage?.channelDistribution || {};
    const primaryChannel = Object.entries(channelDist)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';

    const avgEngagement = engagementMetrics?.avgEngagementScore || 0;

    return {
      avgFrequency: avgFrequency.toFixed(1),
      avgOrderValue: avgOrderValue.toFixed(2),
      topCategory,
      primaryChannel,
      avgEngagement: avgEngagement.toFixed(2),
    };
  }, [data, purchasePatterns, productPreferences, channelUsage, engagementMetrics, topCustomers, hasNoData]);

  return {
    loading,
    error,
    data,
    purchasePatterns,
    productPreferences,
    channelUsage,
    engagementMetrics,
    customerSegments,
    topCustomers,
    hasNoData,
    kpiMetrics,
    client
  };
}