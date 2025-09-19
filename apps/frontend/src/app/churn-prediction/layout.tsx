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
            // Use last 90 days of 2021 data (Oct 1 - Dec 31, 2021)
            startDate: "2021-10-01",
            endDate: "2021-12-31",
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
