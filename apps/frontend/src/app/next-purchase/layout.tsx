"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { NextPurchaseProvider, useNextPurchaseContext } from './context';
import { useNextPurchaseData } from './hooks/useNextPurchaseData';

function NextPurchaseLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    filters,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId,
    isChatPanelOpen,
    setIsChatPanelOpen,
    isBusinessIntelligencePanelOpen,
    setIsBusinessIntelligencePanelOpen,
    selectionManager,
    predictionData
  } = useNextPurchaseContext();

  const { insights, kpiMetrics } = useNextPurchaseData(filters);

  // Get selected points from selection manager
  const [selectedPoints, setSelectedPoints] = React.useState<any[]>([]);

  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });
    return unsubscribe;
  }, [selectionManager]);

  const mainContent = (
    <div className="p-4 sm:p-6 lg:p-8">
      {children}
    </div>
  );

  const chatPanelContent = (
    <ChatPanel
      onClose={() => setIsChatPanelOpen(false)}
      selectedPoints={selectedPoints}
      onClearSelection={() => selectionManager.clearAll()}
      dashboardContext="next_purchase"additionalContext={{
        filters: filters,
        totalPredictions: predictionData.length
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
      onClose={() => setIsBusinessIntelligencePanelOpen(false)}
      insights={insights || []}
      kpiMetrics={kpiMetrics || {}}
      data={{ predictions: predictionData }}
      dashboardContext="customer"
    />
  );

  return (
    <AppLayout
      title="Next Purchase Prediction"
      mainContent={mainContent}
      chatPanel={isChatPanelOpen ? chatPanelContent : undefined}
      biPanel={isBusinessIntelligencePanelOpen ? biPanelContent : undefined}
      isChatOpen={isChatPanelOpen}
      isBIOpen={isBusinessIntelligencePanelOpen}
      onChatToggle={() => setIsChatPanelOpen(!isChatPanelOpen)}
      onBIToggle={() => setIsBusinessIntelligencePanelOpen(!isBusinessIntelligencePanelOpen)}
      onChatExpandToggle={(expanded) => {
        if (!expanded) setIsChatPanelOpen(false);
      }}
      onBIExpandToggle={(expanded) => {
        if (!expanded) setIsBusinessIntelligencePanelOpen(false);
      }}
      hasSelectedPoints={selectedPoints.length > 0}
      highRiskCount={0}
    />
  );
}

export default function NextPurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextPurchaseProvider>
      <NextPurchaseLayoutContent>{children}</NextPurchaseLayoutContent>
    </NextPurchaseProvider>
  );
}