"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  InsightKPIs,
  EngagementOverview,
  CustomerProfiles,
  BehaviorInsights,
  Recommendations,
  TrendAnalysis
} from './components';
import { useCustomerInsightsContext } from './context';
import { useCustomerInsightsData } from './hooks/useCustomerInsightsData';

export default function CustomerInsightsPage() {
  const { filters, setInsightData } = useCustomerInsightsContext();

  const {
    loading,
    error,
    engagementOverview,
    customerProfiles,
    behaviorInsights,
    recommendations,
    hasNoData,
    kpiMetrics
  } = useCustomerInsightsData(filters);

  React.useEffect(() => {
    setInsightData({ engagementOverview, customerProfiles, behaviorInsights });
  }, [engagementOverview, customerProfiles, behaviorInsights, setInsightData]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Customer Insights Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no customer insights data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Section */}
      <DashboardSection title="Customer Insights Overview">
        <InsightKPIs
          metrics={kpiMetrics}
          loading={loading}
        />
      </DashboardSection>

      {/* Main Analytics Grid */}
      <DashboardGrid>
        {/* Engagement Overview */}
        <DashboardSection
          title="Engagement Overview"
          description="Customer engagement levels and patterns"
        >
          <EngagementOverview
            data={engagementOverview}
            loading={loading}
          />
        </DashboardSection>

        {/* Customer Profiles */}
        <DashboardSection
          title="Customer Profiles"
          description="Detailed customer profile analysis"
        >
          <CustomerProfiles
            data={customerProfiles}
            loading={loading}
          />
        </DashboardSection>

        {/* Behavior Insights */}
        <DashboardSection
          title="Behavior Insights"
          description="AI-powered behavioral analysis"
        >
          <BehaviorInsights
            data={behaviorInsights}
            loading={loading}
          />
        </DashboardSection>

        {/* Recommendations */}
        <DashboardSection
          title="AI Recommendations"
          description="Actionable insights and recommendations"
        >
          <Recommendations
            data={recommendations}
            loading={loading}
          />
        </DashboardSection>

        {/* Trend Analysis */}
        <DashboardSection
          title="Trend Analysis"
          description="Customer insights trends over time"
          className="col-span-2"
        >
          <TrendAnalysis
            data={engagementOverview}
            loading={loading}
          />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}