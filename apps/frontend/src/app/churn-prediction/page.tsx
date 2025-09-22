"use client";
import React, { useState, useEffect } from "react";
import {
  DashboardSection,
  RiskTrendsOverTime,
  ChartCard,
  InsightCard,
  type InsightData,
  type ChurnCustomer
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
import {
  generateRiskInsights,
  generateFeatureInsights,
  generateDashboardInsights,
  calculateAvgLTV
} from "./utils/insightGenerator";

export default function ChurnPredictionPage() {
  const { filters, setFilters, timeRange, setTimeRange, selectedPoints, selectionManager, setChurnCustomers } = useChurnContext();
  const [activeInsight, setActiveInsight] = useState<InsightData | null>(null);
  const [insightPosition, setInsightPosition] = useState<{ x: number; y: number } | undefined>();

  const {
    loading,
    data,
    featureImportance,
    segmentComparison,
    riskTrends,
    riskPyramidData,
    probabilityArray,

  } = useChurnData(filters, timeRange);

  // Helper function to show insight card
  const showInsight = (data: InsightData, event?: React.MouseEvent) => {
    if (event) {
      setInsightPosition({ x: event.clientX, y: event.clientY });
    }
    setActiveInsight(data);
  };

  // Convert data to ChurnCustomer format for BI modal
  const churnCustomers: ChurnCustomer[] = React.useMemo(() =>
    data?.customerStats?.map((c: any) => ({
      customer_id: c.customer_id,
      name: c.customer_name,
      risk_level: c.riskLevel || c.risk_level || "Medium",
      churn_probability: c.churn_probability || 0.5,
      avg_order_value: c.avg_order_value,
      frequency: c.frequency,
      lifetime_value: c.lifetime_sales
    })) || [], [data?.customerStats]
  );

  // Update context when churnCustomers changes
  useEffect(() => {
    setChurnCustomers(churnCustomers);
  }, [churnCustomers, setChurnCustomers]);

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
            onRiskLevelClick={(level, event) => {
              if (event?.ctrlKey || event?.metaKey) {
                // Ctrl/Cmd+click: Show insight
                const riskData = riskPyramidData.find(r => r.level === level);
                if (riskData) {
                  // Generate dynamic insights based on real data
                  const insights = generateRiskInsights(riskData);

                  // Calculate average LTV for this risk segment
                  const segmentCustomers = churnCustomers.filter(
                    c => c.risk_level === level
                  );
                  const avgLTV = calculateAvgLTV(segmentCustomers);
                  insights.push(`Average lifetime value in this segment: ${avgLTV}`);

                  showInsight({
                    title: `${level} Risk Analysis`,
                    value: `${riskData.count.toLocaleString()} customers`,
                    subtitle: `${riskData.percentage}% of total customer base`,
                    insights,
                    source: "Risk Pyramid"
                  }, event);
                }
              } else {
                // Regular click: Filter
                setFilters({ ...filters, riskLevels: [level] });
              }
            }}
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
        <ChartCard
          title="Risk Trends Over Time"
          className="glass-card card-hover"
        >
          <RiskTrendsOverTime
            data={riskTrends}
            timeRange={timeRange}
            onTimeRangeChange={(newTimeRange) => {
              setTimeRange(newTimeRange);
              // Clear date range when time range is selected
              setFilters(prev => ({
                ...prev,
                dateRange: { startDate: "", endDate: "" }
              }));
            }}
            onDataPointClick={(dataPoint, event) => {
            if (event?.shiftKey) {
              // Shift+click: Add to selection
              selectionManager.addPoint({
                label: `${dataPoint.date} - ${dataPoint.riskLevel}`,
                value: dataPoint.value,
                source: "Risk Trends"
              }, true);
            }
            }}
          />
        </ChartCard>
      </DashboardSection>

      <DashboardSection title="Customer Risk Details">
        <ChurnCustomerTable
          data={data?.customerStats || []}
          loading={loading}
        />
      </DashboardSection>


      {activeInsight && (
        <InsightCard
          data={activeInsight}
          position={insightPosition}
          isVisible={!!activeInsight}
          onClose={() => setActiveInsight(null)}
          onDrillDown={() => {
            // Handle drill down
            console.log("Drill down:", activeInsight);
            setActiveInsight(null);
          }}
          onExport={() => {
            // Handle export
            console.log("Export:", activeInsight);
          }}
        />
      )}
    </>
  );
}