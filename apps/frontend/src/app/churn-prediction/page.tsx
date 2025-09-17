"use client";
import React, { useState, useEffect } from "react";
import {
  DashboardSection,
  Button,
  Skeleton,
  RiskTrendsOverTime
} from "components/index"
import {
  ChurnKPIs,
  ChurnFilters,
  ChurnRiskAnalysis,
  ChurnAIInsights,
  ChurnCustomerTable
} from "./components"
import { useChurnData } from "./hooks/useChurnData";
import { useChurnContext } from "./context";

export default function ChurnPredictionPage() {
  const { filters, setFilters, timeRange, setTimeRange } = useChurnContext();
  // Removed no-data modal per request

  const {
    loading,
    data,
    featureImportance,
    segmentComparison,
    riskTrends,
    riskPyramidData,
    probabilityArray,
    
  } = useChurnData(filters, timeRange);
console.log("data", data);
  return (
    <>
    

      <div id="key-metrics" />
      <DashboardSection title="Key Metrics">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted">Loading KPIs...</div>
          </div>
        ) : (
          <ChurnKPIs data={data} loading={loading} />
        )}
      </DashboardSection>

      <div id="risk-analysis" />
      <DashboardSection title="Risk Analysis">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <ChurnRiskAnalysis
            riskPyramidData={riskPyramidData}
            probabilityData={probabilityArray}
            loading={loading}
            onRiskLevelClick={(level) =>
              setFilters({ ...filters, riskLevels: [level] })
            }
          />
        </div>
      </DashboardSection>

      <div id="ai-insights" />
      <DashboardSection title="AI Insights">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <ChurnAIInsights
            featureImportance={featureImportance}
            segmentComparison={segmentComparison}
            loading={loading}
          />
        </div>
      </DashboardSection>

      <div id="risk-trends" />
      <DashboardSection title="Risk Trends">
        <RiskTrendsOverTime
          data={riskTrends}
          title="Risk Trends Over Time"
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onDataPointClick={(dataPoint) => console.log("Data point clicked:", dataPoint)}
        />
      </DashboardSection>

      <DashboardSection title="Customer Risk Details">
        <ChurnCustomerTable
          data={data?.customerStats || []}
          loading={loading}
        />
      </DashboardSection>
    </>
  );
}