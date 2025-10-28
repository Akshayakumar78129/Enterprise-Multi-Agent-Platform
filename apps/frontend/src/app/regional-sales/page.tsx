"use client";

import React, { useEffect } from 'react';
import {
  DashboardSection,
  PageLoader
} from 'components/index';
import {
  RegionalKPIs,
  RegionalSalesTrends,
  RegionalPerformanceTable,
  GrowthOpportunitiesTable
} from './components';
import { useRegionalSalesContext } from './context';
import { useRegionalSalesData } from './hooks/useRegionalSalesData';

export default function RegionalSalesPage() {
  const {
    filters,
    setRegionalSalesData
  } = useRegionalSalesContext();

  const {
    loading,
    error,
    data,
    kpiMetrics,
    regionalPerformance,
    timeSeries,
    opportunities,
    topRegions,
    hasNoData,
  } = useRegionalSalesData({
    dateFrom: filters.dateRange.startDate,
    dateTo: filters.dateRange.endDate,
    countries: filters.countries,
    states: filters.states
  });

  // Update context with latest data for BI panel
  useEffect(() => {
    if (data) {
      setRegionalSalesData(data);
    }
  }, [data, setRegionalSalesData, regionalPerformance, timeSeries, opportunities]);

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Regional Sales Analyzer",
      }}
    >
      {error && hasNoData ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Regional Sales Data Available
            </h2>
            <p className="text-muted-foreground">
              There's no regional sales data to display for the selected filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div id="key-metrics" />
          <DashboardSection title="Key Metrics">
            <RegionalKPIs
              metrics={kpiMetrics}
              topRegion={topRegions && topRegions.length > 0 ? topRegions[0] : null}
              opportunityCount={opportunities.filter(o =>
                o.opportunityCategory === 'Growth Opportunity' ||
                o.opportunityCategory === 'Star Region'
              ).length}
              loading={loading}
            />
          </DashboardSection>

          {/* Regional Sales Trends */}
          <div id="regional-sales-trends" />
          <DashboardSection title="Regional Sales Trends">
            <RegionalSalesTrends
              data={timeSeries}
              loading={loading}
            />
          </DashboardSection>

          {/* Regional Performance Comparison */}
          <div id="regional-performance" />
          <DashboardSection title="Regional Performance Comparison">
            <RegionalPerformanceTable
              data={regionalPerformance}
              loading={loading}
            />
          </DashboardSection>

          {/* Growth Opportunities */}
          <div id="growth-opportunities" />
          <DashboardSection title="Growth Opportunities">
            <GrowthOpportunitiesTable
              data={opportunities}
              loading={loading}
            />
          </DashboardSection>
        </div>
      )}
    </PageLoader>
  );
}
