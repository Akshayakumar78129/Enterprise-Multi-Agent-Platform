// Transaction Patterns Layout - Following churn pattern
"use client";

import React from "react";
import { TransactionPatternsProvider } from "./context";
import { AppLayout } from "components";

export default function TransactionPatternsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TransactionPatternsProvider>
      <AppLayout
        appId="transaction-patterns"
        showChatPanel={false}
        showBusinessIntelligencePanel={true}
      >
        {children}
      </AppLayout>
    </TransactionPatternsProvider>
  );
}
