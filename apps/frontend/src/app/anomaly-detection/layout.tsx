"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { AnomalyFilters } from "./components";
import { AnomalyProvider, useAnomalyContext } from "./context";
import { useAnomalyData } from "./hooks/useAnomalyData";

function HeaderFilters() {
  const { filters,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId, setFilters } = useAnomalyContext();
  return (
    <AnomalyFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateFrom: "2021-01-01",
          dateTo: "2021-12-31",
          severityLevels: [],
          segments: [],
          regions: [],
          contamination: 0.1,
          search: "",
        })
      }
    />
  );
}

function AnomalyLayoutContent({ children }: { children: React.ReactNode }) {
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
    anomalyCustomers
  } = useAnomalyContext();

  const { insights, kpiMetrics } = useAnomalyData(filters);

  // Calculate high severity anomalies for BI trigger
  const highSeverityCount = anomalyCustomers.filter(c =>
    c.severity_level >= 4
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
      dashboardContext="anomaly_detection"additionalContext={{
        filters: {
          severityLevels: filters.severityLevels.join(", ") || "All",
          segments: filters.segments.join(", ") || "All",
          regions: filters.regions.join(", ") || "All",
          dateRange: {
            startDate: filters.dateFrom,
            endDate: filters.dateTo
          },
          contamination: filters.contamination
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
      data={{ customers: anomalyCustomers }}
      dashboardContext="anomaly"
    />
  );

  return (
    <>
      <AppLayout
        title="Anomaly Detection"
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
        highRiskCount={highSeverityCount}
      />
    </>
  );
}

export default function AnomalyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnomalyProvider>
      <AnomalyLayoutContent>{children}</AnomalyLayoutContent>
    </AnomalyProvider>
  );
}