"use client";

import React, { useEffect } from "react";
import {
  DashboardSection,
  KPIRow,
  Skeleton,
  ChartCard,
  PageLoader,
  getShiftClickManager
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
    setInsights,
    selectionManager
  } = usePerformanceDeviationContext();
  const shiftClickManager = getShiftClickManager();

  const prevPerformanceDataRef = React.useRef<any[]>([]);
  const prevInsightsRef = React.useRef<any[]>([]);

  const {
    loading,
    error,
    data,
    featureImportance,
    varianceDecomposition,
    performanceExplorer,
    kpis,
    businessComparison,
    deviationPatterns,
    factorCorrelations,
    insights,
    insightsMetadata,
    hasNoData
  } = usePerformanceData(filters);

  // Prepare KPI data for tiles
  const kpiTiles = React.useMemo(() => {
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
      }
      // Commented out as per user request:
      // {
      //   id: "top-factor",
      //   title: "Top Factor",
      //   value: kpis.topFactor?.value ? String(kpis.topFactor.value).replace(/_/g, " ") : "Loading...",
      //   change: 0,
      //   trend: "up" as const
      // },
      // {
      //   id: "explanation-power",
      //   title: "Explained",
      //   value: kpis.explanationPower?.value ? `${(kpis.explanationPower.value * 100).toFixed(0)}%` : "0%",
      //   change: 0,
      //   trend: "up" as const
      // }
    ];
  }, [kpis]);

  // Update performance data for BI panel
  // CRITICAL FIX: Use ref to prevent infinite loop - only update if data actually changed
  useEffect(() => {
    const currentData = data || [];
    if (JSON.stringify(currentData) !== JSON.stringify(prevPerformanceDataRef.current)) {
      prevPerformanceDataRef.current = currentData;
      setPerformanceData(currentData);
    }
  }, [data, setPerformanceData]);

  // Update insights for BI panel
  useEffect(() => {
    const currentInsights = insights || [];
    if (JSON.stringify(currentInsights) !== JSON.stringify(prevInsightsRef.current)) {
      prevInsightsRef.current = currentInsights;
      setInsights(currentInsights);
    }
  }, [insights, setInsights]);

  // Error state handling
  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">Unable to load data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Performance Deviation",
      }}
    >
      <>

      {/* KPI Tiles - SHOWN AFTER FILTERS */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
        {kpiTiles.length > 0 ? (
          <KPIRow
            kpis={kpiTiles}
            columns={kpiTiles.length}
            animationDelay={50}
            onKPIShiftClick={(kpi, event) => {
              shiftClickManager.addPoint({
                label: kpi.title,
                value: typeof kpi.value === 'number' ? kpi.value.toString() : kpi.value.toString(),
                source: 'Performance KPIs'
              }, event.nativeEvent);
            }}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No KPI data available. Please check your filters or backend connection.
          </div>
        )}
      </DashboardSection>

      {/* Performance Explorer */}
      <DashboardSection>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Performance Explorer",
              value: `${selectedKPI} performance analysis`,
              source: 'Performance Deviation - Explorer'
            }, event.nativeEvent);
          }}
        >
          <PerformanceExplorer
            data={performanceExplorer}
            selectedKPI={selectedKPI}
            onKPISelect={setSelectedKPI}
            loading={false}
          />
        </ChartCard>
      </DashboardSection>

      {/* Analysis Section */}
      <DashboardSection>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <FeatureImportanceChart
            data={featureImportance}
            selectedKPI={selectedKPI}
            loading={false}
          />
          <VarianceDecomposition
            data={varianceDecomposition}
            loading={false}
          />
        </div>
      </DashboardSection>

      {/* Deviation Patterns */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Deviation Patterns</h3>
        <DeviationPatterns
          data={deviationPatterns}
          loading={false}
        />
      </DashboardSection>

      {/* Business Function Comparison */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Business Function Comparison</h3>
        <BusinessComparison
          data={businessComparison}
          loading={false}
        />
      </DashboardSection>

      {/* External Factor Correlation */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">External Factor Correlation</h3>
        <ExternalFactorCorrelation
          data={factorCorrelations}
          loading={false}
        />
      </DashboardSection>

      {/* Deviation Pattern Explorer */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Deviation Pattern Explorer</h3>
        <DeviationPatternExplorer
          data={deviationPatterns}
          loading={false}
        />
      </DashboardSection>
      </>
    </PageLoader>
  );
}