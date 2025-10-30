"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { ChurnProvider, useChurnContext } from "./context";

function ChurnLayoutContent({ children }: { children: React.ReactNode }) {
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
    timeRange,
    churnCustomers,
    insights,
    kpiMetrics
  } = useChurnContext();

  // Calculate high risk customers for BI trigger
  const highRiskCount = churnCustomers.filter(c =>
    c.risk_level === "High" || c.risk_level === "Very High"
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
      onClearSelection={() => selectionManager.clearAll()}
      dashboardContext="churn_prediction"
      additionalContext={{
        filters: {
          riskLevels: filters.riskLevels.join(", ") || "All",
          segments: filters.segments.join(", ") || "All",
          productCategories: filters.productCategories?.join(", ") || "All",
          timeRange: timeRange,
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
      data={{ customers: churnCustomers }}
      dashboardContext="churn"
      customers={churnCustomers} // Legacy support
    />
  );

  return (
    <>
      <AppLayout
        title="Churn Prediction"
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
        highRiskCount={highRiskCount}
      />
    </>
  );
}

export default function ChurnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChurnProvider>
      <ChurnLayoutContent>{children}</ChurnLayoutContent>
    </ChurnProvider>
  );
}
