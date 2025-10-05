"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  SalesKPIs,
  SalesOverview,
  TopProducts,
  SalesTeamPerformance,
  RevenueTrends,
  SalesTargets
} from './components';
import { useSalesPerformanceContext } from './context';
import { useSalesPerformanceData } from './hooks/useSalesPerformanceData';

export default function SalesPerformancePage() {
  const { filters } = useSalesPerformanceContext();

  const {
    loading,
    error,
    salesOverview,
    topProducts,
    teamPerformance,
    revenueTrends,
    salesTargets,
    hasNoData,
    kpiMetrics
  } = useSalesPerformanceData(filters);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Sales Performance Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no sales performance data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Section */}
      <DashboardSection title="Sales Performance Overview">
        <SalesKPIs
          metrics={kpiMetrics}
          loading={loading}
        />
      </DashboardSection>

      {/* Chatbot & BI Panel Section - Similar to Churn */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <DashboardSection title="AI Assistant">
          <div className="h-[400px] border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              AI Chatbot for sales insights will be integrated here
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="BI Panel">
          <div className="h-[400px] border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              Business Intelligence panel for sales analysis will be integrated here
            </div>
          </div>
        </DashboardSection>
      </div>

      {/* Main Analytics Grid */}
      <DashboardGrid>
        {/* Sales Overview */}
        <DashboardSection
          title="Sales Overview"
          description="Overall sales performance metrics"
        >
          <SalesOverview
            data={salesOverview}
            loading={loading}
          />
        </DashboardSection>

        {/* Top Products */}
        <DashboardSection
          title="Top Products"
          description="Best performing products"
        >
          <TopProducts
            data={topProducts}
            loading={loading}
          />
        </DashboardSection>

        {/* Sales Team Performance */}
        <DashboardSection
          title="Team Performance"
          description="Sales team metrics"
        >
          <SalesTeamPerformance
            data={teamPerformance}
            loading={loading}
          />
        </DashboardSection>

        {/* Sales Targets */}
        <DashboardSection
          title="Sales Targets"
          description="Target vs actual performance"
        >
          <SalesTargets
            data={salesTargets}
            loading={loading}
          />
        </DashboardSection>

        {/* Revenue Trends */}
        <DashboardSection
          title="Revenue Trends"
          description="Revenue trends over time"
          className="col-span-2"
        >
          <RevenueTrends
            data={revenueTrends}
            loading={loading}
          />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}