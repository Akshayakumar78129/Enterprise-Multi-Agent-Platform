"use client";
import React, { useState } from "react";
import { PageLoader, FilterBar } from "components/index"
import {
  HoldingCostKPIs,
  CostBreakdownVisualization,
  CostTrendAnalyzer,
  WarehouseCostComparison,
  OpportunityAnalyzer,
  ExcessiveCostGrid,
  HighCostItemsTable
} from "./components"
import { useHoldingCostData } from "./hooks/useHoldingCostData";
import { useHoldingCostContext } from "./context";
import { PRODUCT_CATEGORY_OPTIONS, WAREHOUSE_OPTIONS, DEFAULT_DATE_RANGE } from "@/lib/constants/filterOptions";

export const dynamic = 'force-dynamic';

export default function HoldingCostPage() {
  const { filters, setFilters, setHighCostItems, setInsights, setKpiMetrics } = useHoldingCostContext();

  const {
    loading,
    error,
    data,
    categoryAnalysis,
    warehouseAnalysis,
    highCostItems,
    costBreakdown,
    insights,
    kpiMetrics,
    trendData,
    savingOpportunities,
    excessiveCostItems,
    hasNoData
  } = useHoldingCostData(filters);

  // Update context when data changes
  React.useEffect(() => {
    setHighCostItems(highCostItems || []);
    setInsights(insights || []);
    setKpiMetrics(kpiMetrics || {});
  }, [highCostItems, insights, kpiMetrics, setHighCostItems, setInsights, setKpiMetrics]);

  const handleReset = () => {
    setFilters({
      dateRange: DEFAULT_DATE_RANGE,
      categories: [],
      warehouseIds: [],
      excessiveOnly: false,
      annualHoldingCostRate: 0.25,
      opportunityCostRate: 0.08,
      excessiveCostThreshold: 0.30
    });
  };

  // Error state
  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">No Holding Cost Data Available</h2>
          <p className="text-muted-foreground mb-4">{error || "No data to display for the selected filters."}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Holding Cost Analysis",
      }}
    >
      <div className="space-y-6">
        {/* Unified Filters */}
        <FilterBar
        config={{
          dateRange: {
            enabled: true,
            value: filters?.dateRange || DEFAULT_DATE_RANGE,
            onChange: (range) => {
              if (range?.startDate && range?.endDate) {
                setFilters(prev => ({
                  ...prev,
                  dateRange: {
                    startDate: range.startDate,
                    endDate: range.endDate
                  }
                }));
              }
            }
          },
          multiSelect: [
            {
              id: 'categories',
              label: 'Product Categories',
              options: PRODUCT_CATEGORY_OPTIONS,
              value: filters?.categories || [],
              onChange: (values) => setFilters(prev => ({ ...prev, categories: values })),
              placeholder: 'All categories'
            },
            {
              id: 'warehouses',
              label: 'Warehouses',
              options: WAREHOUSE_OPTIONS,
              value: filters?.warehouseIds || [],
              onChange: (values) => setFilters(prev => ({ ...prev, warehouseIds: values })),
              placeholder: 'All warehouses'
            }
          ],
          customFilters: (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Annual Holding Rate */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Annual Holding Rate: {(filters?.annualHoldingCostRate * 100 || 25).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="1"
                  value={(filters?.annualHoldingCostRate || 0.25) * 100}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    annualHoldingCostRate: Number(e.target.value) / 100
                  }))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
              {/* Opportunity Cost Rate */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Opportunity Rate: {(filters?.opportunityCostRate * 100 || 8).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={(filters?.opportunityCostRate || 0.08) * 100}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    opportunityCostRate: Number(e.target.value) / 100
                  }))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
              {/* Excessive Cost Threshold */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Excessive Threshold: {(filters?.excessiveCostThreshold * 100 || 30).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={(filters?.excessiveCostThreshold || 0.30) * 100}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    excessiveCostThreshold: Number(e.target.value) / 100
                  }))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
            </div>
          )
        }}
        onReset={handleReset}
        showResetButton={true}
      />

        {/* Key Metrics */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Key Metrics</h3>
          <HoldingCostKPIs data={kpiMetrics} loading={loading} />
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Holding Cost Breakdown</h3>
          <CostBreakdownVisualization data={costBreakdown} loading={loading} />
        </div>

        {/* Cost Trends Over Time */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Cost Trends Over Time</h3>
          <CostTrendAnalyzer data={trendData} loading={loading} />
        </div>

        {/* Warehouse Cost Analysis */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Warehouse Cost Analysis</h3>
          <WarehouseCostComparison data={warehouseAnalysis} loading={loading} />
        </div>

        {/* Cost-Saving Opportunities */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Cost-Saving Opportunities</h3>
          <OpportunityAnalyzer data={savingOpportunities} loading={loading} />
        </div>

        {/* Excessive Cost Items */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Excessive Cost Items</h3>
          <ExcessiveCostGrid
            data={excessiveCostItems}
            loading={loading}
            threshold={filters?.excessiveCostThreshold}
            onThresholdChange={(value) => setFilters(prev => ({
              ...prev,
              excessiveCostThreshold: value
            }))}
          />
        </div>

        {/* High Cost Items Table */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">High Cost Items</h3>
          <HighCostItemsTable data={highCostItems} loading={loading} maxItems={50} />
        </div>
      </div>
    </PageLoader>
  );
}
