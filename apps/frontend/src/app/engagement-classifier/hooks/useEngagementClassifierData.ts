import { useState, useEffect, useRef } from 'react';
import { engagementClassifierService } from '../services/engagementClassifierService';

export interface EngagementFilters {
  startDate?: string;
  endDate?: string;
  engagementLevels?: string[];
  loyaltyStatus?: string[];
  minTransactions?: number;
  minLTVAmount?: number;
  rfmScoreMin?: number;
  rfmScoreMax?: number;
}

export function useEngagementClassifierData(filters: EngagementFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        // Transform filters to match backend format
        const apiFilters = {
          engagementLevels: filters.engagementLevels || [],
          loyaltyStatus: filters.loyaltyStatus || [],
          minTransactions: filters.minTransactions,
          minLTVAmount: filters.minLTVAmount,
          rfmScoreMin: filters.rfmScoreMin,
          rfmScoreMax: filters.rfmScoreMax,
        };

        // Always use startDate/endDate - no timeRange fallback
        if (filters.startDate && filters.endDate) {
          apiFilters.startDate = filters.startDate;
          apiFilters.endDate = filters.endDate;
        } else {
          // If no dates are set, use full year 2021 as default
          apiFilters.startDate = "2021-01-01";
          apiFilters.endDate = "2021-12-31";
        }

        const response = await engagementClassifierService.getDashboardSummary(apiFilters);

        // Check if the request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setData(response);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Request was cancelled, ignore
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        // Set default empty data on error
        setData({
          success: false,
          data: {
            customers: [],
            kpis: {
              total_customers: 0,
              avg_engagement_score: 0,
              avg_days_since_activity: 0,
              engagement_trend: 'Stable',
              reengagement_opportunities: 0,
              engagement_distribution: { high: 0, medium: 0, low: 0 }
            },
            distribution: [],
            rfm_analysis: [],
            opportunities: [],
            timeline: [],
            summary: {}
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup on unmount or when filters change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [JSON.stringify(filters)]); // Use JSON.stringify to detect deep changes

  // Extract data from response
  const responseData = data?.data || {};
  const kpiData = responseData.kpis || {};

  return {
    loading,
    error,
    // Main data for components
    engagementDistribution: responseData.distribution || [],
    customerClassification: responseData.rfm_analysis || [],
    engagementScore: data?.engagementScore || {
      current: kpiData.avg_engagement_score || 0,
      previous: kpiData.previous_avg_engagement_score || 0,
      trend: kpiData.engagement_trend_direction || 'stable'
    },
    actionableInsights: responseData.opportunities || [],
    engagementTimeline: responseData.timeline || [],
    opportunities: responseData.opportunities || [],

    // KPI metrics for tiles
    kpiMetrics: {
      totalCustomers: kpiData.total_customers || 0,
      highlyEngaged: kpiData.engagement_distribution?.high || 0,
      atRiskCount: kpiData.engagement_distribution?.low || 0,
      avgEngagementScore: kpiData.avg_engagement_score || 0,
      engagementTrend: kpiData.engagement_trend || "Stable",
      reengagementOpportunities: kpiData.reengagement_opportunities || 0,
      avgDaysSinceActivity: kpiData.avg_days_since_activity || 0,
    },

    // Additional data
    customers: responseData.customers || [],
    summary: responseData.summary || {},
    mlResults: data?.mlResults || {},

    // Status flags
    hasNoData: !responseData.customers || responseData.customers.length === 0,

    // Raw response for debugging
    rawResponse: data
  };
}