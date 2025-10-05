"use client";

import React from 'react';
import {
  DashboardSection,
  PageLoader,
  ChartCard
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
        <DashboardSection title="Transaction Analysis">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Temporal Heatmap */}
            <ChartCard
              title="Temporal Transaction Patterns"
            >
              <TemporalHeatmap
                data={temporalPatterns?.heatmapData || []}
                loading={false}
                onCellClick={(day, hour, event) => {
                  console.log('Heatmap cell clicked:', { day, hour });
                }}
              />
            </ChartCard>

            {/* Dual Axis Time Series */}
            <ChartCard
              title="Transaction Volume & Value Trends"
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
        </DashboardSection>

        {/* Product and Amount Analysis */}
        <DashboardSection title="Product & Amount Analysis">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Product Performance Matrix */}
            <ChartCard
              title="Product Performance Matrix"
            >
              <ProductMatrix
                data={productCombinations?.products || []}
                loading={false}
                onProductClick={(product, event) => {
                  console.log('Product clicked:', product);
                }}
              />
            </ChartCard>

            {/* Amount Distribution */}
            <ChartCard
              title="Transaction Amount Distribution"
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
        </DashboardSection>
      </div>
    </PageLoader>
  );
}