// Purchase Frequency Layout - Following churn pattern
"use client";

import React from "react";
import { PurchaseFrequencyProvider } from "./context";
import { AppLayout } from "components";

export default function PurchaseFrequencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PurchaseFrequencyProvider>
      <AppLayout
        appId="purchase-frequency"
        showChatPanel={false}
        showBusinessIntelligencePanel={true}
      >
        {children}
      </AppLayout>
    </PurchaseFrequencyProvider>
  );
}
