// Engagement Classifier Layout - Following churn pattern
"use client";

import React from "react";
import { EngagementClassifierProvider } from "./context";
import { AppLayout } from "components";

export default function EngagementClassifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EngagementClassifierProvider>
      <AppLayout
        appId="engagement-classifier"
        showChatPanel={false}
        showBusinessIntelligencePanel={true}
      >
        {children}
      </AppLayout>
    </EngagementClassifierProvider>
  );
}
