"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { PurchaseFrequencyProvider, usePurchaseFrequencyContext } from "./context";

function PurchaseFrequencyLayoutContent({ children }: { children: React.ReactNode }) {
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
  } = usePurchaseFrequencyContext();

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
      dashboardContext="purchase_frequency"
      additionalContext={{
        filters: {
          customerSegments: filters.customerSegments?.join(", ") || "All",
          productCategories: filters.productCategories?.join(", ") || "All",
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
      dashboardContext="purchase_frequency"
    />
  );

  return (
    <AppLayout
      title="Purchase Frequency"
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
  );
}

export default function PurchaseFrequencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PurchaseFrequencyProvider>
      <PurchaseFrequencyLayoutContent>{children}</PurchaseFrequencyLayoutContent>
    </PurchaseFrequencyProvider>
  );
}
