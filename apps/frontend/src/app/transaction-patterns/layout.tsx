"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { TransactionFilters } from "./components";
import { TransactionPatternsProvider, useTransactionPatternsContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useTransactionPatternsContext();
  return (
    <TransactionFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateRange: {
            // Default to full year 2021 data
            startDate: "2021-01-01",
            endDate: "2021-12-31",
          },
          paymentMethods: [],
          segments: [],
          productCategories: []
        })
      }
    />
  );
}

function TransactionPatternsLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    patternData
  } = useTransactionPatternsContext();

  // Calculate anomaly count for BI trigger
  const anomalyCount = patternData?.anomalyCount || 0;

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
      dashboardContext="transaction_patterns"
      additionalContext={{
        filters: {
          paymentMethods: filters.paymentMethods?.join(", ") || "All",
          segments: filters.segments?.join(", ") || "All",
          productCategories: filters.productCategories?.join(", ") || "All",
          anomalyOnly: filters.anomalyOnly,
          dateRange: filters.dateRange,
          amountRange: {
            min: filters.minAmount,
            max: filters.maxAmount
          }
        }
      }}
    />
  );

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      data={patternData}
      dashboardContext="transaction_patterns"
    />
  );

  return (
    <>
      <AppLayout
        title="Transaction Patterns"
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
        anomalyCount={anomalyCount}
      />
    </>
  );
}

export default function TransactionPatternsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TransactionPatternsProvider>
      <TransactionPatternsLayoutContent>{children}</TransactionPatternsLayoutContent>
    </TransactionPatternsProvider>
  );
}