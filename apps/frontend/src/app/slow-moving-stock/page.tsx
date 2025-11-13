"use client";

import React from 'react';
import { DashboardSection, PageLoader } from 'components/index';
import { useSlowMovingStockContext } from './context';
import { useSlowMovingStockData } from './hooks/useSlowMovingStockData';
import {
  SlowMovingStockKPIs,
  SlowMovingStockFilters,
  SlowMovingItemsTable,
  TurnoverDistributionChart,
  AgingAnalysisChart,
  CategoryAnalysisChart
} from './components';

export default function SlowMovingStockPage() {
  const context = useSlowMovingStockContext();
  const [filterKey, setFilterKey] = React.useState(0);

  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading Slow Moving Stock...</div>
      </div>
    );
  }

  const { filters, setFilters } = context;

  const {
    data,
    loading,
    isFetching,
    error
  } = useSlowMovingStockData(filters);

  if (error && !loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-6 border-error/50">
            <h2 className="text-error text-lg font-semibold mb-2">Error Loading Data</h2>
            <p className="text-error/80">{error.toString()}</p>
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
        title: "Slow Moving Stock",
      }}
    >
      {/* Filter Loading Indicator */}
      {isFetching && !loading && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in">
          <div className="glass-card px-4 py-3 flex items-center gap-3 border border-primary/30 shadow-lg">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-primary font-medium">Applying filters...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Filters Section */}
        <DashboardSection>
          <SlowMovingStockFilters
            key={filterKey}
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => {
              // Clear localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem('slowMovingStockFilters');
              }
              // Reset to defaults (full date range 2017-2021)
              setFilters({
                dateRange: {
                  startDate: "2017-01-01",
                  endDate: "2021-12-31"
                },
                category: [],
                turnoverThreshold: 30.0
              });
              // Force re-render of filter component
              setFilterKey(prev => prev + 1);
            }}
          />
        </DashboardSection>

        {/* KPIs Section */}
        <DashboardSection title="Key Metrics">
          <SlowMovingStockKPIs metrics={data?.kpis || {}} loading={loading} />
        </DashboardSection>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardSection title="Turnover Distribution">
            <TurnoverDistributionChart
              data={data?.turnoverDistribution || []}
              loading={loading}
            />
          </DashboardSection>

          <DashboardSection title="Stock Aging Analysis">
            <AgingAnalysisChart
              data={data?.agingAnalysis || []}
              loading={loading}
            />
          </DashboardSection>
        </div>

        {/* Category Analysis */}
        <DashboardSection title="Category Analysis">
          <CategoryAnalysisChart
            data={data?.categoryAnalysis || []}
            loading={loading}
          />
        </DashboardSection>

        {/* Slow Moving Items Table */}
        <DashboardSection title="Slow Moving Items">
          <SlowMovingItemsTable
            data={data?.slowMovingItems || []}
            loading={loading}
          />
        </DashboardSection>
      </div>
    </PageLoader>
  );
}
