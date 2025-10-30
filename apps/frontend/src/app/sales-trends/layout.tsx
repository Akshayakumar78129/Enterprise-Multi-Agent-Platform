"use client";

import {
  AppLayout,
  ChatPanel,
  BusinessIntelligencePanel
} from "components/index";
import React from "react";
import { SalesTrendsProvider, useSalesTrendsContext } from "./context";
import { useSalesTrendsData } from "./hooks/useSalesTrendsData";

function SalesTrendsLayoutContent({ children }: { children: React.ReactNode }) {
  const {
    filters,
    salesData
  } = useSalesTrendsContext();

  // Get insights and kpiMetrics from the hook
  const { insights, kpiMetrics } = useSalesTrendsData(filters);

  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<any[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatIsLoading, setChatIsLoading] = React.useState(false);

  const chatSessionId = React.useMemo(() => `sales-trends-${Date.now()}`, []);
  const chatUserId = "user-1";

  const mainContent = (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mt-6">
        {children}
      </div>
    </div>
  );

  const chatPanelContent = (
    <ChatPanel
      onClose={() => setIsChatOpen(false)}
      selectedPoints={[]}
      onClearSelection={() => {}}
      dashboardContext="sales_trends"
      additionalContext={{
        filters: {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          granularity: filters.granularity,
          metric: filters.metric
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
      data={salesData?.mainData}
      dashboardContext="sales_trends"
    />
  );

  return (
    <>
      <AppLayout
        title="Sales Trends Analysis"
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
        hasSelectedPoints={false}
        highRiskCount={0}
      />
    </>
  );
}

export default function SalesTrendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SalesTrendsProvider>
      <SalesTrendsLayoutContent>{children}</SalesTrendsLayoutContent>
    </SalesTrendsProvider>
  );
}
