"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  EngagementKPIs,
  EngagementDistribution,
  CustomerClassification,
  EngagementScore,
  ActionableInsights,
  EngagementTrends
} from './components';
import { useEngagementClassifierContext } from './context';
import { useEngagementClassifierData } from './hooks/useEngagementClassifierData';

export default function EngagementClassifierPage() {
  const { filters, setEngagementData } = useEngagementClassifierContext();

  const {
    loading,
    error,
    engagementDistribution,
    customerClassification,
    engagementScore,
    actionableInsights,
    hasNoData,
    kpiMetrics
  } = useEngagementClassifierData(filters);

  React.useEffect(() => {
    setEngagementData({ engagementDistribution, customerClassification });
  }, [engagementDistribution, customerClassification, setEngagementData]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Engagement Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no customer engagement data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardSection title="Customer Engagement Overview">
        <EngagementKPIs metrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      <DashboardGrid>
        <DashboardSection title="Engagement Distribution" description="Customer engagement levels">
          <EngagementDistribution data={engagementDistribution} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Customer Classification" description="Engagement-based customer segments">
          <CustomerClassification data={customerClassification} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Engagement Scoring" description="ML-based engagement scores">
          <EngagementScore data={engagementScore} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Actionable Insights" description="Recommendations for engagement improvement">
          <ActionableInsights data={actionableInsights} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Engagement Trends" description="Engagement trends over time" className="col-span-2">
          <EngagementTrends data={engagementDistribution} loading={loading} />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}