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
        <DashboardSection title="Key Metrics">
          <RevenueForecastKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* Monthly Revenue Trend */}
        <DashboardSection title="Monthly Revenue Trend">
          <MonthlyTrendChart
            data={monthlyTrend}
            loading={loading}
          />
        </DashboardSection>

        {/* Grid Layout: Cohort Retention + Segment Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardSection title="Cohort Revenue Retention">
            <CohortRetentionChart
              data={cohortRetention}
              loading={loading}
            />
          </DashboardSection>
          <DashboardSection title="Segment Forecast Breakdown">
            <SegmentForecastTable
              data={segmentForecast}
              loading={loading}
            />
          </DashboardSection>
        </div>
      </div>
    </PageLoader>
  );
}
