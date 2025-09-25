"use client";

import React, { useEffect } from "react";
import {
  DashboardSection,
  KPIRow,
  Skeleton,
  ChartCard,
  InsightCard
} from "components";
import { usePerformanceData } from "./hooks/usePerformanceData";
import {
  PerformanceExplorer,
  FeatureImportanceChart,
  VarianceDecomposition,
  DeviationPatterns,
  BusinessComparison,
  ExternalFactorCorrelation,
  DeviationPatternExplorer
} from "./components";
import { usePerformanceDeviationContext } from "./context";

export default function PerformanceDeviationPage() {
  const {
    filters,
    selectedKPI,
    setSelectedKPI,
    setPerformanceData,
    selectionManager
  } = usePerformanceDeviationContext();

  const [activeInsight, setActiveInsight] = React.useState<any>(null);
  const [insightPosition, setInsightPosition] = React.useState({ x: 0, y: 0 });

  const {
    loading,
    data,
    featureImportance,
    varianceDecomposition,
    performanceExplorer,
    kpis,
    businessComparison,
    deviationPatterns,
    factorCorrelations
  } = usePerformanceData(filters);

  // Prepare KPI data for tiles
  const kpiTiles = React.useMemo(() => {
    console.log('KPIs data:', kpis);
    if (!kpis || Object.keys(kpis).length === 0) {
      console.log('No KPI data available');
      return [];
    }

    // Show ALL metrics together - both existing and new ones
    return [
      // Original existing metrics
      {
        id: "total-revenue",
        title: "Total Revenue",
        value: kpis.total_revenue?.value ? `$${(kpis.total_revenue.value / 1000).toFixed(1)}K` : "$0",
        change: kpis.total_revenue?.change_percentage || 0,
        trend: kpis.total_revenue?.trend > 0 ? "up" : "down" as const
      },
      {
        id: "active-customers",
        title: "Active Customers",
        value: kpis.active_customers?.value?.toFixed(0) || "0",
        change: kpis.active_customers?.change_percentage || 0,
        trend: kpis.active_customers?.trend > 0 ? "up" : "down" as const
      },
      {
        id: "avg-order-value",
        title: "Avg Order Value",
        value: kpis.avg_order_value?.value ? `$${kpis.avg_order_value.value.toFixed(0)}` : "$0",
        change: kpis.avg_order_value?.change_percentage || 0,
        trend: kpis.avg_order_value?.trend > 0 ? "up" : "down" as const
      },
      {
        id: "ar-amount",
        title: "AR Amount",
        value: kpis.ar_amount?.value ? `$${(kpis.ar_amount.value / 1000).toFixed(1)}K` : "$0",
        change: kpis.ar_amount?.change_percentage || 0,
        trend: kpis.ar_amount?.trend > 0 ? "up" : "down" as const
      },
      // New metrics from old implementation
      {
        id: "avg-deviation",
        title: "Avg Deviation",
        value: kpis.averageDeviation?.value ? `${(kpis.averageDeviation.value * 100).toFixed(1)}%` : "0%",
        change: kpis.averageDeviation?.change_percentage || 0,
        trend: kpis.averageDeviation?.trend > 0 ? "up" : "down" as const
      },
      {
        id: "anomaly-count",
        title: "Anomalies",
        value: kpis.anomalyCount?.value ? String(kpis.anomalyCount.value) : "0",
        change: kpis.anomalyCount?.change_percentage || 0,
        trend: kpis.anomalyCount?.trend > 0 ? "up" : "down" as const
      },
      {
        id: "top-factor",
        title: "Top Factor",
        value: kpis.topFactor?.value ? String(kpis.topFactor.value).replace(/_/g, " ") : "Loading...",
        change: 0,
        trend: "up" as const
      },
      {
        id: "explanation-power",
        title: "Explained",
        value: kpis.explanationPower?.value ? `${(kpis.explanationPower.value * 100).toFixed(0)}%` : "0%",
        change: 0,
        trend: "up" as const
      }
    ];
  }, [kpis]);

  // Update performance data for BI panel
  useEffect(() => {
    if (data) {
      const performanceRecords = data.metadata?.totalDataPoints ?
        Array(data.metadata.totalDataPoints).fill({}).map((_, i) => ({
          id: i,
          deviation: Math.random() * 4 - 2, // Random deviation for demo
          kpi: selectedKPI,
          date: new Date().toISOString()
        })) : [];
      setPerformanceData(performanceRecords);
    }
  }, [data, selectedKPI, setPerformanceData]);

  return (
    <>

      {/* KPI Tiles - SHOWN AFTER FILTERS */}
      <DashboardSection title="Key Metrics">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : kpiTiles.length > 0 ? (
          <KPIRow kpis={kpiTiles} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No KPI data available. Please check your filters or backend connection.
          </div>
        )}
      </DashboardSection>

      {/* Performance Explorer */}
      <DashboardSection>
        <PerformanceExplorer
          data={performanceExplorer}
          selectedKPI={selectedKPI}
          onKPISelect={setSelectedKPI}
          loading={loading}
        />
      </DashboardSection>

      {/* Analysis Section */}
      <DashboardSection title="Performance Analysis">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <FeatureImportanceChart
            data={featureImportance}
            selectedKPI={selectedKPI}
            loading={loading}
          />
          <VarianceDecomposition
            data={varianceDecomposition}
            loading={loading}
          />
        </div>
      </DashboardSection>

      {/* Deviation Patterns */}
      <DashboardSection title="Deviation Patterns">
        <DeviationPatterns
          data={deviationPatterns}
          loading={loading}
        />
      </DashboardSection>

      {/* Business Function Comparison */}
      <DashboardSection>
        <BusinessComparison
          data={businessComparison}
          loading={loading}
        />
      </DashboardSection>

      {/* External Factor Correlation */}
      <DashboardSection>
        <ExternalFactorCorrelation
          data={factorCorrelations}
          loading={loading}
        />
      </DashboardSection>

      {/* Deviation Pattern Explorer */}
      <DashboardSection>
        <DeviationPatternExplorer
          data={deviationPatterns}
          loading={loading}
        />
      </DashboardSection>

      {/* AI Insights Section */}
      <DashboardSection title="AI Insights">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Feature Importance in ChartCard */}
          <ChartCard
            title="AI Feature Importance"
            className="glass-card card-hover"
          >
            {loading ? (
              <Skeleton className="h-96" />
            ) : featureImportance?.aggregated?.length > 0 ? (
              <div className="space-y-3">
                {featureImportance.aggregated.slice(0, 8).map((feature: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{feature.feature.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full"
                          style={{ width: `${(feature.avg_importance || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {((feature.avg_importance || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No feature importance data available</div>
            )}
          </ChartCard>

          {/* AI-Generated Insights in ChartCard */}
          <ChartCard
            title="AI-Generated Analysis"
            className="glass-card card-hover"
          >
            {loading ? (
              <Skeleton className="h-96" />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Critical Performance Deviation Detected
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Analysis shows significant deviations in {selectedKPI.replace(/_/g, ' ')}.
                    Top influencing factor: {featureImportance?.aggregated?.[0]?.feature?.replace(/_/g, ' ') || 'Unknown'}.
                  </p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Key Insights:</h5>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-accent mt-1">•</span>
                      <span>
                        Primary driver: {featureImportance?.aggregated?.[0]?.feature?.replace(/_/g, ' ') || 'Unknown'} with
                        {' '}{ ((featureImportance?.aggregated?.[0]?.avg_importance || 0) * 100).toFixed(1)}% impact
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-accent mt-1">•</span>
                      <span>
                        Variance decomposition shows {((varianceDecomposition?.components?.[0]?.share || 0) * 100).toFixed(1)}%
                        {' '}explained by {varianceDecomposition?.components?.[0]?.name || 'model'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <span className="text-accent mt-1">•</span>
                      <span>
                        {deviationPatterns?.patterns?.filter((p: any) => p.is_significant).length || 0} significant
                        {' '}deviation patterns detected
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Recommended Actions:</h5>
                  <ul className="space-y-1">
                    <li className="text-sm text-muted-foreground">→ Review top influencing factors for optimization</li>
                    <li className="text-sm text-muted-foreground">→ Investigate significant deviation patterns</li>
                    <li className="text-sm text-muted-foreground">→ Implement targeted interventions</li>
                    <li className="text-sm text-muted-foreground">→ Monitor KPIs during intervention period</li>
                  </ul>
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Insight Card */}
      {activeInsight && (
        <InsightCard
          data={activeInsight}
          position={insightPosition}
          isVisible={!!activeInsight}
          onClose={() => setActiveInsight(null)}
          onDrillDown={() => {
            console.log("Drill down:", activeInsight);
            setActiveInsight(null);
          }}
          onExport={() => {
            console.log("Export:", activeInsight);
          }}
        />
      )}
    </>
  );
}