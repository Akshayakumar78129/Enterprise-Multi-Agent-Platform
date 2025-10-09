"use client";

import {
  AppLayout,
  ChatPanel
} from "components/index";
import React from "react";
import { FilterBar } from "components";
import { PerformanceDeviationProvider, usePerformanceDeviationContext } from "./context";
import { PerformanceBIPanel } from "./components/PerformanceBIPanel";

function HeaderFilters() {
  const { filters, setFilters } = usePerformanceDeviationContext();

  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: {
            from: new Date(filters.dateFrom),
            to: new Date(filters.dateTo)
          },
          onChange: (range) => {
            setFilters({
              ...filters,
              dateFrom: range.from.toISOString().split('T')[0],
              dateTo: range.to.toISOString().split('T')[0]
            });
          }
        },
        multiSelect: [
          {
            id: 'businessFunctions',
            label: 'Business Functions',
            options: [
              { value: 'sales', label: 'Sales' },
              { value: 'customer', label: 'Customer' },
              { value: 'finance', label: 'Finance' }
            ],
            value: filters.businessFunctions,
            onChange: (values) => {
              setFilters({
                ...filters,
                businessFunctions: values
              });
            }
          },
          {
            id: 'productCategories',
            label: 'Product Categories',
            options: [
              { value: 'Core Platform', label: 'Core Platform' },
              { value: 'Analytics Suite', label: 'Analytics Suite' },
              { value: 'API Services', label: 'API Services' },
              { value: 'Professional Services', label: 'Professional Services' },
              { value: 'Support Packages', label: 'Support Packages' },
              { value: 'Add-ons', label: 'Add-ons' }
            ],
            value: filters.productCategories,
            onChange: (values) => {
              setFilters({
                ...filters,
                productCategories: values
              });
            }
          },
          {
            id: 'threshold',
            label: 'Significance Threshold',
            options: [
              { value: '0.01', label: 'Very High (0.01)' },
              { value: '0.05', label: 'High (0.05)' },
              { value: '0.10', label: 'Medium (0.10)' }
            ],
            value: [filters.significanceThreshold.toString()],
            onChange: (values) => {
              if (values.length > 0) {
                setFilters({
                  ...filters,
                  significanceThreshold: parseFloat(values[0])
                });
              }
            }
          }
        ]
      }}
      onReset={() => {
        setFilters({
          dateFrom: "2021-01-01",
          dateTo: "2021-12-31",
          businessFunctions: ['sales', 'customer', 'finance'],
          significanceThreshold: 0.05,
          productCategories: []
        });
      }}
      showResetButton={true}
    />
  );
}

function PerformanceDeviationLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    selectedPoints,
    selectionManager,
    filters,
    timeRange,
    performanceData,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId,
  } = usePerformanceDeviationContext();

  // Calculate high deviation count for BI trigger
  const highDeviationCount = performanceData.filter((d: any) =>
    Math.abs(d.deviation || 0) > 2 // Deviation > 2 standard deviations
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
      dashboardContext="performance_deviation"
      additionalContext={{
        filters: {
          businessFunctions: filters.businessFunctions.join(", ") || "All",
          productCategories: filters.productCategories?.join(", ") || "All",
          significanceThreshold: filters.significanceThreshold,
          timeRange: timeRange,
          dateRange: {
            startDate: filters.dateFrom,
            endDate: filters.dateTo
          }
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
    <PerformanceBIPanel
      onClose={() => setIsBIModalOpen(false)}
      performanceData={performanceData}
    />
  );

  return (
    <AppLayout
      title="Performance Deviation"
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
      highRiskCount={highDeviationCount}
    />
  );
}

export default function PerformanceDeviationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PerformanceDeviationProvider>
      <PerformanceDeviationLayoutContent>{children}</PerformanceDeviationLayoutContent>
    </PerformanceDeviationProvider>
  );
}