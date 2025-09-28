"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  ProfitabilityKPIs,
  ProfitTrends,
  MarginAnalysis,
  ProductProfitability,
  CustomerProfitability,
  CostBreakdown,
  ProfitabilityTable
} from './components';
import { useProfitabilityContext } from './context';
import { useProfitabilityData } from './hooks/useProfitabilityData';

export default function ProfitabilityPage() {
  const { filters, setProfitabilityData } = useProfitabilityContext();

  const {
    loading,
    error,
    profitTrends,
    marginAnalysis,
    productProfitability,
    customerProfitability,
    costBreakdown,
    profitabilityItems,
    hasNoData,
    kpiMetrics
  } = useProfitabilityData(filters);

  // Update context with profitability data for BI panel
  React.useEffect(() => {
    setProfitabilityData(profitabilityItems);
  }, [profitabilityItems, setProfitabilityData]);

  // Handle profitability item selection
  const handleItemSelect = (item: any) => {
    console.log('Selected profitability item:', item);
    // Could open a detail modal or navigate to item details
  };

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">Unable to load profitability data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* KPI Section */}
      <DashboardSection title="Profitability Metrics">
        <ProfitabilityKPIs kpiMetrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      {/* Primary Analysis Section */}
      <DashboardSection title="Profitability Analysis">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Left Column - Trends and Margins */}
          <div className="space-y-4 lg:space-y-6">
            <ProfitTrends
              data={profitTrends}
              loading={loading}
            />
            <MarginAnalysis
              data={marginAnalysis}
              loading={loading}
            />
          </div>

          {/* Right Column - Product and Customer */}
          <div className="space-y-4 lg:space-y-6">
            <ProductProfitability
              data={productProfitability}
              loading={loading}
            />
            <CustomerProfitability
              data={customerProfitability}
              loading={loading}
            />
          </div>
        </div>
      </DashboardSection>

      {/* Cost Breakdown Section */}
      <DashboardSection title="Cost Analysis">
        <CostBreakdown
          data={costBreakdown}
          loading={loading}
        />
      </DashboardSection>

      {/* Profitability Details Table */}
      <DashboardSection title="Profitability Details">
        <ProfitabilityTable
          data={profitabilityItems}
          loading={loading}
          onItemSelect={handleItemSelect}
        />
      </DashboardSection>
    </>
  );
}