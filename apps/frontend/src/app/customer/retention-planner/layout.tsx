"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { RetentionPlannerProvider, useRetentionPlannerContext } from './context';

function RetentionPlannerLayoutContent({ children }: { children: React.ReactNode }) {
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
    retentionData,
    insights,
    kpiMetrics
  } = useRetentionPlannerContext();

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
      dashboardContext="retention_planner"additionalContext={{
        filters: filters,
        totalRetentionRecords: retentionData.length
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
      data={{ retentionData }}
      dashboardContext="retention"
    />
  );

  return (
    <AppLayout
      title="Retention Planning"
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

export default function RetentionPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RetentionPlannerProvider>
      <RetentionPlannerLayoutContent>{children}</RetentionPlannerLayoutContent>
    </RetentionPlannerProvider>
  );
}