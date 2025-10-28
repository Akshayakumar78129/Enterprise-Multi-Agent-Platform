"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { RevenueForecastProvider, useRevenueForecastContext } from "./context";
import { useRevenueForecastData } from "./hooks/useRevenueForecastData";

function RevenueForecastLayoutContent({ children }: { children: React.ReactNode }) {
  const context = useRevenueForecastContext();

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
    revenueForecastData
  } = context;

  const { insights, kpiMetrics } = useRevenueForecastData(filters);

  // Transform kpiMetrics from nested structure to flat structure for BI Panel
  // Backend returns: { ruleOf40: { value: 45.2, change: 2.5, ... }, ... }
  // BI Panel expects: { ruleOf40: 45.2, netRevenueRetention: 112, ... }
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
      dashboardContext="revenue_forecast"
      additionalContext={{
        filters: {
          dateRange: filters.dateRange,
          companyCode: filters.companyCode,
          segments: filters.segments,
          regions: filters.regions,
          forecastHorizon: filters.forecastHorizon,
          scenario: filters.scenario
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
      data={revenueForecastData}
      dashboardContext="revenue_forecast"
    />
  );

  return (
    <AppLayout
      title="Revenue Forecast"
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
      highRiskCount={0}
    />
  );
}

export default function RevenueForecastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RevenueForecastProvider>
      <RevenueForecastLayoutContent>{children}</RevenueForecastLayoutContent>
    </RevenueForecastProvider>
  );
}
