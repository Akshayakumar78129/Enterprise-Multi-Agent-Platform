"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { RegionalFilters } from "./components";
import { RegionalSalesProvider, useRegionalSalesContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useRegionalSalesContext();
  return (
    <RegionalFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateRange: {
            startDate: "2017-01-01",
            endDate: "2021-12-31",
          },
          countries: [],
          states: []
        })
      }
    />
  );
}

function RegionalSalesLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    regionalSalesData,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId,
  } = useRegionalSalesContext();

  // Get insights and kpiMetrics from the regionalSalesData in context
  const insights = regionalSalesData?.insights || [];
  const kpiMetrics = regionalSalesData?.kpiMetrics || {};

  // Calculate opportunity count for BI trigger
  const opportunityCount = regionalSalesData?.mainData?.opportunities?.filter(o =>
    o.opportunityCategory === 'Growth Opportunity' ||
    o.opportunityCategory === 'Star Region'
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
      dashboardContext="regional_sales"
      additionalContext={{
        filters: {
          countries: filters.countries?.join(", ") || "All",
          states: filters.states?.join(", ") || "All",
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
      data={regionalSalesData?.mainData}
      dashboardContext="regional_sales"
    />
  );

  return (
    <>
      <AppLayout
        title="Regional Sales Analyzer"
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
        highRiskCount={opportunityCount}
      />
    </>
  );
}

export default function RegionalSalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RegionalSalesProvider>
      <RegionalSalesLayoutContent>{children}</RegionalSalesLayoutContent>
    </RegionalSalesProvider>
  );
}
