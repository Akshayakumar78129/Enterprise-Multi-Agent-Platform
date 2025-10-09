"use client";

import React, { useEffect } from 'react';
import {
  DashboardSection,
  PageLoader
} from 'components/index';
import {
  SalesKPIs,
  PerformanceOverview,
  TimeSeriesExplorer,
  PerformanceDistributionAnalyzer,
  ComparativePerformanceGrid,
  PerformanceCorrelationMatrix,
  PerformanceDriverAnalysis
} from './components';
import { useSalesPerformanceContext } from './context';
import { useSalesPerformanceData } from './hooks/useSalesPerformanceData';

export default function SalesPerformancePage() {
  const {
    filters,
    selectedDimension,
    selectedMetric,
    setSalesData
  } = useSalesPerformanceContext();

  const {
    loading,
    error,
    data,
    kpiMetrics,
    topProducts,
    teamPerformance,
    revenueTrends,
    hasNoData,
  } = useSalesPerformanceData(filters, selectedDimension, selectedMetric);

  // Update context with latest data for BI panel
  useEffect(() => {
    if (data) {
      setSalesData(data);
    }
  }, [data, setSalesData]);

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Sales Performance",
      }}
    >
      {error && hasNoData ? (
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
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div id="key-metrics" />
          <DashboardSection title="Key Metrics">
            <SalesKPIs metrics={kpiMetrics} loading={loading} />
          </DashboardSection>

          {/* Main Performance Overview - Full Width */}
          <div id="performance-overview" />
          <DashboardSection title="Performance Overview">
            <PerformanceOverview
              data={topProducts}
              loading={loading}
              selectedDimension={selectedDimension}
              selectedMetric={selectedMetric}
            />
          </DashboardSection>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Time Series Explorer */}
            <DashboardSection title="Time Series Analysis">
              <TimeSeriesExplorer
                data={revenueTrends}
                loading={loading}
                selectedMetric={selectedMetric}
              />
            </DashboardSection>

            {/* Performance Distribution */}
            <DashboardSection title="Performance Distribution">
              <PerformanceDistributionAnalyzer
                data={topProducts}
                loading={loading}
                selectedDimension={selectedDimension}
                selectedMetric={selectedMetric}
              />
            </DashboardSection>
          </div>

          {/* Advanced Analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Correlation Matrix */}
            <DashboardSection title="Performance Correlation">
              <PerformanceCorrelationMatrix
                data={topProducts}
                loading={loading}
                selectedDimension={selectedDimension}
              />
            </DashboardSection>

            {/* Performance Drivers */}
            <DashboardSection title="Performance Drivers">
              <PerformanceDriverAnalysis
                data={topProducts}
                loading={loading}
                selectedDimension={selectedDimension}
                selectedMetric={selectedMetric}
              />
            </DashboardSection>
          </div>

          {/* Comparative Performance Grid - Full Width - MOVED TO LAST */}
          <div id="comparative-performance" />
          <DashboardSection title="Comparative Performance">
            <ComparativePerformanceGrid
              data={topProducts}
              loading={loading}
              selectedDimension={selectedDimension}
              selectedMetric={selectedMetric}
            />
          </DashboardSection>
        </div>
      )}
    </PageLoader>
  );
}