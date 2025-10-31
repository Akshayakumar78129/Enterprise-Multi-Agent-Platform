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
          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Key Metrics
            </h3>
            <SalesKPIs metrics={kpiMetrics} loading={loading} />
          </DashboardSection>

          {/* Charts Section - Components have built-in cards */}
          <DashboardSection>
            <div className="space-y-6">
              {/* Performance Overview - Full Width */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Performance Overview
                </h3>
                <PerformanceOverview
                  data={topProducts}
                  loading={loading}
                  selectedDimension={selectedDimension}
                  selectedMetric={selectedMetric}
                />
              </div>

              {/* Visualizations Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Time Series Explorer */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                    Time Series Analysis
                  </h3>
                  <TimeSeriesExplorer
                    data={revenueTrends}
                    loading={loading}
                    selectedMetric={selectedMetric}
                  />
                </div>

                {/* Performance Distribution */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                    Performance Distribution
                  </h3>
                  <PerformanceDistributionAnalyzer
                    data={topProducts}
                    loading={loading}
                    selectedDimension={selectedDimension}
                    selectedMetric={selectedMetric}
                  />
                </div>
              </div>

              {/* Advanced Analytics */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Correlation Matrix */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                    Performance Correlation
                  </h3>
                  <PerformanceCorrelationMatrix
                    data={topProducts}
                    loading={loading}
                    selectedDimension={selectedDimension}
                  />
                </div>

                {/* Performance Drivers */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                    Performance Drivers
                  </h3>
                  <PerformanceDriverAnalysis
                    data={topProducts}
                    loading={loading}
                    selectedDimension={selectedDimension}
                    selectedMetric={selectedMetric}
                  />
                </div>
              </div>

              {/* Comparative Performance Grid - Full Width */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Comparative Performance
                </h3>
                <ComparativePerformanceGrid
                  data={topProducts}
                  loading={loading}
                  selectedDimension={selectedDimension}
                  selectedMetric={selectedMetric}
                />
              </div>
            </div>
          </DashboardSection>
        </div>
      )}
    </PageLoader>
  );
}