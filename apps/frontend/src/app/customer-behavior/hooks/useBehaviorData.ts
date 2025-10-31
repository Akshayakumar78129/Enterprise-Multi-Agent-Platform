import { useMemo } from "react";
import { useQuery } from '@tanstack/react-query';

function getDashboardClient(dashboardType: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // Special handling for customer-behavior endpoint
  const endpoint = dashboardType === 'behavior' ? 'customer-behavior' : dashboardType;

  return {
    fetchSummary: async (params: any) => {
      try {
        const response = await fetch(
          `${apiUrl}/${endpoint}/summary`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params || {})
          }
        );
        if (!response.ok) {
          console.warn(`Customer behavior API failed (${response.status}), using empty data`);
          return {
            purchasePatterns: { data: [] },
            productPreferences: { data: [] },
            channelUsage: { data: [] },
            engagementMetrics: { data: [] },
            customerSegments: [],
            topCustomers: []
          };
        }
        return response.json();
      } catch (error) {
        console.warn(`Customer behavior API error:`, error);
        return {
          purchasePatterns: { data: [] },
          productPreferences: { data: [] },
          channelUsage: { data: [] },
          engagementMetrics: { data: [] },
          customerSegments: [],
          topCustomers: []
        };
      }
    }
  };
}

interface BehaviorFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  segmentId: string | null;
  segmentIds?: string[];
  behaviorTypes: string[];
  minTransactions: number;
  customerIds: string[];
  loyaltyStatus: string[];
}

function normalizeSummary(summary: any) {
  const s = summary || {};
  const mainData = s.mainData || s;

  const channelUsage = mainData.channelUsage || mainData.channel_usage || {};
  if (channelUsage.channelDistribution && !channelUsage.channel_distribution) {
    channelUsage.channel_distribution = channelUsage.channelDistribution;
  }

  const engagementMetrics = mainData.engagementMetrics || mainData.engagement_metrics || {};
  const productPreferences = mainData.productPreferences || mainData.product_preferences || {};
  if (!productPreferences.topCategories && productPreferences.top_categories) {
    productPreferences.topCategories = productPreferences.top_categories;
  }

  const behavioralMetrics = mainData.behavioralMetrics || mainData.behavioral_metrics || {};

  const finalProductPreferences = productPreferences && Object.keys(productPreferences).length > 0
    ? productPreferences
    : behavioralMetrics.product_preferences || {};

  const finalChannelUsage = channelUsage && Object.keys(channelUsage).length > 0
    ? channelUsage
    : behavioralMetrics.channel_usage || {};

  return {
    purchasePatterns: mainData.purchasePatterns || mainData.purchase_patterns || {},
    productPreferences: finalProductPreferences,
    channelUsage: finalChannelUsage,
    engagementMetrics: engagementMetrics || {},
    customerSegments: mainData.customerSegments || mainData.customer_segments || [],
    topCustomers: mainData.topCustomers || mainData.top_customers || [],
    behaviorTrends: mainData.behaviorTrends || mainData.behavior_trends || [],
    rfmAnalysis: mainData.rfmAnalysis || mainData.rfm_analysis || {},
    clvAnalysis: mainData.clvAnalysis || mainData.clv_analysis || {},
    insights: s.insights || [],
    kpiMetrics: s.kpiMetrics || {}
  };
}

const emptyData = {
  purchasePatterns: {},
  productPreferences: {},
  channelUsage: {},
  engagementMetrics: {},
  customerSegments: [],
  topCustomers: [],
  behaviorTrends: [],
  rfmAnalysis: {},
  clvAnalysis: {},
  insights: [],
  kpiMetrics: {}
};

