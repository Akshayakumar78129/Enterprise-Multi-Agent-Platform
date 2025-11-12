"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { InventorylevelProvider, useInventorylevelContext } from "./context";
import { useInventorylevelData } from "./hooks/useInventorylevelData";

function InventoryLevelLayoutContent({ children }: { children: React.ReactNode }) {
  const context = useInventorylevelContext();

  if (!context) {
    return <div>{children}</div>;
  }

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
    inventoryLevelData
  } = context;

  const { insights, kpiMetrics, stockLevels } = useInventorylevelData(filters);

  // Transform kpiMetrics for BI Panel
  const flatKpiMetrics = React.useMemo(() => {
    if (!kpiMetrics) return {};
    return {
      totalInventoryValue: kpiMetrics.totalInventoryValue || 0,
      stockTurnover: kpiMetrics.stockTurnover || 0,
      stockoutRisk: kpiMetrics.stockoutRisk || 0,
      averageDaysOnHand: kpiMetrics.averageDaysOnHand || 0,
      inventoryAccuracy: kpiMetrics.inventoryAccuracy || 0,
      excessStock: kpiMetrics.excessStock || 0
    };
  }, [kpiMetrics]);

  const mainContent = (
    <div className="p-4 sm:p-6 lg:p-8">
      {children}
    </div>
  );

  const chatPanelContent = (
    <ChatPanel
      onClose={() => setIsChatOpen(false)}
      selectedPoints={selectedPoints}
      onClearSelection={() => selectionManager.clearAll()}
      dashboardContext="inventory_level"
      additionalContext={{
        filters: {
          dateRange: filters.dateRange,
          warehouse: filters.warehouse,
          category: filters.category,
          status: filters.status
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
      insights={insights || []}
      kpiMetrics={flatKpiMetrics}
      data={inventoryLevelData}
      dashboardContext="inventory_level"
    />
  );

  // Calculate low stock count for badge
  const lowStockCount = React.useMemo(() => {
    if (!stockLevels || !Array.isArray(stockLevels)) return 0;
    return stockLevels.filter((item: any) => item?.status === "low").length;
  }, [stockLevels]);

  return (
    <AppLayout
      title="Inventory Level Analyzer"
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
      highRiskCount={lowStockCount}
    />
  );
}

export default function InventoryLevelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventorylevelProvider>
      <InventoryLevelLayoutContent>{children}</InventoryLevelLayoutContent>
    </InventorylevelProvider>
  );
}
