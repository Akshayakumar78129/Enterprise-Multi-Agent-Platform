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
import { AlertCircle } from 'lucide-react';

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
    insights,
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

          {/* Insights Banner */}
          {insights && insights.length > 0 && (
            <div className="glass-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <AlertCircle className="h-4 w-4" />
                Key Insights
              </div>
              <div className="space-y-2">
                {insights.slice(0, 3).map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${
                      insight.type === 'positive'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : insight.type === 'warning'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : insight.type === 'critical'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: insight.message }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div id="key-metrics" />
          <DashboardSection title="Key Metrics">
            <SalesTrendsKPIs metrics={kpiMetrics} loading={loading} />
          </DashboardSection>

          {/* Time Series Analysis - Full Width */}
          <div id="time-series-analysis" />
          <DashboardSection title="Time Series Analysis">
            <TimeSeriesExplorer
              data={timeSeries}
              loading={loading}
              selectedMetric={filters.metric}
            />
          </DashboardSection>

          {/* Seasonal Pattern - Full Width */}
          <DashboardSection title="Seasonal Patterns">
            <SeasonalPatternAnalyzer
              data={seasonality}
              loading={loading}
            />
          </DashboardSection>

          {/* Growth Rate Analysis - Full Width */}
          <DashboardSection title="Growth Rate Analysis">
            <GrowthRateVisualizer
              data={growthRates}
              loading={loading}
            />
          </DashboardSection>

          {/* Top Performers - Full Width */}
          {filters.dimension && (
            <>
              <div id="top-performers" />
              <DashboardSection title={`Top Performers by ${filters.dimension?.charAt(0).toUpperCase()}${filters.dimension?.slice(1)}`}>
                <TopPerformers
                  data={topPerformers}
                  loading={loading}
                  dimension={filters.dimension}
                />
              </DashboardSection>
            </>
          )}
        </div>
      )}
    </PageLoader>
  );
}
