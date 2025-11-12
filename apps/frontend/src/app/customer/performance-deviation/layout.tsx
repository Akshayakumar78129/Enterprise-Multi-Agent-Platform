"use client";

import {
  AppLayout,
  ChatPanel
} from "components/index";
import React from "react";
import { PerformanceDeviationProvider, usePerformanceDeviationContext } from "./context";
import { PerformanceBIPanel, DeviationFilters } from "./components";

function HeaderFilters() {
  const { filters, setFilters } = usePerformanceDeviationContext();

  return (
    <DeviationFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('performance_deviation_filters');
        }
        // Reset to defaults
        setFilters({
          dateRange: {
            startDate: "2017-01-01",
            endDate: "2021-12-31"
          },
          businessFunctions: ['sales', 'customer', 'finance'],
          significanceThreshold: 0.05,
          productCategories: []
        });
      }}
    />
  );
}

function PerformanceDeviationLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    timeRange,
    performanceData,
    insights,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId,
  } = usePerformanceDeviationContext();

  // Calculate high deviation count for BI trigger
  const highDeviationCount = performanceData.filter((d: any) =>
    Math.abs(d.deviation || 0) > 2 // Deviation > 2 standard deviations
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
      dashboardContext="performance_deviation"
      additionalContext={{
        filters: {
          businessFunctions: filters.businessFunctions.join(", ") || "All",
          productCategories: filters.productCategories?.join(", ") || "All",
          significanceThreshold: filters.significanceThreshold,
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
    <PerformanceBIPanel
      onClose={() => setIsBIModalOpen(false)}
      performanceData={performanceData}
      insights={insights}
    />
  );

  return (
    <AppLayout
      title="Performance Deviation"
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
      highRiskCount={highDeviationCount}
    />
  );
}

export default function PerformanceDeviationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PerformanceDeviationProvider>
      <PerformanceDeviationLayoutContent>{children}</PerformanceDeviationLayoutContent>
    </PerformanceDeviationProvider>
  );
}