"use client";
import React, { useState, useEffect } from "react";
import {
  DashboardSection,
  RiskTrendsOverTime,
  ChartCard,
  InsightCard,
  PageLoader,
  FilterBar,
  type InsightData,
  type ChurnCustomer,
  getShiftClickManager
} from "components/index"
import {
  ChurnKPIs,
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
import { CUSTOMER_SEGMENT_OPTIONS, RISK_LEVEL_OPTIONS } from "@/lib/constants/filterOptions";

export default function ChurnPredictionPage() {
  const { filters, setFilters, timeRange, setTimeRange, selectedPoints, selectionManager, setChurnCustomers, setInsights, setKpiMetrics } = useChurnContext();
  const shiftClickManager = getShiftClickManager();
  const [activeInsight, setActiveInsight] = useState<InsightData | null>(null);
  const [insightPosition, setInsightPosition] = useState<{ x: number; y: number } | undefined>();

  const {
    loading,
    error,
    data,
    featureImportance,
    segmentComparison,
    riskTrends,
    riskPyramidData,
    probabilityArray,
    insights,
    kpiMetrics,
    hasNoData
  } = useChurnData(filters);

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

  // Update context when insights and kpiMetrics change
  useEffect(() => {
    setInsights(insights || []);
    setKpiMetrics(kpiMetrics || {});
  }, [insights, kpiMetrics, setInsights, setKpiMetrics]);

  // Error state
  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Churn Data Available
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "There's no churn prediction data to display for the selected filters. Try adjusting your filters or check back later."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Churn Prediction",
      }}
    >
      <div className="space-y-6">
        {/* Filters Section */}
        <DashboardSection>
          <FilterBar
            config={{
              dateRange: {
                enabled: true,
                value: filters.dateRange || { startDate: '2017-01-01', endDate: '2021-12-31' },
                onChange: (range) => {
                  if (range?.startDate && range?.endDate) {
                    setFilters({
                      ...filters,
                      dateRange: {
                        startDate: range.startDate,
                        endDate: range.endDate
                      }
                    });
                  }
                }
              },
              multiSelect: [
                {
                  id: 'riskLevels',
                  label: 'Risk Level',
                  options: RISK_LEVEL_OPTIONS,
                  value: filters.riskLevels || [],
                  onChange: (values) => setFilters({ ...filters, riskLevels: values }),
                  placeholder: 'Select risk levels...'
                },
                {
                  id: 'segments',
                  label: 'Customer Segment',
                  options: CUSTOMER_SEGMENT_OPTIONS,
                  value: filters.segments || [],
                  onChange: (values) => setFilters({ ...filters, segments: values }),
                  placeholder: 'Select segments...'
                }
              ]
            }}
            onReset={() => {
              setFilters({
                dateRange: {
                  startDate: '2017-01-01',
                  endDate: '2021-12-31'
                },
                riskLevels: [],
                segments: [],
                productCategories: []
              });
            }}
            showResetButton={true}
          />
        </DashboardSection>

        <div id="key-metrics" />
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
          <ChurnKPIs data={data} loading={false} />
        </DashboardSection>

      <div id="risk-analysis" />
      <DashboardSection>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <ChurnRiskAnalysis
            riskPyramidData={riskPyramidData}
            probabilityData={probabilityArray}
            loading={false}
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
      <DashboardSection>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <ChurnAIInsights
            featureImportance={featureImportance}
            segmentComparison={segmentComparison}
            loading={false}
          />
        </div>
      </DashboardSection>

      <div id="risk-trends" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Risk Trends Over Time</h3>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Risk Trends Over Time",
              value: `Churn risk trends visualization`,
              source: 'Churn Dashboard - Risk Trends'
            }, event.nativeEvent);
          }}
        >
          <RiskTrendsOverTime
            data={riskTrends}
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

      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Risk Details</h3>
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
      </div>
    </PageLoader>
  );
}