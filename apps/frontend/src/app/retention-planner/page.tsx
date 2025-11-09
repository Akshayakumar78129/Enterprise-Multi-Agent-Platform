"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection,
  PageLoader,
  FilterBar
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
  const { filters, setFilters, setRetentionData } = useRetentionPlannerContext();

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
  }, [retentionStrategies, churnRiskAnalysis]); // setRetentionData is stable, no need in deps

  // Error state with proper UI
  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Retention Planning Data Available
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "There's no customer retention data to display for the selected filters. Try adjusting your filters or check back later."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Retention Planning",
      }}
    >
      <div className="space-y-6">
        {/* Filters */}
        <DashboardSection>
          <FilterBar
            config={{
              dateRange: {
                enabled: true,
                value: filters.dateRange || { startDate: '2017-01-01', endDate: '2021-12-31' },
                onChange: (range) => {
                  if (range?.startDate && range?.endDate) {
                    setFilters({
                      ...filters,
                      dateRange: {
                        startDate: range.startDate,
                        endDate: range.endDate
                      }
                    });
                  }
                }
              },
            }}
            onReset={() => {
              setFilters({
                dateRange: {
                  startDate: '2017-01-01',
                  endDate: '2021-12-31'
                }
              });
            }}
            showResetButton={true}
          />
        </DashboardSection>

        <div id="key-metrics" />
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Retention Planning Overview</h3>
          <RetentionKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

      <div id="retention-analysis" />
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
    </PageLoader>
  );
}