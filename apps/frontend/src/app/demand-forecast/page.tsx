"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection,
  KPIRow,
  BarChart,
  LineChart,
  ChartCard
} from 'components/index';
import { useDemandforecastContext } from './context';
import { useDemandforecastData } from './hooks/useDemandforecastData';

export default function DemandforecastPage() {
  const { filters } = useDemandforecastContext();
  const { loading, error, data, kpiMetrics, hasNoData } = useDemandforecastData(filters);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Section */}
      <DashboardSection title="Key Metrics">
        <KPIRow kpis={kpiMetrics} loading={loading} />
      </DashboardSection>

      {/* Chatbot & BI Panel Section - Following Churn Pattern */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <DashboardSection title="Thought Catalyst">
          <div className="h-[400px] border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              AI Chatbot for demand forecast insights will be integrated here
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Decision Intelligence">
          <div className="h-[400px] border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">
              Business Intelligence panel for demand forecast analysis will be integrated here
            </div>
          </div>
        </DashboardSection>
      </div>

      {/* Main Analytics Grid */}
      <DashboardGrid>
        <DashboardSection title="Primary Analysis" className="col-span-2">
          <ChartCard title="Trend Analysis" loading={loading}>
            <LineChart data={data?.trends || []} />
          </ChartCard>
        </DashboardSection>

        <DashboardSection title="Distribution">
          <ChartCard title="Category Distribution" loading={loading}>
            <BarChart data={data?.distribution || []} />
          </ChartCard>
        </DashboardSection>

        <DashboardSection title="Performance Metrics">
          <ChartCard title="Performance Overview" loading={loading}>
            <BarChart data={data?.performance || []} />
          </ChartCard>
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}