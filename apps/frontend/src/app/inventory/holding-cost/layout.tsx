"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { HoldingCostProvider, useHoldingCostContext } from "./context";

function HoldingCostLayoutContent({ children }: { children: React.ReactNode }) {
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
    highCostItems,
    insights,
    kpiMetrics
  } = useHoldingCostContext();

  // Calculate excessive cost items count for BI trigger
  const excessiveCostItemsCount = highCostItems.filter(item =>
    item.excessive_holding_cost === true
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
      dashboardContext="inventory_holding_cost"
      additionalContext={{
        filters: {
          categories: filters.categories.join(", ") || "All",
          warehouseIds: filters.warehouseIds.join(", ") || "All",
          excessiveOnly: filters.excessiveOnly ? "Yes" : "No",
          annualHoldingRate: `${(filters.annualHoldingCostRate * 100).toFixed(1)}%`,
          opportunityRate: `${(filters.opportunityCostRate * 100).toFixed(1)}%`,
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
      data={{ highCostItems }}
      dashboardContext="holding-cost"
      customers={highCostItems} // Legacy support
    />
  );

  return (
    <>
      <AppLayout
        title="Inventory Holding Cost"
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
        highRiskCount={excessiveCostItemsCount}
      />
    </>
  );
}

export default function HoldingCostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HoldingCostProvider>
      <HoldingCostLayoutContent>{children}</HoldingCostLayoutContent>
    </HoldingCostProvider>
  );
}
