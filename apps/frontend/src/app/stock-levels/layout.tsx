"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { StockFilters } from "./components";
import { StockProvider, useStockContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useStockContext();
  return (
    <StockFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          timePeriod: "2021-01-01:2021-12-31",
          warehouseId: null,
          categories: [],
          stockStatus: ["low_stock", "out_of_stock", "overstock"],
          minQuantity: 0,
          suppliers: [],
        })
      }
    />
  );
}

function StockLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    stockData
  } = useStockContext();

  // Calculate critical stock items for BI trigger
  const criticalStockCount = stockData.filter(item =>
    item.stock_level && item.stock_level < item.reorder_point
  ).length;

  const mainContent = (
    <div className="p-4 sm:p-6 lg:p-8">
      <HeaderFilters />
      <div className="mt-6">
        {children}
      </div>
    </div>
  );

  const chatPanelContent = (
    <ChatPanel
      onClose={() => setIsChatOpen(false)}
      selectedPoints={selectedPoints}
      onClearSelection={() => selectionManager.clearAll()}
      dashboardContext="stock_levels"
      additionalContext={{
        filters: {
          timePeriod: filters.timePeriod,
          warehouseId: filters.warehouseId || "All",
          categories: filters.categories.join(", ") || "All",
          stockStatus: filters.stockStatus.join(", ") || "All",
          minQuantity: filters.minQuantity,
          suppliers: filters.suppliers.join(", ") || "All"
        }
      }}
    />
  );

  // Transform stock data to match BI panel expectations
  const transformedItems = stockData.map(item => ({
    item_id: item.item_id,
    name: item.item_name || `Item ${item.item_id}`,
    stock_level: item.stock_level,
    reorder_point: item.reorder_point,
    turnover_rate: item.turnover_rate || 0,
    risk_level: item.stock_level && item.stock_level < item.reorder_point ? 'High' :
                item.stock_level && item.stock_level < (item.reorder_point * 1.5) ? 'Medium' : 'Low',
    category: item.category
  }));

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      customers={transformedItems}
      dashboardContext="stock_levels"
    />
  );

  return (
    <AppLayout
      title="Stock Levels"
      mainContent={mainContent}
      chatPanel={isChatOpen ? chatPanelContent : undefined}
      biPanel={isBIModalOpen ? biPanelContent : undefined}
      isChatOpen={isChatOpen}
      isBIOpen={isBIModalOpen}
      onChatToggle={() => setIsChatOpen(!isChatOpen)}
      onBIToggle={() => setIsBIModalOpen(!isBIModalOpen)}
      onChatExpandToggle={(expanded) => {
        if (!expanded) setIsChatOpen(false);
      }}
      onBIExpandToggle={(expanded) => {
        if (!expanded) setIsBIModalOpen(false);
      }}
      hasSelectedPoints={selectedPoints.length > 0}
      highRiskCount={criticalStockCount}
    />
  );
}

export default function StockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StockProvider>
      <StockLayoutContent>{children}</StockLayoutContent>
    </StockProvider>
  );
}