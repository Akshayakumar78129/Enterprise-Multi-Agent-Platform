"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  ProductKPIs,
  ProductOverview,
  TopProducts,
  CategoryAnalysis,
  ProductTrends,
  InventoryStatus
} from './components';
import { useProductPerformanceContext } from './context';
import { useProductPerformanceData } from './hooks/useProductPerformanceData';

export default function ProductPerformancePage() {
  const { filters, setProductData } = useProductPerformanceContext();

  const {
    loading,
    error,
    productOverview,
    topProducts,
    categoryAnalysis,
    productTrends,
    inventoryStatus,
    hasNoData,
    kpiMetrics
  } = useProductPerformanceData(filters);

  React.useEffect(() => {
    setProductData({ productOverview, topProducts, categoryAnalysis });
  }, [productOverview, topProducts, categoryAnalysis, setProductData]);

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
    <div className="space-y-6">
      <DashboardSection title="Product Performance Overview">
        <ProductKPIs
          metrics={kpiMetrics}
          loading={loading}
        />
      </DashboardSection>

      <DashboardGrid>
        <DashboardSection title="Product Overview">
          <ProductOverview data={productOverview} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Top Products">
          <TopProducts data={topProducts} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Category Analysis">
          <CategoryAnalysis data={categoryAnalysis} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Inventory Status">
          <InventoryStatus data={inventoryStatus} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Product Trends" className="col-span-2">
          <ProductTrends data={productTrends} loading={loading} />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}