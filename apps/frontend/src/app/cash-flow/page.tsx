"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  CashFlowKPIs,
  CashFlowTrends,
  OperatingCashFlow,
  InvestmentCashFlow,
  FinancingCashFlow,
  CashFlowProjection,
  CashFlowTable
} from './components';
import { useCashFlowContext } from './context';
import { useCashFlowData } from './hooks/useCashFlowData';

export default function CashFlowPage() {
  const { filters, setCashFlowData } = useCashFlowContext();

  const {
    loading,
    error,
    cashFlowTrends,
    operatingCashFlow,
    investmentCashFlow,
    financingCashFlow,
    cashFlowProjection,
    cashFlowItems,
    hasNoData,
    kpiMetrics
  } = useCashFlowData(filters);

  // Update context with cash flow data for BI panel
  React.useEffect(() => {
    setCashFlowData(cashFlowItems);
  }, [cashFlowItems, setCashFlowData]);

  // Handle cash flow item selection
  const handleItemSelect = (item: any) => {
    console.log('Selected cash flow item:', item);
    // Could open a detail modal or navigate to item details
  };

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">Unable to load cash flow data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* KPI Section */}
      <DashboardSection title="Cash Flow Metrics">
        <CashFlowKPIs kpiMetrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      {/* Primary Analysis Section */}
      <DashboardSection title="Cash Flow Analysis">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Left Column - Trends and Operating */}
          <div className="space-y-4 lg:space-y-6">
            <CashFlowTrends
              data={cashFlowTrends}
              loading={loading}
            />
            <OperatingCashFlow
              data={operatingCashFlow}
              loading={loading}
            />
          </div>

          {/* Right Column - Investment and Financing */}
          <div className="space-y-4 lg:space-y-6">
            <InvestmentCashFlow
              data={investmentCashFlow}
              loading={loading}
            />
            <FinancingCashFlow
              data={financingCashFlow}
              loading={loading}
            />
          </div>
        </div>
      </DashboardSection>

      {/* Cash Flow Projection Section */}
      <DashboardSection title="Cash Flow Projection">
        <CashFlowProjection
          data={cashFlowProjection}
          loading={loading}
        />
      </DashboardSection>

      {/* Cash Flow Details Table */}
      <DashboardSection title="Cash Flow Details">
        <CashFlowTable
          data={cashFlowItems}
          loading={loading}
          onItemSelect={handleItemSelect}
        />
      </DashboardSection>
    </>
  );
}