"use client";

import React, { useEffect } from 'react';
import {
  DashboardSection,
  KPIRow,
  ChartCard,
  PageLoader,
  getShiftClickManager
} from 'components/index';
import { useDemandforecastContext } from './context';
import { useDemandforecastData } from './hooks/useDemandForecastData';
import { DemandForecastFilters, DemandTrendChart, CategoryDistributionChart, PerformanceMetricsChart } from './components';

export default function DemandforecastPage() {
  const {
    filters,
    setFilters,
    selectedPoints,
    selectionManager,
    setInsights,
    setKpiMetrics
  } = useDemandforecastContext();

  const shiftClickManager = getShiftClickManager();
  const { loading, error, data, kpiMetrics, insights, hasNoData } = useDemandforecastData(filters);

  // Update context when insights and kpiMetrics change - use JSON.stringify to avoid infinite loops
  const insightsStr = JSON.stringify(insights);
  const kpiMetricsStr = JSON.stringify(kpiMetrics);

  useEffect(() => {
    if (insights) {
      setInsights(insights);
    }
    if (kpiMetrics && kpiMetrics.length > 0) {
      // Convert array back to object for context
      const kpiObject = kpiMetrics.reduce((acc, kpi) => {
        acc[kpi.id] = {
          label: kpi.title,
          value: kpi.value,
          change: kpi.trend,
          trend: kpi.trendDirection,
          status: 'normal'
        };
        return acc;
      }, {} as any);
      setKpiMetrics(kpiObject);
    }
  }, [insightsStr, kpiMetricsStr, setInsights, setKpiMetrics]);

  // Error state
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
            No Data Available
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "There's no demand forecast data to display for the selected filters. Try adjusting your filters or check back later."}
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
        title: "Demand Forecast",
      }}
    >
      <div className="space-y-6">
        {/* Filters Section */}
        <DashboardSection>
          <DemandForecastFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => {
              setFilters({
                dateRange: {
                  startDate: '2017-01-01',
                  endDate: '2021-12-31'
                },
                categories: [],
                regions: []
              });
            }}
          />
        </DashboardSection>

        {/* KPIs Section */}
        <div id="key-metrics" />
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
          <KPIRow kpis={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* Main Analytics Grid */}
        <div id="analytics" />
        {/* Demand Trend Analysis - Full Width */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Demand Trend Analysis</h3>
          <ChartCard
            className="glass-card card-hover"
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Demand Trends",
                value: `Demand trend visualization`,
                source: 'Demand Forecast Dashboard - Trends'
              }, event.nativeEvent);
            }}
          >
            <DemandTrendChart
              data={data?.trends || []}
              loading={loading}
            />
          </ChartCard>
        </DashboardSection>

        {/* Category and Performance - Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Category Distribution</h3>
            <ChartCard
              className="glass-card card-hover"
              onShiftClick={(event) => {
                shiftClickManager.addPoint({
                  label: "Category Distribution",
                  value: `Category distribution analysis`,
                  source: 'Demand Forecast Dashboard - Distribution'
                }, event.nativeEvent);
              }}
            >
              <CategoryDistributionChart
                data={data?.distribution || []}
                loading={loading}
              />
            </ChartCard>
          </DashboardSection>

          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
            <ChartCard
              className="glass-card card-hover"
              onShiftClick={(event) => {
                shiftClickManager.addPoint({
                  label: "Performance Metrics",
                  value: `Performance metrics overview`,
                  source: 'Demand Forecast Dashboard - Performance'
                }, event.nativeEvent);
              }}
            >
              <PerformanceMetricsChart
                data={data?.performance || []}
                loading={loading}
              />
            </ChartCard>
          </DashboardSection>
        </div>
      </div>
    </PageLoader>
  );
}
