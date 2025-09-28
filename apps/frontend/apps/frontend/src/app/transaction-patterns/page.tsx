// Transaction Patterns Dashboard Page - Following churn pattern
"use client";

import React, { useState, useEffect } from "react";
import {
  DashboardSection,
  ChartCard,
  InsightCard,
  type InsightData,
} from "components";
import {
  TransactionPatternsKPIs,
  TransactionPatternsCharts,
  TransactionPatternsInsights,
} from "./components";
import { useTransactionPatternsData } from "./hooks/useTransactionPatternsData";
import { useTransactionPatternsContext } from "./context";

export default function TransactionPatternsPage() {
  const { filters, setFilters, timeRange, setTimeRange, selectedPoints, selectionManager, customers, setCustomers } = useTransactionPatternsContext();
  const [activeInsight, setActiveInsight] = useState<InsightData | null>(null);
  const [insightPosition, setInsightPosition] = useState<{ x: number; y: number } | undefined>();

  const {
    loading,
    data,
    kpiMetrics,
    insights,
    metadata,
    ...chartData
  } = useTransactionPatternsData(filters);

  // Helper function to show insight card
  const showInsight = (data: InsightData, event?: React.MouseEvent) => {
    if (event) {
      setInsightPosition({ x: event.clientX, y: event.clientY });
    }
    setActiveInsight(data);
  };

  // Handle data point clicks
  const handleDataPointClick = (dataPoint: any, event: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Ctrl/Cmd+click: Show insight
      showInsight({
        title: `Data Point Analysis`,
        value: dataPoint.value?.toString() || "",
        subtitle: dataPoint.label || "",
        insights: [
          `Value: ${dataPoint.value}`,
          `Category: ${dataPoint.category || "N/A"}`,
          "Click to filter by this data point"
        ],
        source: "Transaction Patterns"
      }, event);
    } else {
      // Regular click: Apply filter
      // Implement filtering logic based on data point
      console.log("Filter by:", dataPoint);
    }
  };

  return (
    <>
      {/* Key Metrics Section */}
      <div id="key-metrics" />
      <DashboardSection title="Key Metrics">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted">Loading KPIs...</div>
          </div>
        ) : (
          <TransactionPatternsKPIs data={data} loading={loading} />
        )}
      </DashboardSection>

      {/* Main Analysis Section */}
      <div id="main-analysis" />
      <DashboardSection title="Transaction Patterns Analysis">
        <TransactionPatternsCharts
          data={chartData}
          loading={loading}
          onDataPointClick={handleDataPointClick}
        />
      </DashboardSection>

      {/* AI Insights Section */}
      <div id="ai-insights" />
      <DashboardSection title="AI Insights">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <TransactionPatternsInsights
            insights={insights}
            mlResults={data?.mlResults}
            loading={loading}
          />

          {/* Additional insights or feature importance chart */}
          <ChartCard
            title="Feature Importance"
            className="glass-card card-hover"
          >
            {data?.mlResults?.feature_importance ? (
              <div className="space-y-2">
                {data.mlResults.feature_importance.slice(0, 10).map((feature: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{feature.feature}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-border/20 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${feature.importance * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {(feature.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted">
                No feature importance data available
              </div>
            )}
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Insight Card Modal */}
      {activeInsight && (
        <InsightCard
          data={activeInsight}
          position={insightPosition}
          onClose={() => setActiveInsight(null)}
        />
      )}
    </>
  );
}
