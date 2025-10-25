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
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Retention Planning Overview</h3>
        <RetentionKPIs metrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      <DashboardGrid>
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Retention Strategies</h3>
          <RetentionStrategies data={retentionStrategies} loading={loading} />
        </DashboardSection>

        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Churn Risk Analysis</h3>
          <ChurnRiskAnalysis data={churnRiskAnalysis} loading={loading} />
        </DashboardSection>

        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Lifecycle</h3>
          <CustomerLifecycle data={customerLifecycle} loading={loading} />
        </DashboardSection>

        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Retention Campaigns</h3>
          <RetentionCampaigns data={retentionCampaigns} loading={loading} />
        </DashboardSection>

        <DashboardSection className="col-span-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">ROI Projections</h3>
          <ROIProjections data={retentionStrategies} loading={loading} />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}