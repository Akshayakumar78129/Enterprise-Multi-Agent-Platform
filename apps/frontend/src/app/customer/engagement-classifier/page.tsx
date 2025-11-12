"use client";

import React from 'react';
import {
  DashboardSection,
  ChartCard,
  PageLoader,
  getShiftClickManager
} from 'components/index';
import {
  EngagementKPIs,
  EngagementPyramid,
  EngagementTimeline,
  OpportunityFinder,
  CustomerClassification,
  CustomerSearchAnalytics
} from './components';
import { useEngagementClassifierContext } from './context';
import { useEngagementClassifierData } from './hooks/useEngagementClassifierData';

export default function EngagementClassifierPage() {
  const {
    filters,
    selectionManager,
    setEngagementData
  } = useEngagementClassifierContext();
  const shiftClickManager = getShiftClickManager();

  const {
    loading,
    error,
    isFetching,
    engagementDistribution,
    customerClassification,
    engagementScore,
    actionableInsights,
    engagementTimeline,
    hasNoData,
    kpiMetrics,
    customers
  } = useEngagementClassifierData(filters);

  // Update context with data when available (using memoized array from hook)
  React.useEffect(() => {
    if (engagementDistribution && Array.isArray(engagementDistribution)) {
      // Pass the actual distribution data instead of creating fake individual records
      setEngagementData(engagementDistribution);
    }
  }, [engagementDistribution, setEngagementData]);

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
      {/* Background refetch indicator */}
      {isFetching && !loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Updating...
          </div>
        </div>
      )}

      <div id="key-metrics" />
      <DashboardSection title="Key Metrics">
        <EngagementKPIs metrics={kpiMetrics} loading={false} />
      </DashboardSection>

      <div id="engagement-analysis" />
      <DashboardSection>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Engagement Distribution Pyramid</h3>
            <ChartCard
              className="glass-card card-hover h-full"
              onShiftClick={(event) => {
                shiftClickManager.addPoint({
                  label: "Engagement Distribution Pyramid",
                  value: `Customer engagement level distribution`,
                  source: 'Engagement Dashboard - Pyramid'
                }, event.nativeEvent);
              }}
            >
              <EngagementPyramid
                data={engagementDistribution}
                loading={false}
                onLevelClick={handleLevelClick}
              />
            </ChartCard>
          </div>

          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Engagement Activity Timeline</h3>
            <ChartCard
              className="glass-card card-hover h-full"
              onShiftClick={(event) => {
                shiftClickManager.addPoint({
                  label: "Engagement Activity Timeline",
                  value: `Engagement trends over time`,
                  source: 'Engagement Dashboard - Timeline'
                }, event.nativeEvent);
              }}
            >
              <EngagementTimeline
                data={engagementTimeline}
                loading={false}
                onPeriodClick={handlePeriodClick}
              />
            </ChartCard>
          </div>
        </div>
      </DashboardSection>

      <div id="customer-insights" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">RFM Classification</h3>
        <ChartCard
            className="glass-card card-hover"
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "RFM Classification",
                value: `Customer RFM segmentation analysis`,
                source: 'Engagement Dashboard - RFM'
              }, event.nativeEvent);
            }}
          >
            <CustomerClassification data={customerClassification} loading={false} />
          </ChartCard>
      </DashboardSection>

      <div id="re-engagement" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Re-engagement Opportunities</h3>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Re-engagement Opportunities",
              value: `Actionable customer re-engagement insights`,
              source: 'Engagement Dashboard - Opportunities'
            }, event.nativeEvent);
          }}
        >
          <OpportunityFinder data={actionableInsights} loading={false} />
        </ChartCard>
      </DashboardSection>

      <div id="customer-details" />
      <DashboardSection>
        <CustomerSearchAnalytics />
      </DashboardSection>

      </>
    </PageLoader>
  );
}