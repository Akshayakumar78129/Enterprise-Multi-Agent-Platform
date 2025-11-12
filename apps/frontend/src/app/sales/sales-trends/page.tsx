"use client";

import React, { useEffect } from 'react';
import {
  DashboardSection,
  PageLoader
} from 'components/index';
import {
  SalesTrendsKPIs,
  SalesTrendsFilters,
  TimeSeriesExplorer,
  SeasonalPatternAnalyzer,
  GrowthRateVisualizer,
  TopPerformers
} from './components';
import { useSalesTrendsContext } from './context';
import { useSalesTrendsData } from './hooks/useSalesTrendsData';

export default function SalesTrendsPage() {
  const {
    filters,
    setSalesData
  } = useSalesTrendsContext();

  const {
    loading,
    error,
    data,
    kpiMetrics,
    timeSeries,
    seasonality,
    growthRates,
    topPerformers,
    hasNoData,
  } = useSalesTrendsData(filters);

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
        title: "Sales Trends Analysis",
      }}
    >
      {error && hasNoData ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Sales Trends Data Available
            </h2>
            <p className="text-muted-foreground">
              There's no sales trends data to display for the selected filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <SalesTrendsFilters />

          {/* Key Metrics */}
          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Key Metrics
            </h3>
            <SalesTrendsKPIs metrics={kpiMetrics} loading={loading} />
          </DashboardSection>

          {/* Charts Grid */}
          <DashboardSection>
            <div className="space-y-6">
              {/* Time Series Analysis */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Sales Trend Over Time
                </h3>
                <div className="glass-card p-6">
                  <TimeSeriesExplorer
                    data={timeSeries}
                    loading={loading}
                    selectedMetric={filters.metric}
                  />
                </div>
              </div>

              {/* Seasonal Pattern */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Seasonal Patterns
                </h3>
                <div className="glass-card p-6">
                  <SeasonalPatternAnalyzer
                    data={seasonality}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Growth Rate Analysis */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Growth Rate Analysis
                </h3>
                <div className="glass-card p-6">
                  <GrowthRateVisualizer
                    data={growthRates}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Top Performers */}
              {filters.dimension && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                    Top Performers by {filters.dimension?.charAt(0).toUpperCase()}{filters.dimension?.slice(1)}
                  </h3>
                  <div className="glass-card p-6">
                    <TopPerformers
                      data={topPerformers}
                      loading={loading}
                      dimension={filters.dimension}
                    />
                  </div>
                </div>
              )}
            </div>
          </DashboardSection>
        </div>
      )}
    </PageLoader>
  );
}
