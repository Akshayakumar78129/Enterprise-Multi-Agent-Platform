"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  RetentionKPIs,
  RetentionStrategies,
  ChurnRiskAnalysis,
  CustomerLifecycle,
  RetentionCampaigns,
  ROIProjections
} from './components';
import { useRetentionPlannerContext } from './context';
import { useRetentionPlannerData } from './hooks/useRetentionPlannerData';

export default function RetentionPlannerPage() {
  const { filters, setRetentionData } = useRetentionPlannerContext();

  const {
    loading,
    error,
    retentionStrategies,
    churnRiskAnalysis,
    customerLifecycle,
    retentionCampaigns,
    hasNoData,
    kpiMetrics
  } = useRetentionPlannerData(filters);

  React.useEffect(() => {
    setRetentionData({ retentionStrategies, churnRiskAnalysis });
  }, [retentionStrategies, churnRiskAnalysis, setRetentionData]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Retention Planning Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no customer retention data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardSection title="Customer Retention Planning Overview">
        <RetentionKPIs metrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      <DashboardGrid>
        <DashboardSection title="Retention Strategies" description="Recommended retention strategies">
          <RetentionStrategies data={retentionStrategies} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Churn Risk Analysis" description="Customers at risk of churning">
          <ChurnRiskAnalysis data={churnRiskAnalysis} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Customer Lifecycle" description="Customer lifecycle stages">
          <CustomerLifecycle data={customerLifecycle} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Retention Campaigns" description="Active and planned retention campaigns">
          <RetentionCampaigns data={retentionCampaigns} loading={loading} />
        </DashboardSection>

        <DashboardSection title="ROI Projections" description="Expected ROI from retention efforts" className="col-span-2">
          <ROIProjections data={retentionStrategies} loading={loading} />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}