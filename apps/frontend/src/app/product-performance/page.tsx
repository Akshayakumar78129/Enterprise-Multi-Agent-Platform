"use client";

import React from 'react';
import { DashboardSection, PageLoader } from 'components/index';
import {
  ProductKPIs,
  ProductPerformanceOverview,
  TopProductsTable,
  CategoryPerformanceChart,
  MarginAnalysisScatter,
  PriceBandDistribution
} from './components';
import { useProductPerformanceContext } from './context';
import { useProductPerformanceData } from './hooks/useProductPerformanceData';

export default function ProductPerformancePage() {
  const { filters, setProductData } = useProductPerformanceContext();

  const {
    loading,
    error,
    topProducts,
    categoryPerformance,
    marginAnalysis,
    priceBandDistribution,
    hasNoData,
    kpiMetrics
  } = useProductPerformanceData(filters);

  React.useEffect(() => {
    if (topProducts && topProducts.length > 0) {
      setProductData({ topProducts, categoryPerformance, marginAnalysis });
    }
  }, [topProducts, categoryPerformance, marginAnalysis, setProductData]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Product Performance Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no product performance data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Product Performance",
      }}
    >
      <div className="space-y-6">
        {/* KPIs Section */}
        {/* Key Metrics */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Key Metrics
          </h3>
          <ProductKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* Charts and Analysis */}
        <DashboardSection>
          <div className="space-y-6">
            {/* Category & Price Band - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryPerformanceChart data={categoryPerformance} loading={loading} />
              <PriceBandDistribution data={priceBandDistribution} loading={loading} />
            </div>

            {/* Margin Analysis & Overview - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarginAnalysisScatter data={marginAnalysis} loading={loading} />
              <ProductPerformanceOverview
                data={{
                  revenue: topProducts?.slice(0, 10).map(p => p.revenue) || [],
                  units: topProducts?.slice(0, 10).map(p => p.unitsSold) || [],
                  margin: topProducts?.slice(0, 10).map(p => p.marginPercent || 0) || [],
                  labels: topProducts?.slice(0, 10).map(p => p.productName) || []
                }}
                loading={loading}
              />
            </div>

            {/* Top Products Table - Full Width */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Top Products
              </h3>
              <TopProductsTable data={topProducts} loading={loading} />
            </div>
          </div>
        </DashboardSection>
      </div>
    </PageLoader>
  );
}