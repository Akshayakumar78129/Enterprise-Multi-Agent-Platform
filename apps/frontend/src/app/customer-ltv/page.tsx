"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  LtvKPIs,
  LtvDistribution,
  SegmentAnalysis,
  LtvTrends,
  TopCustomers
} from './components';
import { useCustomerLtvContext } from './context';
import { useCustomerLtvData } from './hooks/useCustomerLtvData';

export default function CustomerLtvPage() {
  const { filters, setLtvData } = useCustomerLtvContext();

  const {
    loading,
    error,
    ltvDistribution,
    segmentAnalysis,
    ltvTrends,
    topCustomers,
    kpiMetrics,
    hasNoData
  } = useCustomerLtvData(filters);

  React.useEffect(() => {
    setLtvData({ ltvDistribution, segmentAnalysis, topCustomers });
  }, [ltvDistribution, segmentAnalysis, topCustomers, setLtvData]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No LTV Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no lifetime value data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Section */}
      <DashboardSection title="LTV Overview">
        <LtvKPIs
          metrics={kpiMetrics}
          loading={loading}
        />
      </DashboardSection>

      {/* Chatbot & BI Panel Section - Similar to Churn */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <DashboardSection title="AI Assistant">
          <div className="h-[400px] border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              AI Chatbot for LTV insights will be integrated here
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="BI Panel">
          <div className="h-[400px] border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              Business Intelligence panel for LTV analysis will be integrated here
            </div>
          </div>
        </DashboardSection>
      </div>

      {/* Main Analytics Grid */}
      <DashboardGrid>
        {/* LTV Distribution */}
        <DashboardSection
          title="Value Distribution"
          description="Customer lifetime value distribution"
        >
          <LtvDistribution
            data={ltvDistribution}
            loading={loading}
          />
        </DashboardSection>

        {/* Segment Analysis */}
        <DashboardSection
          title="Segment Analysis"
          description="LTV by customer segments"
        >
          <SegmentAnalysis
            data={segmentAnalysis}
            loading={loading}
          />
        </DashboardSection>

        {/* Top Customers */}
        <DashboardSection
          title="Top Customers"
          description="Highest value customers"
        >
          <TopCustomers
            data={topCustomers}
            loading={loading}
          />
        </DashboardSection>

        {/* LTV Trends */}
        <DashboardSection
          title="Value Trends"
          description="Lifetime value trends over time"
          className="col-span-2"
        >
          <LtvTrends
            data={ltvTrends}
            loading={loading}
          />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}