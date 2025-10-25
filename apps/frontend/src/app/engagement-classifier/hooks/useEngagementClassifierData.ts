import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { engagementClassifierService } from '../services/engagementClassifierService';

export interface EngagementFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  engagementLevels: string[];
  loyaltyStatus: string[];
  minTransactions?: number;
  minLTVAmount?: number;
  rfmScoreMin?: number;
  rfmScoreMax?: number;
}

export function useEngagementClassifierData(filters: EngagementFilters) {
  // Memoize filter params - map frontend dateRange to backend startDate/endDate
  const filterParams = useMemo(() => {
    const params: any = {
      startDate: filters.dateRange.startDate,
      endDate: filters.dateRange.endDate,
    };

    // Only include filters if they have values
    if (filters.engagementLevels.length > 0) {
      params.engagementLevels = filters.engagementLevels;
    }
    if (filters.loyaltyStatus.length > 0) {
      params.loyaltyStatus = filters.loyaltyStatus;
    }
    if (filters.minTransactions !== undefined && filters.minTransactions !== null) {
      params.minTransactions = filters.minTransactions;
    }
    if (filters.minLTVAmount !== undefined && filters.minLTVAmount !== null) {
      params.minLTVAmount = filters.minLTVAmount;
    }
    if (filters.rfmScoreMin !== undefined && filters.rfmScoreMin !== null) {
      params.rfmScoreMin = filters.rfmScoreMin;
    }
    if (filters.rfmScoreMax !== undefined && filters.rfmScoreMax !== null) {
      params.rfmScoreMax = filters.rfmScoreMax;
    }

    return params;
  }, [
    filters.dateRange.startDate,
    filters.dateRange.endDate,
    filters.engagementLevels,
    filters.loyaltyStatus,
    filters.minTransactions,
    filters.minLTVAmount,
    filters.rfmScoreMin,
    filters.rfmScoreMax,
  ]);

  // Use React Query for caching and automatic refetching
  const {
    data: rawData,
    isLoading: loading,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: ['engagement-classifier', filterParams],
    queryFn: () => engagementClassifierService.getDashboardSummary(filterParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract data from response
  const responseData = rawData?.data || {};
  const kpiData = responseData.kpis || {};

  // Memoize data arrays to prevent unnecessary re-renders
  const engagementDistribution = useMemo(() => responseData.distribution || [], [responseData.distribution]);
  const customerClassification = useMemo(() => responseData.rfm_analysis || [], [responseData.rfm_analysis]);
  const actionableInsights = useMemo(() => responseData.opportunities || [], [responseData.opportunities]);
  const engagementTimeline = useMemo(() => responseData.timeline || [], [responseData.timeline]);
  const customers = useMemo(() => responseData.customers || [], [responseData.customers]);
  const insights = useMemo(() => rawData?.insights || [], [rawData?.insights]);

  // Memoize engagement score object
  const engagementScore = useMemo(() => ({
    current: kpiData.avg_engagement_score || 0,
    previous: kpiData.previous_avg_engagement_score || 0,
    trend: kpiData.engagement_trend_direction || 'stable'
  }), [kpiData.avg_engagement_score, kpiData.previous_avg_engagement_score, kpiData.engagement_trend_direction]);

  // Memoize KPI metrics
  const kpiMetrics = useMemo(() => ({
    totalCustomers: kpiData.total_customers || 0,
    highlyEngaged: kpiData.engagement_distribution?.high || 0,
    atRiskCount: kpiData.engagement_distribution?.low || 0,
    avgEngagementScore: kpiData.avg_engagement_score || 0,
    engagementTrend: kpiData.engagement_trend || "Stable",
    reengagementOpportunities: kpiData.reengagement_opportunities || 0,
    avgDaysSinceActivity: kpiData.avg_days_since_activity || 0,
  }), [
    kpiData.total_customers,
    kpiData.engagement_distribution,
    kpiData.avg_engagement_score,
    kpiData.engagement_trend,
    kpiData.reengagement_opportunities,
    kpiData.avg_days_since_activity,
  ]);

  return {
    loading,
    error: queryError?.message || null,
    isFetching, // For background refetch indicator

    // Main data for components (memoized)
    engagementDistribution,
    customerClassification,
    engagementScore,
    actionableInsights,
    engagementTimeline,
    opportunities: actionableInsights, // Alias

    // KPI metrics for tiles (memoized)
    kpiMetrics,

    // Additional data (memoized)
    customers,
    summary: responseData.summary || {},
    mlResults: rawData?.mlResults || {},

    // Status flags
    hasNoData: customers.length === 0,

    // Insights from API (memoized)
    insights,

    // Raw response for debugging
    rawResponse: rawData
  };
}