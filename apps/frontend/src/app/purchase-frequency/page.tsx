"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  FrequencyKPIs,
  FrequencyDistribution,
  IntervalAnalysis,
  CustomerSegments,
  ValuePatterns,
  FrequencyTrends
} from './components';
import { usePurchaseFrequencyContext } from './context';
import { usePurchaseFrequencyData } from './hooks/usePurchaseFrequencyData';

export default function PurchaseFrequencyPage() {
  const { filters, setFrequencyCustomers } = usePurchaseFrequencyContext();

  const {
    loading,
    error,
    frequencyDistribution,
    intervalAnalysis,
    customerSegments,
    valuePatterns,
    hasNoData,
    kpiMetrics
  } = usePurchaseFrequencyData(filters);

  // Update context with customer data for BI panel
  React.useEffect(() => {
    setFrequencyCustomers(customerSegments);
  }, [customerSegments, setFrequencyCustomers]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Purchase Frequency Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no purchase frequency data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Section */}
      <DashboardSection title="Purchase Frequency Overview">
        <FrequencyKPIs
          metrics={kpiMetrics}
          loading={loading}
        />
      </DashboardSection>

      {/* Main Analytics Grid */}
      <DashboardGrid>
        {/* Frequency Distribution */}
        <DashboardSection
          title="Purchase Frequency Distribution"
          description="Distribution of customers by purchase frequency"
        >
          <FrequencyDistribution
            data={frequencyDistribution}
            loading={loading}
          />
        </DashboardSection>

        {/* Interval Analysis */}
        <DashboardSection
          title="Purchase Intervals"
          description="Analysis of time between purchases"
        >
          <IntervalAnalysis
            data={intervalAnalysis}
            loading={loading}
          />
        </DashboardSection>

        {/* Customer Segments */}
        <DashboardSection
          title="Frequency-Based Segments"
          description="Customer segments based on purchase patterns"
        >
          <CustomerSegments
            segments={customerSegments}
            loading={loading}
          />
        </DashboardSection>

        {/* Value Patterns */}
        <DashboardSection
          title="Value Patterns"
          description="Revenue patterns by purchase frequency"
        >
          <ValuePatterns
            data={valuePatterns}
            loading={loading}
          />
        </DashboardSection>

        {/* Frequency Trends */}
        <DashboardSection
          title="Frequency Trends"
          description="Purchase frequency trends over time"
          className="col-span-2"
        >
          <FrequencyTrends
            data={frequencyDistribution}
            loading={loading}
          />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}