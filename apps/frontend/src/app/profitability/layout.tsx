"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { ProfitabilityFilters } from "./components";
import { ProfitabilityProvider, useProfitabilityContext } from "./context";

function HeaderFilters() {
  const { filters,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId, setFilters } = useProfitabilityContext();
  return (
    <ProfitabilityFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          timePeriod: "2021-01-01:2021-12-31",
          profitType: "gross",
          segments: [],
          products: [],
          minMargin: 0,
          costCategories: [],
        })
      }
    />
  );
}

function ProfitabilityLayoutContent({ children }: { children: React.ReactNode }) {
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
    profitabilityData
  } = useProfitabilityContext();

  const lowMarginCount = profitabilityData.filter(item =>
    item.margin && item.margin < 10
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
      dashboardContext="profitability"additionalContext={{
        filters: {
          timePeriod: filters.timePeriod,
          profitType: filters.profitType,
          segments: filters.segments.join(", ") || "All",
          products: filters.products.join(", ") || "All",
          minMargin: filters.minMargin,
          costCategories: filters.costCategories.join(", ") || "All"
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

  const transformedItems = profitabilityData.map(item => ({
    item_id: item.item_id,
    name: item.item_name || `Item ${item.item_id}`,
    revenue: item.revenue,
    cost: item.cost,
    margin: item.margin,
    profit: item.profit,
    risk_level: item.margin && item.margin < 10 ? 'High' :
                item.margin && item.margin < 20 ? 'Medium' : 'Low',
    category: item.category
  }));

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      customers={transformedItems}
      dashboardContext="profitability"
    />
  );

  return (
    <AppLayout
      title="Profitability"
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
      highRiskCount={lowMarginCount}
    />
  );
}

export default function ProfitabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfitabilityProvider>
      <ProfitabilityLayoutContent>{children}</ProfitabilityLayoutContent>
    </ProfitabilityProvider>
  );
}