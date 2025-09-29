"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection,
  PageLoader
} from 'components/index';
import {
  PatternKPIs,
  TemporalPatterns,
  ProductCombinations,
  AnomalyDetection,
  PaymentMethods,
  PatternTrends
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
    paymentMethods,
    hasNoData,
    kpiMetrics
  } = useTransactionPatternsData(filters);

  React.useEffect(() => {
    setPatternData({ temporalPatterns, productCombinations });
  }, [temporalPatterns, productCombinations, setPatternData]);

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
        <DashboardSection title="Transaction Pattern Overview">
          <PatternKPIs metrics={kpiMetrics} loading={false} />
        </DashboardSection>

        <DashboardGrid>
          <DashboardSection title="Temporal Patterns" description="Transaction timing patterns">
            <TemporalPatterns data={temporalPatterns} loading={false} />
          </DashboardSection>

          <DashboardSection title="Product Combinations" description="Frequently bought together">
            <ProductCombinations data={productCombinations} loading={false} />
          </DashboardSection>

          <DashboardSection title="Anomaly Detection" description="Unusual transaction patterns">
            <AnomalyDetection data={anomalyDetection} loading={false} />
          </DashboardSection>

          <DashboardSection title="Payment Methods" description="Payment method distribution">
            <PaymentMethods data={paymentMethods} loading={false} />
          </DashboardSection>

          <DashboardSection title="Pattern Trends" description="Transaction pattern trends over time" className="col-span-2">
            <PatternTrends data={temporalPatterns} loading={false} />
          </DashboardSection>
        </DashboardGrid>
      </div>
    </PageLoader>
  );
}