"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { CashFlowFilters } from "./components";
import { CashFlowProvider, useCashFlowContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useCashFlowContext();
  return (
    <CashFlowFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          timePeriod: "2021-01-01:2021-12-31",
          cashFlowType: "all",
          departments: [],
          projects: [],
          minAmount: 1000,
          includeProjections: true,
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
    cashFlowData
  } = useCashFlowContext();

  const negativeCashFlowCount = cashFlowData.filter(item =>
    item.net_cash_flow && item.net_cash_flow < 0
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
      dashboardContext="cash_flow"
      additionalContext={{
        filters: {
          timePeriod: filters.timePeriod,
          cashFlowType: filters.cashFlowType,
          departments: filters.departments.join(", ") || "All",
          projects: filters.projects.join(", ") || "All",
          minAmount: filters.minAmount,
          includeProjections: filters.includeProjections
        }
      }}
    />
  );

  const transformedItems = cashFlowData.map(item => ({
    item_id: item.item_id,
    name: item.item_name || `Item ${item.item_id}`,
    net_cash_flow: item.net_cash_flow,
    operating_cf: item.operating_cf,
    investment_cf: item.investment_cf,
    risk_level: item.net_cash_flow && item.net_cash_flow < 0 ? 'High' :
                item.net_cash_flow && item.net_cash_flow < 50000 ? 'Medium' : 'Low',
    category: item.category
  }));

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      customers={transformedItems}
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