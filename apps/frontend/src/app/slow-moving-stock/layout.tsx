"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { SlowMovingStockProvider, useSlowMovingStockContext } from "./context";
import { useSlowMovingStockData } from "./hooks/useSlowMovingStockData";

function SlowMovingStockLayoutContent({ children }: { children: React.ReactNode }) {
  const context = useSlowMovingStockContext();

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
    slowMovingStockData
  } = context;

  const { data } = useSlowMovingStockData(filters);

  // Transform KPI metrics for BI Panel
  const flatKpiMetrics = React.useMemo(() => {
    if (!data?.kpis) return {};
    return {
      totalItems: data.kpis.totalItems || 0,
      slowMovingItems: data.kpis.slowMovingItems || 0,
      avgTurnoverRate: data.kpis.avgTurnoverRate || 0,
      avgDaysSinceLastSale: data.kpis.avgDaysSinceLastSale || 0,
      carryingCost: data.kpis.carryingCost || 0,
      totalInventoryValue: data.kpis.totalInventoryValue || 0
    };
  }, [data]);

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
      dashboardContext="slow_moving_stock"
      additionalContext={{
        filters: {
          dateRange: filters.dateRange,
          category: filters.category,
          turnoverThreshold: filters.turnoverThreshold
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
      insights={[]}
      kpiMetrics={flatKpiMetrics}
      data={slowMovingStockData}
      dashboardContext="slow_moving_stock"
    />
  );

  // Calculate critical slow-moving count for badge
  const criticalCount = React.useMemo(() => {
    if (!data?.slowMovingItems || !Array.isArray(data.slowMovingItems)) return 0;
    return data.slowMovingItems.filter((item: any) => item?.turnoverRate < 1).length;
  }, [data]);

  return (
    <AppLayout
      title="Slow Moving Stock"
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
      highRiskCount={criticalCount}
    />
  );
}

export default function SlowMovingStockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SlowMovingStockProvider>
      <SlowMovingStockLayoutContent>{children}</SlowMovingStockLayoutContent>
    </SlowMovingStockProvider>
  );
}
