"use client";

import { DashboardLayout } from "components/index";
import React from "react";
import { ChurnFilters, ChurnKPIs } from "./components";
import { ChurnProvider, useChurnContext } from "./context";

function HeaderFilters() {
  const { filters, setFilters } = useChurnContext();
  return (
    <ChurnFilters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() =>
        setFilters({
          dateRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
          },
          riskLevels: [],
          segments: [],
          search: "",
        })
      }
    />
  );
}

export default function ChurnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChurnProvider>
      <DashboardLayout
        title="Churn Prediction"
        headerContent={<HeaderFilters />}
        sectionLinks={[
          { id: "key-metrics", label: "Key Metrics" },
          { id: "risk-analysis", label: "Risk Analysis" },
          { id: "ai-insights", label: "AI Insights" },
          { id: "risk-trends", label: "Risk Trends" },
        ]}
      >
        {children}
      </DashboardLayout>
    </ChurnProvider>
  );
}
