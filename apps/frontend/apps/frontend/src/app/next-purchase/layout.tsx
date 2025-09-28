// Next Purchase Predictor Layout - Following churn pattern
"use client";

import React from "react";
import { NextPurchaseProvider } from "./context";
import { AppLayout } from "components";

export default function NextPurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextPurchaseProvider>
      <AppLayout
        appId="next-purchase"
        showChatPanel={false}
        showBusinessIntelligencePanel={true}
      >
        {children}
      </AppLayout>
    </NextPurchaseProvider>
  );
}
