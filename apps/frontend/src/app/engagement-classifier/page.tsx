"use client";

import React from 'react';
import {
  DashboardSection,
  ChartCard,
  PageLoader
} from 'components/index';
import {
  EngagementKPIs,
  EngagementPyramid,
  EngagementTimeline,
  OpportunityFinder,
  CustomerClassification
} from './components';
import { useEngagementClassifierContext } from './context';
import { useEngagementClassifierData } from './hooks/useEngagementClassifierData';

export default function EngagementClassifierPage() {
  const {
    filters,
    selectionManager,
    setEngagementData
  } = useEngagementClassifierContext();

  const {
    loading,
    error,
    engagementDistribution,
    customerClassification,
    engagementScore,
    actionableInsights,
    engagementTimeline,
    hasNoData,
    kpiMetrics
  } = useEngagementClassifierData(filters);

  // Update context with data when available
  React.useEffect(() => {
    if (engagementDistribution && Array.isArray(engagementDistribution)) {
      // Pass the actual distribution data instead of creating fake individual records
      setEngagementData(engagementDistribution);
    }
  }, [JSON.stringify(engagementDistribution)]);

  const handleLevelClick = (level: string) => {
    selectionManager.addPoint({
      id: `engagement-level-${level}`,
      type: 'engagement_level',
      level: level
    });
  };

  const handlePeriodClick = (period: string) => {
    selectionManager.addPoint({
      id: `time-period-${period}`,
      type: 'time_period',
      period: period
    });
  };


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
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Engagement Classification",
      }}
    >
      <>
      <div id="key-metrics" />
      <DashboardSection title="Key Metrics">
        <EngagementKPIs metrics={kpiMetrics} loading={false} />
      </DashboardSection>

      <div id="engagement-analysis" />
      <DashboardSection title="Engagement Analysis">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <ChartCard
            title="Engagement Distribution Pyramid"
            className="glass-card card-hover"
          >
            <EngagementPyramid
              data={engagementDistribution}
              loading={false}
              onLevelClick={handleLevelClick}
            />
          </ChartCard>

          <ChartCard
            title="Engagement Activity Timeline"
            className="glass-card card-hover"
          >
            <EngagementTimeline
              data={engagementTimeline}
              loading={false}
              onPeriodClick={handlePeriodClick}
            />
          </ChartCard>
        </div>
      </DashboardSection>

      <div id="customer-insights" />
      <DashboardSection title="Customer Insights">
        <ChartCard
          title="RFM Classification"
          className="glass-card card-hover"
        >
          <CustomerClassification data={customerClassification} loading={false} />
        </ChartCard>
      </DashboardSection>

      <div id="re-engagement" />
      <DashboardSection title="Re-engagement Opportunities">
        <ChartCard
          className="glass-card card-hover"
        >
          <OpportunityFinder data={actionableInsights} loading={false} />
        </ChartCard>
      </DashboardSection>

      </>
    </PageLoader>
  );
}