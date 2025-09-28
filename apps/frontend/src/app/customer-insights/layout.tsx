"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { CustomerInsightsProvider, useCustomerInsightsContext } from './context';

function InsightsLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    filters,
    setFilters,
    isChatPanelOpen,
    setIsChatPanelOpen,
    isBusinessIntelligencePanelOpen,
    setIsBusinessIntelligencePanelOpen,
    selectionManager,
    customers
  } = useCustomerInsightsContext();

  // Get selected points from selection manager
  const [selectedPoints, setSelectedPoints] = React.useState<any[]>([]);

  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });
    return unsubscribe;
  }, [selectionManager]);

  const mainContent = (
    <div className="p-4 sm:p-6 lg:p-8">
      {children}
    </div>
  );

  const chatPanelContent = (
    <ChatPanel
      onClose={() => setIsChatPanelOpen(false)}
      selectedPoints={selectedPoints}
      onClearSelection={() => selectionManager.clearAll()}
      dashboardContext="customer_insights"
      additionalContext={{
        filters: {
          dateRange: filters.dateRange ? `${filters.dateRange.from} to ${filters.dateRange.to}` : "All time",
          insightType: filters.insightType || "All",
          customerSegment: filters.customerSegment || "All"
        },
        totalCustomers: customers.length
      }}
    />
  );

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBusinessIntelligencePanelOpen(false)}
      customers={customers}
      dashboardContext="customer_insights"
    />
  );

  return (
    <AppLayout
      title="Customer Insights"
      mainContent={mainContent}
      chatPanel={isChatPanelOpen ? chatPanelContent : undefined}
      biPanel={isBusinessIntelligencePanelOpen ? biPanelContent : undefined}
      isChatOpen={isChatPanelOpen}
      isBIOpen={isBusinessIntelligencePanelOpen}
      onChatToggle={() => setIsChatPanelOpen(!isChatPanelOpen)}
      onBIToggle={() => setIsBusinessIntelligencePanelOpen(!isBusinessIntelligencePanelOpen)}
      onChatExpandToggle={(expanded) => {
        if (!expanded) setIsChatPanelOpen(false);
      }}
      onBIExpandToggle={(expanded) => {
        if (!expanded) setIsBusinessIntelligencePanelOpen(false);
      }}
      hasSelectedPoints={selectedPoints.length > 0}
      highRiskCount={0} // Can be updated based on insights data
    />
  );
}

export default function CustomerInsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerInsightsProvider>
      <InsightsLayoutContent>{children}</InsightsLayoutContent>
    </CustomerInsightsProvider>
  );
}