export function useBehaviorData(filters: BehaviorFilters) {
  const client = useMemo(() => getDashboardClient("customer-behavior"), []);

  // Map frontend filters to backend format
  const filterParams = useMemo(() => ({
    dateFrom: filters.dateRange.startDate,
    dateTo: filters.dateRange.endDate,
    segment_id: filters.segmentId ? parseInt(filters.segmentId) : null,
    segment_ids: filters.segmentIds && filters.segmentIds.length > 0 ? filters.segmentIds : undefined,
    behavior_types: filters.behaviorTypes.length > 0 ? filters.behaviorTypes : ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"],
    min_transactions: filters.minTransactions || 2,
    customer_ids: filters.customerIds.length > 0 ? filters.customerIds : undefined,
    loyalty_status: filters.loyaltyStatus.length > 0 ? filters.loyaltyStatus : undefined,
  }), [filters]);

  // Use React Query
  const { data: rawData, isLoading, error: queryError } = useQuery({
    queryKey: ['customer-behavior', filterParams],
    queryFn: () => client.fetchSummary(filterParams),
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  });

  // Normalize and process data
  const data = useMemo(() => {
    if (!rawData) return emptyData;
    return normalizeSummary(rawData);
  }, [rawData]);

  const hasNoData = useMemo(() => {
    return !data.topCustomers || data.topCustomers.length === 0;
  }, [data]);

  // Process top customers
  const topCustomers = useMemo(() => {
    const customers = data.topCustomers || [];
    return customers.length > 0 ? customers.map((c: any) => ({
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
    })) : [];
  }, [data]);

  // Use KPI metrics from backend or calculate fallback
  const kpiMetrics = useMemo(() => {
    // If backend provides kpiMetrics, use them directly
    if (data.kpiMetrics && Object.keys(data.kpiMetrics).length > 0) {
      const backendKpis = data.kpiMetrics;
      return {
        avgFrequency: backendKpis.avgDaysBetweenPurchases || backendKpis.avgFrequency || 0,
        avgOrderValue: backendKpis.avgOrderValue || 0,
        topCategory: backendKpis.topCategory || 'N/A',
        primaryChannel: backendKpis.primaryChannel || 'N/A',
        avgEngagement: backendKpis.avgEngagementScore || backendKpis.avgEngagement || 0,
      };
    }

    // Fallback: calculate from data if backend didn't provide
    if (!data || hasNoData) {
      return {
        avgFrequency: 0,
        avgOrderValue: 0,
        topCategory: 'N/A',
        primaryChannel: 'N/A',
        avgEngagement: 0,
      };
    }

    const avgFrequency = data.purchasePatterns?.avgDaysBetweenPurchases || 0;

    let avgOrderValue = 0;
    if (topCustomers && topCustomers.length > 0) {
      const totalAvgOrderValue = topCustomers.reduce((sum, c) =>
        sum + (c.avgOrderValue || 0), 0);
      avgOrderValue = totalAvgOrderValue / topCustomers.length;
    }

    const topCategory = data.productPreferences?.topCategories?.[0]?.category ||
                       data.productPreferences?.topCategories?.[0]?.name || 'N/A';

    const channelDist = data.channelUsage?.channelDistribution || {};
    const primaryChannel = Object.entries(channelDist)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';

    const avgEngagement = data.engagementMetrics?.avg_engagement_score || 
                         data.engagementMetrics?.avgEngagementScore || 0;

    return {
      avgFrequency: typeof avgFrequency === 'number' ? avgFrequency.toFixed(1) : avgFrequency,
      avgOrderValue: typeof avgOrderValue === 'number' ? avgOrderValue.toFixed(2) : avgOrderValue,
      topCategory,
      primaryChannel,
      avgEngagement: typeof avgEngagement === 'number' ? avgEngagement.toFixed(2) : avgEngagement,
    };
  }, [data, topCustomers, hasNoData]);

  return {
    loading: isLoading,
    error: queryError?.message || null,
    data,
    purchasePatterns: data.purchasePatterns,
    productPreferences: data.productPreferences,
    channelUsage: data.channelUsage,
    engagementMetrics: data.engagementMetrics,
    customerSegments: data.customerSegments,
    topCustomers,
    hasNoData,
    kpiMetrics,
    insights: data.insights || [],
    client
  };
}
