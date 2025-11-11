"use client";

import React from 'react';
import { DashboardSection, PageLoader } from 'components/index';
import { useInventorylevelContext } from './context';
import { useInventorylevelData } from './hooks/useInventorylevelData';
import {
  InventoryLevelKPIs,
  InventoryLevelFilters,
  StockLevelsTable,
  InventoryMovementChart,
  StockStatusChart
} from './components';

export default function InventoryLevelPage() {
  const context = useInventorylevelContext();
  const [filterKey, setFilterKey] = React.useState(0);

  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading Inventory Level...</div>
      </div>
    );
  }

  const { filters, setFilters } = context;

  const {
    loading,
    error,
    kpiMetrics,
    stockLevels,
    movements,
    hasNoData
  } = useInventorylevelData(filters);

  if (error && !loading && hasNoData) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-6 border-error/50">
            <h2 className="text-error text-lg font-semibold mb-2">Error Loading Data</h2>
            <p className="text-error/80">{error}</p>
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
        title: "Inventory Level Analyzer",
      }}
    >
      <div className="space-y-6">
        {/* Filters Section */}
        <DashboardSection>
          <InventoryLevelFilters
            key={filterKey}
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => {
              // Clear localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem('inventoryLevelFilters');
              }
              // Reset to defaults (full date range 2017-2021)
              setFilters({
                dateRange: {
                  startDate: "2017-01-01",
                  endDate: "2021-12-31"
                },
                warehouse: [],
                category: [],
                status: []
              });
              // Force re-render of filter component
              setFilterKey(prev => prev + 1);
            }}
          />
        </DashboardSection>

        {/* KPIs Section */}
        <DashboardSection title="Key Metrics">
          <InventoryLevelKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* Inventory Movement Chart - component has its own DashboardSection */}
        <InventoryMovementChart
          data={movements}
          loading={loading}
        />

        {/* Stock Status Distribution Chart - component has its own DashboardSection */}
        <StockStatusChart
          data={stockLevels}
          loading={loading}
        />

        {/* Stock Levels Table */}
        <DashboardSection title="Current Stock Levels">
          <StockLevelsTable
            data={stockLevels}
            loading={loading}
          />
        </DashboardSection>
      </div>
    </PageLoader>
  );
}
