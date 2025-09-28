// Customer Segmentation Layout - Following churn pattern
"use client";

import React from "react";
import { CustomerSegmentationProvider } from "./context";
import { AppLayout } from "components";

export default function CustomerSegmentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerSegmentationProvider>
      <AppLayout
        appId="customer-segmentation"
        showChatPanel={false}
        showBusinessIntelligencePanel={true}
      >
        {children}
      </AppLayout>
    </CustomerSegmentationProvider>
  );
}
