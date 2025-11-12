"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { DemandforecastProvider, useDemandforecastContext } from "./context";

function DemandForecastLayoutContent({ children }: { children: React.ReactNode }) {
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
    insights,
    kpiMetrics
  } = useDemandforecastContext();

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
      dashboardContext="demand_forecast"
      additionalContext={{
        filters: {
          categories: filters.categories.join(", ") || "All",
          regions: filters.regions.join(", ") || "All",
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
      data={{}}
      dashboardContext="demand-forecast"
    />
  );

  return (
    <>
      <AppLayout
        title="Demand Forecast"
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
      />
    </>
  );
}

export default function DemandforecastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemandforecastProvider>
      <DemandForecastLayoutContent>{children}</DemandForecastLayoutContent>
    </DemandforecastProvider>
  );
}
