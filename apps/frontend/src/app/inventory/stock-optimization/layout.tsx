"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { StockoptimizationProvider, useStockoptimizationContext } from "./context";

function StockOptimizationLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId,
    recommendations,
    insights,
    kpiMetrics
  } = useStockoptimizationContext();

  // Calculate items needing reorder for BI trigger
  const itemsNeedingReorder = recommendations.filter(item =>
    item.action === 'reorder' || item.reorder_needed === true
  ).length;

  const mainContent = (
    <div className="p-4 sm:p-6 lg:p-8">
      {children}
    </div>
  );

  const chatPanelContent = (
    <ChatPanel
      onClose={() => setIsChatOpen(false)}
      selectedPoints={selectedPoints}
      onClearSelection={() => selectionManager.clearSelection()}
      dashboardContext="inventory_stock_optimization"
      additionalContext={{
        filters: {
          categories: filters.categories.join(", ") || "All",
          warehouseIds: filters.warehouseIds.join(", ") || "All",
          optimizationLevel: filters.optimizationLevel,
          dateRange: filters.dateRange
        }
      }}
      messages={chatMessages}
      setMessages={setChatMessages}
      input={chatInput}
      setInput={setChatInput}
      isLoading={chatIsLoading}
      setIsLoading={setChatIsLoading}
      sessionId={chatSessionId}
      userId={chatUserId}
    />
  );

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      insights={insights}
      kpiMetrics={kpiMetrics}
      data={{ recommendations }}
      dashboardContext="stock-optimization"
      customers={recommendations} // Legacy support
    />
  );

  return (
    <>
      <AppLayout
        title="Stock Optimization"
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
        highRiskCount={itemsNeedingReorder}
      />
    </>
  );
}

export default function StockOptimizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StockoptimizationProvider>
      <StockOptimizationLayoutContent>{children}</StockOptimizationLayoutContent>
    </StockoptimizationProvider>
  );
}
