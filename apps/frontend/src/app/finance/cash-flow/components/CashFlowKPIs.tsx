"use client";

import React, { useMemo } from 'react';
import { KPIRow, MetricsRow, Skeleton } from 'components/index';

interface CashFlowKPIsProps {
  metrics: {
    netCashFlow: number;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    cashRatio: number;
    freeCashFlow: number;
    fcfYield?: { value: number; target: number; status: string } | null;
    cashROIC?: { value: number; wacc: number; spread: number } | null;
    cashConversionQuality?: { score: number; quality: string } | null;
    liquidityCoverage?: { ratio: number; threshold: number; status: string } | null;
    maFirepower?: { amount: number; capacity: string } | null;
  };
  loading?: boolean;
}

export function CashFlowKPIs({ metrics, loading }: CashFlowKPIsProps) {
  const kpis = useMemo(() => {
    if (!metrics) {
      return [
        {
          id: "net-cash-flow",
          title: "Net Cash Flow",
          value: 0,
          format: "currency" as const,
          color: "#38bdf8",
        },
        {
          id: "operating-cf",
          title: "Operating Cash Flow",
          value: 0,
          format: "currency" as const,
          color: "#10b981",
        },
        {
          id: "investing-cf",
          title: "Investing Cash Flow",
          value: 0,
          format: "currency" as const,
          color: "#f59e0b",
        },
        {
          id: "financing-cf",
          title: "Financing Cash Flow",
          value: 0,
          format: "currency" as const,
          color: "#8b5cf6",
        },
        {
          id: "cash-ratio",
          title: "Cash Ratio",
          value: 0,
          format: "number" as const,
          color: "#38bdf8",
        },
        {
          id: "free-cash-flow",
          title: "Free Cash Flow",
          value: 0,
          format: "currency" as const,
          color: "#ec4899",
        },
        {
          id: "fcf-yield",
          title: "FCF Yield",
          value: 0,
          format: "percentage" as const,
          color: "#00e0ff",
        },
        {
          id: "cash-roic",
          title: "Cash ROIC",
          value: 0,
          format: "percentage" as const,
          color: "#00ff88",
        },
        {
          id: "cash-conversion-quality",
          title: "Cash Conversion Quality",
          value: 0,
          format: "number" as const,
          color: "#ffc145",
        },
        {
          id: "liquidity-coverage",
          title: "Liquidity Coverage Ratio",
          value: 0,
          format: "number" as const,
          color: "#ff5252",
        },
        {
          id: "ma-firepower",
          title: "M&A Firepower",
          value: 0,
          format: "currency" as const,
          color: "#9b59b6",
        },
      ];
    }

    return [
      {
        id: "net-cash-flow",
        title: "Net Cash Flow",
        value: Number((metrics.netCashFlow || 0).toFixed(2)),
        format: "currency" as const,
        color: "#38bdf8",
      },
      {
        id: "operating-cf",
        title: "Operating Cash Flow",
        value: Number((metrics.operatingCashFlow || 0).toFixed(2)),
        format: "currency" as const,
        color: "#10b981",
      },
      {
        id: "investing-cf",
        title: "Investing Cash Flow",
        value: Number((metrics.investingCashFlow || 0).toFixed(2)),
        format: "currency" as const,
        color: "#f59e0b",
      },
      {
        id: "financing-cf",
        title: "Financing Cash Flow",
        value: Number((metrics.financingCashFlow || 0).toFixed(2)),
        format: "currency" as const,
        color: "#8b5cf6",
      },
      {
        id: "cash-ratio",
        title: "Cash Ratio",
        value: Number((metrics.cashRatio || 0).toFixed(2)),
        format: "number" as const,
        color: "#38bdf8",
      },
      {
        id: "free-cash-flow",
        title: "Free Cash Flow",
        value: Number((metrics.freeCashFlow || 0).toFixed(2)),
        format: "currency" as const,
        color: "#ec4899",
      },
      {
        id: "fcf-yield",
        title: "FCF Yield",
        value: Number((metrics.fcfYield?.value || 0).toFixed(2)),
        format: "percentage" as const,
        color: "#00e0ff",
        subtitle: metrics.fcfYield?.status ? `Status: ${metrics.fcfYield.status}` : undefined,
      },
      {
        id: "cash-roic",
        title: "Cash ROIC",
        value: Number((metrics.cashROIC?.value || 0).toFixed(2)),
        format: "percentage" as const,
        color: "#00ff88",
        subtitle: metrics.cashROIC?.spread ? `Spread: ${metrics.cashROIC.spread.toFixed(2)}%` : undefined,
      },
      {
        id: "cash-conversion-quality",
        title: "Cash Conversion Quality",
        value: Number((metrics.cashConversionQuality?.score || 0).toFixed(1)),
        format: "number" as const,
        color: "#ffc145",
        subtitle: metrics.cashConversionQuality?.quality ? `Quality: ${metrics.cashConversionQuality.quality}` : undefined,
      },
      {
        id: "liquidity-coverage",
        title: "Liquidity Coverage Ratio",
        value: Number((metrics.liquidityCoverage?.ratio || 0).toFixed(2)),
        format: "number" as const,
        color: "#ff5252",
        subtitle: metrics.liquidityCoverage?.status ? `Status: ${metrics.liquidityCoverage.status}` : undefined,
      },
      {
        id: "ma-firepower",
        title: "M&A Firepower",
        value: Number((metrics.maFirepower?.amount || 0).toFixed(2)),
        format: "currency" as const,
        color: "#9b59b6",
        subtitle: metrics.maFirepower?.capacity ? `Capacity: ${metrics.maFirepower.capacity}` : undefined,
      },
    ];
  }, [metrics]);

  if (loading) {
    return (
      <MetricsRow>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <Skeleton key={i} height={120} className="animate-pulse" />
        ))}
      </MetricsRow>
    );
  }

  return <KPIRow kpis={kpis} columns={11} animationDelay={50} />;
}
