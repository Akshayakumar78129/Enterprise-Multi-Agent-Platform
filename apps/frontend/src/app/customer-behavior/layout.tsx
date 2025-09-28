"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { BehaviorFilters } from "./components";
import { BehaviorProvider, useBehaviorContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useBehaviorContext();
  return (
    <BehaviorFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          timePeriod: "2021-01-01:2021-12-31",
          segmentId: null,
          segmentIds: [],
          behaviorTypes: ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"],
          minTransactions: 2,
          customerIds: [],
          loyaltyStatus: [],
        })
      }
    />
  );
}

function BehaviorLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    behaviorCustomers
  } = useBehaviorContext();

  // Calculate high engagement customers for BI trigger
  const highEngagementCount = behaviorCustomers.filter(c =>
    c.engagement_score && c.engagement_score > 0.7
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
      dashboardContext="customer_behavior"
      additionalContext={{
        filters: {
          timePeriod: filters.timePeriod,
          segmentId: filters.segmentId || "All",
          behaviorTypes: filters.behaviorTypes.join(", ") || "All",
          minTransactions: filters.minTransactions,
          loyaltyStatus: filters.loyaltyStatus.join(", ") || "All"
        }
      }}
    />
  );

  // Transform behavior customers to match BI panel expectations
  const transformedCustomers = behaviorCustomers.map(customer => ({
    customer_id: customer.customer_id,
    name: customer.customer_name || `Customer ${customer.customer_id}`,
    risk_level: customer.engagement_score && customer.engagement_score < 0.3 ? 'High' :
                customer.engagement_score && customer.engagement_score < 0.6 ? 'Medium' : 'Low',
    churn_probability: customer.engagement_score ? (1 - customer.engagement_score) : 0.5,
    avg_order_value: customer.avg_order_value,
    frequency: customer.purchase_frequency,
    lifetime_value: customer.total_spend || customer.estimated_clv
  }));

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      customers={transformedCustomers}
      dashboardContext="customer_behavior"
    />
  );

  return (
    <AppLayout
      title="Customer Behavior"
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
      highRiskCount={highEngagementCount}
    />
  );
}

export default function BehaviorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BehaviorProvider>
      <BehaviorLayoutContent>{children}</BehaviorLayoutContent>
    </BehaviorProvider>
  );
}