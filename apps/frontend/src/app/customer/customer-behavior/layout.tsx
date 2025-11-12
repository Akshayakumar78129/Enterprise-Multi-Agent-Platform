"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { BehaviorFilters } from "./components";
import { BehaviorProvider, useBehaviorContext } from "./context";
import { useBehaviorData } from "./hooks/useBehaviorData";

function HeaderFilters() {
  const { filters,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId, setFilters } = useBehaviorContext();
  return (
    <BehaviorFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('behaviorFilters');
        }
        // Reset to defaults
        setFilters({
          dateRange: {
            startDate: "2017-01-01",
            endDate: "2021-12-31"
          },
          segmentId: null,
          segmentIds: [],
          behaviorTypes: ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"],
          minTransactions: 2,
          customerIds: [],
          loyaltyStatus: [],
        });
      }}
    />
  );
}

function BehaviorLayoutContent({ children }: { children: React.ReactNode }) {
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
    behaviorCustomers
  } = useBehaviorContext();

  const { insights, kpiMetrics } = useBehaviorData(filters);

  // Calculate high engagement customers for BI trigger
  const highEngagementCount = behaviorCustomers.filter(c =>
    c.engagement_score && c.engagement_score > 0.7
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
      dashboardContext="customer_behavior"
      additionalContext={{
        filters: {
          dateRange: `${filters.dateRange.startDate} to ${filters.dateRange.endDate}`,
          segmentId: filters.segmentId || "All",
          behaviorTypes: filters.behaviorTypes.join(", ") || "All",
          minTransactions: filters.minTransactions,
          loyaltyStatus: filters.loyaltyStatus.join(", ") || "All"
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
      data={{ customers: behaviorCustomers }}
      dashboardContext="customer"
    />
  );

  return (
    <AppLayout
      title="Customer Behavior"
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
      highRiskCount={highEngagementCount}
    />
  );
}

export default function BehaviorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BehaviorProvider>
      <BehaviorLayoutContent>{children}</BehaviorLayoutContent>
    </BehaviorProvider>
  );
}