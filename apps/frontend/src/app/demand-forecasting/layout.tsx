"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { ForecastFilters } from "./components";
import { ForecastProvider, useForecastContext } from "./context";

function HeaderFilters() {
  const { filters,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId, setFilters } = useForecastContext();
  return (
    <ForecastFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          timePeriod: "2021-01-01:2021-12-31",
          forecastHorizon: 90,
          products: [],
          regions: [],
          modelType: "auto",
          confidenceLevel: 95,
        })
      }
    />
  );
}

function ForecastLayoutContent({ children }: { children: React.ReactNode }) {
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
    forecastData
  } = useForecastContext();

  // Calculate high variance forecasts for BI trigger
  const highVarianceCount = forecastData.filter(item =>
    item.variance && item.variance > 0.3
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
      dashboardContext="demand_forecasting"additionalContext={{
        filters: {
          timePeriod: filters.timePeriod,
          forecastHorizon: filters.forecastHorizon,
          products: filters.products.join(", ") || "All",
          regions: filters.regions.join(", ") || "All",
          modelType: filters.modelType,
          confidenceLevel: filters.confidenceLevel
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

  // Transform forecast data to match BI panel expectations
  const transformedItems = forecastData.map(item => ({
    item_id: item.item_id,
    name: item.item_name || `Item ${item.item_id}`,
    forecast_demand: item.forecast_demand,
    actual_demand: item.actual_demand,
    accuracy: item.accuracy || 0,
    risk_level: item.variance && item.variance > 0.3 ? 'High' :
                item.variance && item.variance > 0.15 ? 'Medium' : 'Low',
    category: item.category
  }));

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      customers={transformedItems}
      dashboardContext="demand_forecasting"
    />
  );

  return (
    <AppLayout
      title="Demand Forecasting"
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
      highRiskCount={highVarianceCount}
    />
  );
}

export default function ForecastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ForecastProvider>
      <ForecastLayoutContent>{children}</ForecastLayoutContent>
    </ForecastProvider>
  );
}