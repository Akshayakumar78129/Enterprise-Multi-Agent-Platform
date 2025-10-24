"use client";

import React from 'react';
import { DashboardSection } from 'components/index';
import { useARAgingContext } from './context';
import { useARAgingData } from './hooks/useARAgingData';
import {
  ARAgingKPIs,
  NPVPortfolioChart,
  CustomerMatrix,
  CollectionForecast,
  RiskHeatmap,
  AgingTable
} from './components';

export default function ARAgingAnalysisPage() {
  const context = useARAgingContext();

  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading AR Aging Analysis...</div>
      </div>
    );
  }

  const { filters } = context;

  const {
    loading,
    error,
    kpiMetrics,
    agingBuckets,
    customerInsights,
    collectionForecast,
    npvSummary,
    agingTable,
    insights
  } = useARAgingData({
    dateRange: filters.dateRange,
    customerSegments: filters.customerSegments,
    riskLevels: filters.riskLevels,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    wacc: filters.wacc,
    regions: filters.regions
  });

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-6 border-error/50">
            <h2 className="text-error text-lg font-semibold mb-2">Error Loading Data</h2>
            <p className="text-error/80">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-error hover:bg-error/80 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Section */}
      <DashboardSection title="Key Metrics">
        <ARAgingKPIs metrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      {/* NPV Portfolio Chart */}
      <DashboardSection title="NPV-Adjusted AR Portfolio">
        <NPVPortfolioChart
          data={agingBuckets}
          npvSummary={npvSummary}
          loading={loading}
        />
      </DashboardSection>

      {/* Grid Layout: Customer Matrix + Collection Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSection title="Customer Portfolio Matrix">
          <CustomerMatrix
            data={customerInsights}
            loading={loading}
          />
        </DashboardSection>
        <DashboardSection title="Collection Forecast">
          <CollectionForecast
            data={collectionForecast}
            loading={loading}
          />
        </DashboardSection>
      </div>

      {/* Risk Heatmap */}
      <DashboardSection title="Collection Probability Engine">
        <RiskHeatmap
          customers={customerInsights}
          agingBuckets={agingBuckets}
          loading={loading}
        />
      </DashboardSection>

      {/* Aging Table */}
      <DashboardSection title="Detailed AR Breakdown">
        <AgingTable
          data={agingTable}
          loading={loading}
        />
      </DashboardSection>
    </div>
  );
}
