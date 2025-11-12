"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { SalesFilters } from "./components";
import { SalesPerformanceProvider, useSalesPerformanceContext } from "./context";
import { useSalesPerformanceData } from "./hooks/useSalesPerformanceData";

function HeaderFilters() {
  const { filters, setFilters } = useSalesPerformanceContext();
  return (
    <SalesFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateRange: {
            startDate: "2017-01-01",
            endDate: "2021-12-31",
          },
          regions: [],
          categories: [],
        })
      }
    />
  );
}

function SalesPerformanceLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    salesData,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId,
  } = useSalesPerformanceContext();

  // Get insights and kpiMetrics from the hook
  const { insights, kpiMetrics } = useSalesPerformanceData(filters);

  // Calculate high performers for BI trigger
  const topPerformersCount = salesData?.mainData?.topCustomers?.length || 0;

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
      dashboardContext="sales_performance"
      additionalContext={{
        filters: {
          regions: filters.regions?.join(", ") || "All",
          categories: filters.categories?.join(", ") || "All",
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
      insights={insights || []}
      kpiMetrics={kpiMetrics || {}}
      data={salesData?.mainData}
      dashboardContext="sales"
    />
  );

  return (
    <>
      <AppLayout
        title="Revenue Analysis"
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
        highRiskCount={topPerformersCount}
      />
    </>
  );
}

export default function SalesPerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SalesPerformanceProvider>
      <SalesPerformanceLayoutContent>{children}</SalesPerformanceLayoutContent>
    </SalesPerformanceProvider>
  );
}