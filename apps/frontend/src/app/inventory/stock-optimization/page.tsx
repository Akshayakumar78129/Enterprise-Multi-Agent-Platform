"use client";

import React from 'react';
import { PageLoader, FilterBar } from 'components/index';
import {
  StockOptimizationKPIs,
  RecommendationsTable,
  MetricsComparison,
  InventoryHealthHeatmap,
  OptimizationMatrix,
  ServiceLevelSimulator,
  ValueTreemap,
  PerformanceGauge
} from './components';
import { useStockoptimizationContext } from './context';
import { useStockoptimizationData } from './hooks/useStockoptimizationData';
import { PRODUCT_CATEGORY_OPTIONS, WAREHOUSE_OPTIONS, DEFAULT_DATE_RANGE } from '@/lib/constants/filterOptions';

export const dynamic = 'force-dynamic';

export default function StockOptimizationPage() {
  const { filters, setFilters, setRecommendations, setInsights, setKpiMetrics } = useStockoptimizationContext();

  const {
    loading,
    error,
    data,
    kpiMetrics,
    recommendations,
    metrics,
    insights,
    heatmapData,
    optimizationMatrix,
    serviceLevelImpact,
    valueTreemap,
    performanceGauge,
    hasNoData
  } = useStockoptimizationData(filters);

  // Update context when data changes
  React.useEffect(() => {
    setRecommendations(recommendations || []);
    setInsights(insights || []);
    setKpiMetrics(kpiMetrics || {});
  }, [recommendations, insights, kpiMetrics, setRecommendations, setInsights, setKpiMetrics]);

  const handleReset = () => {
    const resetFilters = {
      dateRange: DEFAULT_DATE_RANGE,
      categories: [],
      warehouseIds: [],
      optimizationLevel: 'balanced' as const
    };
    setFilters(resetFilters);
    // Force re-render by clearing localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stockOptimizationFilters');
    }
  };

  // Error state
  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">No Stock Optimization Data Available</h2>
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
        title: "Stock Optimization",
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
          singleSelect: [
            {
              id: 'optimizationLevel',
              label: 'Optimization Level',
              options: [
                { value: 'conservative', label: 'Conservative' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'aggressive', label: 'Aggressive' }
              ],
              value: filters?.optimizationLevel || 'balanced',
              onChange: (value) => setFilters(prev => ({
                ...prev,
                optimizationLevel: value as 'conservative' | 'balanced' | 'aggressive'
              })),
              placeholder: 'Select optimization level'
            }
          ],
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
          ]
        }}
        onReset={handleReset}
        showResetButton={true}
      />

        {/* Key Metrics */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Key Metrics</h3>
          <StockOptimizationKPIs data={kpiMetrics} loading={loading} />
        </div>

        {/* Performance Gauge */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Overall Performance</h3>
          <PerformanceGauge data={performanceGauge} loading={loading} />
        </div>

        {/* Optimization Priority Matrix */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Priority Matrix</h3>
          <OptimizationMatrix data={optimizationMatrix} loading={loading} />
        </div>

        {/* Inventory Health Heatmap */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Inventory Health</h3>
          <InventoryHealthHeatmap data={heatmapData} loading={loading} />
        </div>

        {/* Metrics Comparison Visualization */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Optimization Metrics Comparison</h3>
          <MetricsComparison data={metrics} loading={loading} />
        </div>

        {/* Service Level Impact Simulator */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Service Level Impact</h3>
          <ServiceLevelSimulator data={serviceLevelImpact} loading={loading} />
        </div>

        {/* Value Treemap */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Value Distribution</h3>
          <ValueTreemap data={valueTreemap} loading={loading} />
        </div>

        {/* Stock Recommendations */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Stock Recommendations</h3>
          <RecommendationsTable data={recommendations} loading={loading} maxItems={50} />
        </div>
      </div>
    </PageLoader>
  );
}
