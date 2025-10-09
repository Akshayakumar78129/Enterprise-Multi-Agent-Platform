"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { EngagementFilters } from "./components";
import { EngagementClassifierProvider, useEngagementClassifierContext } from "./context";
import { useEngagementClassifierData } from "./hooks/useEngagementClassifierData";

function HeaderFilters() {
  const { filters,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId, setFilters } = useEngagementClassifierContext();
  return (
    <EngagementFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({})
      }
    />
  );
}

function EngagementClassifierLayoutContent({ children }: { children: React.ReactNode }) {
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
    engagementData
  } = useEngagementClassifierContext();

  const { insights, kpiMetrics } = useEngagementClassifierData(filters);

  // Calculate at risk customers for BI trigger
  const atRiskCount = engagementData.filter((c: any) =>
    c.engagement_level === "Low" || c.engagement_level === "Inactive"
  ).length;

  const mainContent = (
    <div className="p-4 sm:p-6 lg:p-8">
      <HeaderFilters />
      <div className="mt-6">
        {children}
      </div>
    </div>
  );

  const chatPanelContent = (
    <ChatPanel
      onClose={() => setIsChatOpen(false)}
      selectedPoints={selectedPoints}
      onClearSelection={() => selectionManager.clearAll()}
      dashboardContext="engagement_classifier"additionalContext={{
        filters: {
          engagementLevels: filters.engagementLevels?.join(", ") || "All",
          loyaltyStatus: filters.loyaltyStatus?.join(", ") || "All",
          timeRange: timeRange,
          dateRange: {
            startDate: filters.startDate,
            endDate: filters.endDate
          }
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
      kpiMetrics={kpiMetrics || {}}
      data={{ customers: engagementData }}
      dashboardContext="customer"
    />
  );

  return (
    <>
      <AppLayout
        title="Customer Engagement Classification"
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
        highRiskCount={atRiskCount}
      />
    </>
  );
}

export default function EngagementClassifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EngagementClassifierProvider>
      <EngagementClassifierLayoutContent>{children}</EngagementClassifierLayoutContent>
    </EngagementClassifierProvider>
  );
}