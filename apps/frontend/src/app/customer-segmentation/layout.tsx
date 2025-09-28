"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { SegmentationProvider, useSegmentationContext } from './context';

function SegmentationLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    filters,
    setFilters,
    isChatPanelOpen,
    setIsChatPanelOpen,
    isBusinessIntelligencePanelOpen,
    setIsBusinessIntelligencePanelOpen,
    selectionManager,
    segments,
    insights
  } = useSegmentationContext();

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
      dashboardContext="customer_segmentation"
      additionalContext={{
        filters: {
          dateRange: `${filters.dateFrom} to ${filters.dateTo}`,
          segmentationMethod: filters.segmentationMethod,
          numSegments: filters.numSegments,
          customerTypes: filters.customerTypes?.join(", ") || "All",
          regions: filters.regions?.join(", ") || "All"
        },
        segments: segments.length
      }}
    />
  );

  // Transform segment data to match BI Panel format
  const transformedCustomers = segments.map((customer: any) => {
    // Determine risk level based on segment
    let riskLevel: "Low" | "Medium" | "High" | "Very High" = "Low";

    if (customer.segment_name === 'Lost' || customer.segment_name === 'At Risk') {
      riskLevel = "Very High";
    } else if (customer.segment_name === "Can't Lose Them" || customer.segment_name === 'Hibernating') {
      riskLevel = "High";
    } else if (customer.segment_name === 'New Customers' || customer.segment_name === 'Potential Loyalists') {
      riskLevel = "Medium";
    }

    // Calculate churn probability based on days since last activity
    let churnProbability = 0.1;
    if (customer.days_since_last_activity > 90) {
      churnProbability = 0.8;
    } else if (customer.days_since_last_activity > 60) {
      churnProbability = 0.6;
    } else if (customer.days_since_last_activity > 30) {
      churnProbability = 0.4;
    }

    return {
      customer_id: customer.customer_id || customer.id,
      name: customer.customer_name || customer.name || `Customer ${customer.customer_id}`,
      risk_level: riskLevel,
      churn_probability: churnProbability,
      avg_order_value: customer.avg_order_value || 0,
      frequency: customer.transaction_count || 0,
      lifetime_value: customer.lifetime_value || 0
    };
  });

  const biPanelContent = (
    <BusinessIntelligencePanel
      onClose={() => setIsBusinessIntelligencePanelOpen(false)}
      customers={transformedCustomers}
      dashboardContext="customer_segmentation"
    />
  );

  return (
    <AppLayout
      title="Customer Segmentation"
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
      highRiskCount={0} // Can be updated based on segment data
    />
  );
}

export default function CustomerSegmentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SegmentationProvider>
      <SegmentationLayoutContent>{children}</SegmentationLayoutContent>
    </SegmentationProvider>
  );
}