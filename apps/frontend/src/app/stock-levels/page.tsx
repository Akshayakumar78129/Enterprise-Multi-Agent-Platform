"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  StockKPIs,
  InventoryOverview,
  StockAlerts,
  CategoryStock,
  TurnoverRates,
  StockMovement,
  InventoryTable
} from './components';
import { useStockContext } from './context';
import { useStockData } from './hooks/useStockData';

export default function StockLevelsPage() {
  const { filters, setStockData } = useStockContext();

  const {
    loading,
    error,
    inventoryOverview,
    stockAlerts,
    categoryStock,
    turnoverRates,
    stockMovement,
    lowStockItems,
    hasNoData,
    kpiMetrics
  } = useStockData(filters);

  // Update context with stock data for BI panel
  React.useEffect(() => {
    setStockData(lowStockItems);
  }, [lowStockItems, setStockData]);

  // Handle item selection
  const handleItemSelect = (item: any) => {
    console.log('Selected item:', item);
    // Could open a detail modal or navigate to item details
  };

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">Unable to load stock data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* KPI Section */}
      <DashboardSection title="Stock Metrics">
        <StockKPIs kpiMetrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      {/* Primary Analysis Section */}
      <DashboardSection title="Inventory Overview">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Left Column - Overview and Alerts */}
          <div className="space-y-4 lg:space-y-6">
            <InventoryOverview
              data={inventoryOverview}
              loading={loading}
            />
            <StockAlerts
              data={stockAlerts}
              loading={loading}
            />
          </div>

          {/* Right Column - Categories and Turnover */}
          <div className="space-y-4 lg:space-y-6">
            <CategoryStock
              data={categoryStock}
              loading={loading}
            />
            <TurnoverRates
              data={turnoverRates}
              loading={loading}
            />
          </div>
        </div>
      </DashboardSection>

      {/* Stock Movement Section */}
      <DashboardSection title="Stock Movement">
        <StockMovement
          data={stockMovement}
          loading={loading}
        />
      </DashboardSection>

      {/* Low Stock Items Table */}
      <DashboardSection title="Low Stock Items">
        <InventoryTable
          data={lowStockItems}
          loading={loading}
          onItemSelect={handleItemSelect}
        />
      </DashboardSection>
    </>
  );
}