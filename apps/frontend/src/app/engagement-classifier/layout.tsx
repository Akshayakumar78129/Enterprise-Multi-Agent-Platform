"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { EngagementFilters } from "./components";
import { EngagementClassifierProvider, useEngagementClassifierContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useEngagementClassifierContext();
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
    timeRange,
    engagementData
  } = useEngagementClassifierContext();

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
      dashboardContext="engagement_classifier"
      additionalContext={{
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
    />
  );

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      customers={engagementData}
      dashboardContext="engagement_classifier"
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