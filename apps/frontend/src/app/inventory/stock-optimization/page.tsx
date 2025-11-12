"use client";

import React from 'react';
import { PageLoader, FilterBar } from 'components/index';
import {
  StockOptimizationKPIs,
  RecommendationsTable,
  MetricsComparison
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
    hasNoData
  } = useStockoptimizationData(filters);

  // Update context when data changes
  React.useEffect(() => {
    setRecommendations(recommendations || []);
    setInsights(insights || []);
    setKpiMetrics(kpiMetrics || {});
  }, [recommendations, insights, kpiMetrics, setRecommendations, setInsights, setKpiMetrics]);

  const handleReset = () => {
    setFilters({
      dateRange: DEFAULT_DATE_RANGE,
      categories: [],
      warehouseIds: [],
      optimizationLevel: 'balanced'
    });
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
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-muted-foreground">
                Optimization Level:
              </label>
              <select
                value={filters?.optimizationLevel || 'balanced'}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  optimizationLevel: e.target.value as 'conservative' | 'balanced' | 'aggressive'
                }))}
                className="px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
          )
        }}
        onReset={handleReset}
        showResetButton={true}
      />

        {/* Key Metrics */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Key Metrics</h3>
          <StockOptimizationKPIs data={kpiMetrics} loading={loading} />
        </div>

        {/* Metrics Comparison Visualization */}
        {metrics && metrics.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Optimization Metrics Comparison</h3>
            <MetricsComparison data={metrics} loading={loading} />
          </div>
        )}

        {/* Stock Recommendations */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Stock Recommendations</h3>
          <RecommendationsTable data={recommendations} loading={loading} maxItems={50} />
        </div>
      </div>
    </PageLoader>
  );
}
