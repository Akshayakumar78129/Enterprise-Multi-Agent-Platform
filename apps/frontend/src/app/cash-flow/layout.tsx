"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { CashFlowFilters } from "./components";
import { CashFlowProvider, useCashFlowContext } from "./context";
import { useCashFlowData } from "./hooks/useCashFlowData";

function HeaderFilters() {
  const { filters, setFilters } = useCashFlowContext();
  return (
    <CashFlowFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateRange: {
            startDate: "2017-01-01",
            endDate: "2021-12-31",
          },
          cashFlowType: "all",
          departments: [],
          regions: [],
          minAmount: null,
        })
      }
    />
  );
}

function CashFlowLayoutContent({ children }: { children: React.ReactNode }) {
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
  } = useCashFlowContext();

  // Get insights and kpiMetrics from the hook
  const { insights, kpiMetrics, cashFlowItems } = useCashFlowData(filters);

  // Calculate negative cash flow count for BI trigger
  const negativeCashFlowCount = cashFlowItems?.filter(item =>
    item.amount && item.amount < 0
  ).length || 0;

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
      dashboardContext="cash_flow"
      additionalContext={{
        filters: {
          cashFlowType: filters.cashFlowType || "All",
          departments: filters.departments?.join(", ") || "All",
          regions: filters.regions?.join(", ") || "All",
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
      data={cashFlowItems}
      dashboardContext="cash_flow"
    />
  );

  return (
    <AppLayout
      title="Cash Flow"
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
      highRiskCount={negativeCashFlowCount}
    />
  );
}

export default function CashFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CashFlowProvider>
      <CashFlowLayoutContent>{children}</CashFlowLayoutContent>
    </CashFlowProvider>
  );
}