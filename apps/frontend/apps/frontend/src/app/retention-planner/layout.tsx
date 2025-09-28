// Retention Planner Layout - Following churn pattern
"use client";

import React from "react";
import { RetentionPlannerProvider } from "./context";
import { AppLayout } from "components";

export default function RetentionPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RetentionPlannerProvider>
      <AppLayout
        appId="retention-planner"
        showChatPanel={false}
        showBusinessIntelligencePanel={true}
      >
        {children}
      </AppLayout>
    </RetentionPlannerProvider>
  );
}
