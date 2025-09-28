// Customer Lifetime Value Layout - Following churn pattern
"use client";

import React from "react";
import { CustomerLtvProvider } from "./context";
import { AppLayout } from "components";

export default function CustomerLtvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerLtvProvider>
      <AppLayout
        appId="customer-ltv"
        showChatPanel={false}
        showBusinessIntelligencePanel={true}
      >
        {children}
      </AppLayout>
    </CustomerLtvProvider>
  );
}
