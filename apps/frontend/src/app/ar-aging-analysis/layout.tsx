"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { ARAgingProvider, useARAgingContext } from "./context";
import { useARAgingData } from "./hooks/useARAgingData";

function ARAgingLayoutContent({ children }: { children: React.ReactNode }) {
  const context = useARAgingContext();

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
    arAgingData
  } = context;

  const { insights, kpiMetrics } = useARAgingData(filters);

  // Transform kpiMetrics from nested structure to flat structure for BI Panel
  // Backend returns: { totalAR: { value: 123, change: 1.2, ... }, ... }
  // BI Panel expects: { totalAR: 123, dso: 45, ... }
  const flatKpiMetrics = React.useMemo(() => {
    if (!kpiMetrics) return {};
    const flat: Record<string, number> = {};
    Object.entries(kpiMetrics).forEach(([key, metric]: [string, any]) => {
      if (metric && typeof metric === 'object' && 'value' in metric) {
        flat[key] = metric.value;
      } else if (typeof metric === 'number') {
        flat[key] = metric;
      }
    });
    return flat;
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
      dashboardContext="ar_aging"
      additionalContext={{
        filters: {
          dateRange: filters.dateRange,
          customerType: filters.customerType,
          region: filters.region,
          segment: filters.segment
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
      data={arAgingData}
      dashboardContext="ar_aging"
    />
  );

  return (
    <AppLayout
      title="AR Aging Analysis"
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
      highRiskCount={
        Array.isArray(arAgingData)
          ? arAgingData.filter((item: any) => item?.riskLevel === "high" || item?.riskLevel === "critical").length
          : 0
      }
    />
  );
}

export default function ARAgingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ARAgingProvider>
      <ARAgingLayoutContent>{children}</ARAgingLayoutContent>
    </ARAgingProvider>
  );
}
