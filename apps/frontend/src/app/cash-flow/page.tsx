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
  FCFValueBridge,
  LiquidityTimeline,
  CapitalAllocationMatrix,
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
    fcfBridge,
    liquidityTimeline,
    capitalAllocation,
    hasNoData,
    kpiMetrics
  } = useCashFlowData(filters);

  // Update context with cash flow data for BI panel
  React.useEffect(() => {
    if (cashFlowItems && cashFlowItems.length > 0) {
      setCashFlowData(cashFlowItems);
    }
  }, [cashFlowItems]);

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
    <div className="space-y-6">
      {/* KPI Section */}
      <DashboardSection title="Key Metrics">
        <CashFlowKPIs metrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      {/* Cash Flow Trends - Full Width */}
      <DashboardSection title="Cash Flow Trends">
        <CashFlowTrends
          data={cashFlowTrends}
          loading={loading}
        />
      </DashboardSection>

      {/* Cash Flow Breakdown Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <DashboardSection title="Operating Cash Flow">
          <OperatingCashFlow
            data={operatingCashFlow}
            loading={loading}
          />
        </DashboardSection>

        <DashboardSection title="Investment Cash Flow">
          <InvestmentCashFlow
            data={investmentCashFlow}
            loading={loading}
          />
        </DashboardSection>

        <DashboardSection title="Financing Cash Flow">
          <FinancingCashFlow
            data={financingCashFlow}
            loading={loading}
          />
        </DashboardSection>
      </div>

      {/* Cash Flow Projection Section */}
      <DashboardSection title="Cash Flow Projection">
        <CashFlowProjection
          data={cashFlowProjection}
          loading={loading}
        />
      </DashboardSection>

      {/* FCF Value Bridge & Liquidity Timeline Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <DashboardSection title="FCF Value Bridge">
          <FCFValueBridge
            data={fcfBridge}
            loading={loading}
          />
        </DashboardSection>

        <DashboardSection title="Liquidity Timeline">
          <LiquidityTimeline
            data={liquidityTimeline}
            loading={loading}
          />
        </DashboardSection>
      </div>

      {/* Capital Allocation Matrix - Full Width */}
      <DashboardSection title="Capital Allocation Matrix">
        <CapitalAllocationMatrix
          data={capitalAllocation}
          loading={loading}
        />
      </DashboardSection>

      {/* Transaction Details Table - Full Width */}
      <DashboardSection title="Transaction Details">
        <CashFlowTable
          data={cashFlowItems}
          loading={loading}
        />
      </DashboardSection>
    </div>
  );
}