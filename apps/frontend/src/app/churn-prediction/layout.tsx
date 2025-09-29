"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { ChurnFilters, ChurnKPIs } from "./components";
import { ChurnProvider, useChurnContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useChurnContext();
  return (
    <ChurnFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateRange: {
            // Use full year 2021 data (Jan 1 - Dec 31, 2021)
            startDate: "2021-01-01",
            endDate: "2021-12-31",
          },
          riskLevels: [],
          segments: [],
          productCategories: [],
        })
      }
    />
  );
}

function ChurnLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    timeRange,
    churnCustomers
  } = useChurnContext();

  // Calculate high risk customers for BI trigger
  const highRiskCount = churnCustomers.filter(c =>
    c.risk_level === "High" || c.risk_level === "Very High"
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
      dashboardContext="churn_prediction"
      additionalContext={{
        filters: {
          riskLevels: filters.riskLevels.join(", ") || "All",
          segments: filters.segments.join(", ") || "All",
          productCategories: filters.productCategories?.join(", ") || "All",
          timeRange: timeRange,
          dateRange: filters.dateRange
        }
      }}
    />
  );

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      customers={churnCustomers}
      dashboardContext="churn_prediction"
    />
  );

  return (
    <>
      <AppLayout
        title="Churn Prediction"
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
        highRiskCount={highRiskCount}
      />
    </>
  );
}

export default function ChurnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChurnProvider>
      <ChurnLayoutContent>{children}</ChurnLayoutContent>
    </ChurnProvider>
  );
}
