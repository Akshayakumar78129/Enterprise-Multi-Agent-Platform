"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { AnomalyFilters } from "./components";
import { AnomalyProvider, useAnomalyContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useAnomalyContext();
  return (
    <AnomalyFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateFrom: "2021-01-01",
          dateTo: "2021-12-31",
          severityLevels: [],
          segments: [],
          regions: [],
          contamination: 0.1,
          search: "",
        })
      }
    />
  );
}

function AnomalyLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    anomalyCustomers
  } = useAnomalyContext();

  // Calculate high severity anomalies for BI trigger
  const highSeverityCount = anomalyCustomers.filter(c =>
    c.severity_level >= 4
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
      dashboardContext="anomaly_detection"
      additionalContext={{
        filters: {
          severityLevels: filters.severityLevels.join(", ") || "All",
          segments: filters.segments.join(", ") || "All",
          regions: filters.regions.join(", ") || "All",
          dateRange: {
            startDate: filters.dateFrom,
            endDate: filters.dateTo
          },
          contamination: filters.contamination
        }
      }}
    />
  );

  // Transform anomaly customers to match BI panel expectations
  const transformedCustomers = anomalyCustomers.map(customer => ({
    customer_id: customer.customer_id,
    name: customer.customer_name || `Customer ${customer.customer_id}`,
    risk_level: customer.severity_level >= 4 ? 'Very High' :
                customer.severity_level >= 3 ? 'High' :
                customer.severity_level >= 2 ? 'Medium' : 'Low',
    churn_probability: customer.anomaly_score,
    avg_order_value: customer.avg_transaction_value,
    frequency: customer.transaction_count,
    lifetime_value: customer.avg_transaction_value * customer.transaction_count
  }));

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBIModalOpen(false)}
      customers={transformedCustomers}
      dashboardContext="anomaly_detection"
    />
  );

  return (
    <AppLayout
      title="Anomaly Detection"
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
      highRiskCount={highSeverityCount}
    />
  );
}

export default function AnomalyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnomalyProvider>
      <AnomalyLayoutContent>{children}</AnomalyLayoutContent>
    </AnomalyProvider>
  );
}