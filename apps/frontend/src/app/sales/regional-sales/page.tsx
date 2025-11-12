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
          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Key Metrics
            </h3>
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

          {/* Charts and Tables */}
          <DashboardSection>
            <div className="space-y-6">
              {/* Regional Sales Trends */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Regional Sales Trends
                </h3>
                <RegionalSalesTrends
                  data={timeSeries}
                  loading={loading}
                />
              </div>

              {/* Regional Performance Comparison */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Regional Performance Comparison
                </h3>
                <RegionalPerformanceTable
                  data={regionalPerformance}
                  loading={loading}
                />
              </div>

              {/* Growth Opportunities */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Growth Opportunities
                </h3>
                <GrowthOpportunitiesTable
                  data={opportunities}
                  loading={loading}
                />
              </div>
            </div>
          </DashboardSection>
        </div>
      )}
    </PageLoader>
  );
}
