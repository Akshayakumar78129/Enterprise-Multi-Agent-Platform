"use client";

import React from 'react';
import { DashboardSection, PageLoader } from 'components/index';
import { useRevenueForecastContext } from './context';
import { useRevenueForecastData } from './hooks/useRevenueForecastData';
import {
  RevenueForecastKPIs,
  RevenueForecastFilters,
  MonthlyTrendChart,
  SegmentForecastTable,
  CohortRetentionChart
} from './components';

export default function RevenueForecastPage() {
  const context = useRevenueForecastContext();
  const [filterKey, setFilterKey] = React.useState(0);

  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading Revenue Forecast...</div>
      </div>
    );
  }

  const { filters, setFilters } = context;

  const {
    loading,
    error,
    kpiMetrics,
    growthDecomposition,
    cohortRetention,
    segmentForecast,
    customerEconomics,
    monthlyTrend,
    insights,
    hasNoData
  } = useRevenueForecastData({
    dateRange: filters.dateRange,
    companyCode: filters.companyCode,
    segments: filters.segments,
    products: filters.products,
    regions: filters.regions,
    customerTypes: filters.customerTypes,
    forecastHorizon: filters.forecastHorizon,
    confidenceLevel: filters.confidenceLevel,
    scenario: filters.scenario
  });

  if (error && !loading && hasNoData) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-6 border-error/50">
            <h2 className="text-error text-lg font-semibold mb-2">Error Loading Data</h2>
            <p className="text-error/80">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-error hover:bg-error/80 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Revenue Forecast",
      }}
    >
      <div className="space-y-6">
        {/* Filters Section */}
        <DashboardSection>
          <RevenueForecastFilters
            key={filterKey}
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => {
              // Clear localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem('revenueForecastFilters');
                localStorage.removeItem('revenueForecastDateRange');
              }
              // Reset to defaults
              setFilters({
                dateRange: { startDate: "2017-01-01", endDate: "2021-12-31" },
                companyCode: "all",
                segments: [],
                products: [],
                regions: [],
                customerTypes: [],
                forecastHorizon: 12,
                confidenceLevel: 80.0,
                scenario: "base"
              });
              // Force re-render of filter component
              setFilterKey(prev => prev + 1);
            }}
          />
        </DashboardSection>

        {/* KPIs Section */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
          <RevenueForecastKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* Monthly Revenue Trend */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Monthly Revenue Trend</h3>
          <MonthlyTrendChart
            data={monthlyTrend}
            loading={loading}
          />
        </DashboardSection>

        {/* Cohort Retention Chart */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Cohort Revenue Retention</h3>
          <CohortRetentionChart
            data={cohortRetention}
            loading={loading}
          />
        </DashboardSection>

        {/* Segment Forecast Table - Last */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Segment Forecast Breakdown</h3>
          <SegmentForecastTable
            data={segmentForecast}
            loading={loading}
          />
        </DashboardSection>
      </div>
    </PageLoader>
  );
}
