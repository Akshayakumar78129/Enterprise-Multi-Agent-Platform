"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { ProductFilters } from "./components";
import { ProductPerformanceProvider, useProductPerformanceContext } from "./context";
import { useProductPerformanceData } from "./hooks/useProductPerformanceData";

function HeaderFilters() {
  const { filters, setFilters } = useProductPerformanceContext();
  return (
    <ProductFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateRange: {
            startDate: "2017-01-01",
            endDate: "2021-12-31",
          },
          categories: [],
          products: [],
          priceBands: [],
        })
      }
    />
  );
}

function ProductPerformanceLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    productData,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId,
  } = useProductPerformanceContext();

  // Get insights and kpiMetrics from the hook
  const { insights, kpiMetrics } = useProductPerformanceData(filters);

  // Calculate top products count for BI trigger
  const topProductsCount = productData?.topProducts?.length || 0;

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
      dashboardContext="product_performance"
      additionalContext={{
        filters: {
          categories: filters.categories?.join(", ") || "All",
          products: filters.products?.join(", ") || "All",
          priceBands: filters.priceBands?.join(", ") || "All",
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
      data={productData}
      dashboardContext="product"
    />
  );

  return (
    <>
      <AppLayout
        title="Product Performance"
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
        highRiskCount={topProductsCount}
      />
    </>
  );
}

export default function ProductPerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProductPerformanceProvider>
      <ProductPerformanceLayoutContent>{children}</ProductPerformanceLayoutContent>
    </ProductPerformanceProvider>
  );
}
