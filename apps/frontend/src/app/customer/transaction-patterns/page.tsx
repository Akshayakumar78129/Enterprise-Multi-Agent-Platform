"use client";

import React from 'react';
import {
  DashboardSection,
  PageLoader,
  ChartCard,
  getShiftClickManager
} from 'components/index';
import {
  PatternKPIs,
  TemporalHeatmap,
  DualAxisTimeSeries,
  AmountDistribution,
  ProductMatrix
} from './components';
import { useTransactionPatternsContext } from './context';
import { useTransactionPatternsData } from './hooks/useTransactionPatternsData';

export default function TransactionPatternsPage() {
  const { filters, setPatternData } = useTransactionPatternsContext();
  const shiftClickManager = getShiftClickManager();

  const {
    loading,
    error,
    temporalPatterns,
    productCombinations,
    anomalyDetection,
    hasNoData,
    kpiMetrics
  } = useTransactionPatternsData(filters);

  React.useEffect(() => {
    if (temporalPatterns || productCombinations) {
      setPatternData({ temporalPatterns, productCombinations });
    }
  }, [JSON.stringify(temporalPatterns), JSON.stringify(productCombinations)]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Transaction Pattern Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no transaction pattern data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Transaction Patterns",
      }}
    >
      <div className="space-y-6">
        {/* KPI Section */}
        <DashboardSection title="Key Metrics">
          <PatternKPIs metrics={kpiMetrics} loading={false} />
        </DashboardSection>

        {/* Main Visualizations */}
        <DashboardSection>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Temporal Heatmap */}
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Temporal Transaction Patterns</h3>
              <ChartCard
                className="flex-1 min-h-[480px]"
                onShiftClick={(event) => {
                  shiftClickManager.addPoint({
                    label: "Temporal Transaction Patterns",
                    value: `Transaction patterns by day and hour`,
                    source: 'Transaction Patterns Dashboard - Heatmap'
                  }, event.nativeEvent);
                }}
              >
                <TemporalHeatmap
                  data={temporalPatterns?.heatmapData || []}
                  loading={false}
                  onCellClick={(day, hour, event) => {
                    console.log('Heatmap cell clicked:', { day, hour });
                  }}
                />
              </ChartCard>
            </div>

            {/* Dual Axis Time Series */}
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Transaction Volume & Value Trends</h3>
              <ChartCard
                className="flex-1 min-h-[480px]"
                onShiftClick={(event) => {
                  shiftClickManager.addPoint({
                    label: "Transaction Volume & Value Trends",
                    value: `Transaction volume and value over time`,
                    source: 'Transaction Patterns Dashboard - Time Series'
                  }, event.nativeEvent);
                }}
              >
                <DualAxisTimeSeries
                  data={temporalPatterns?.timeSeries || []}
                  loading={false}
                  onDataPointClick={(dataPoint, event) => {
                    console.log('Time series point clicked:', dataPoint);
                  }}
                />
              </ChartCard>
            </div>
          </div>
        </DashboardSection>

        {/* Product and Amount Analysis */}
        <DashboardSection>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Product Performance Matrix */}
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Product Performance Matrix</h3>
              <ChartCard
                className="flex-1 min-h-[680px]"
                onShiftClick={(event) => {
                  shiftClickManager.addPoint({
                    label: "Product Performance Matrix",
                    value: `Product sales performance analysis`,
                    source: 'Transaction Patterns Dashboard - Product Matrix'
                  }, event.nativeEvent);
                }}
              >
                <ProductMatrix
                  data={productCombinations?.products || []}
                  loading={false}
                  onProductClick={(product, event) => {
                    console.log('Product clicked:', product);
                  }}
                />
              </ChartCard>
            </div>

            {/* Amount Distribution */}
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Transaction Amount Distribution</h3>
              <ChartCard
                className="flex-1 min-h-[680px] flex items-center justify-center"
                onShiftClick={(event) => {
                  shiftClickManager.addPoint({
                    label: "Transaction Amount Distribution",
                    value: `Distribution of transaction amounts`,
                    source: 'Transaction Patterns Dashboard - Amount Distribution'
                  }, event.nativeEvent);
                }}
              >
                <AmountDistribution
                  data={anomalyDetection?.amountDistribution || []}
                  loading={false}
                  onBinClick={(bin, event) => {
                    console.log('Distribution bin clicked:', bin);
                  }}
                />
              </ChartCard>
            </div>
          </div>
        </DashboardSection>
      </div>
    </PageLoader>
  );
}