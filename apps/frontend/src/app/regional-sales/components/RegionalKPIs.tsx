"use client";

import React, { useMemo } from 'react';
import { KPIRow, MetricsRow, Skeleton } from 'components/index';

interface RegionalKPIsProps {
  metrics: {
    totalSales: number;
    netSales: number;
    grossProfit: number;
    profitMargin: number;
    countryCount: number;
    stateCount: number;
    customerCount: number;
    transactionCount: number;
    avgTransactionValue: number;
    growthRate: number | null;
  };
  topRegion?: {
    country: string;
    state: string;
    totalSales: number;
    profitMargin: number;
  } | null;
  opportunityCount?: number;
  loading?: boolean;
}

export function RegionalKPIs({ metrics, topRegion, opportunityCount = 0, loading }: RegionalKPIsProps) {
  const kpis = useMemo(() => {
    if (!metrics) {
      return [
        {
          id: "total-regional-sales",
          title: "Total Regional Sales",
          value: 0,
          format: "currency" as const,
          color: "#38bdf8",
        },
        {
          id: "top-region",
          title: "Top Performing Region",
          value: "N/A",
          subtitle: "$0",
          format: "text" as const,
          color: "#38bdf8",
        },
        {
          id: "regional-coverage",
          title: "Regional Coverage",
          value: 0,
          subtitle: "0 states/provinces",
          format: "number" as const,
          color: "#38bdf8",
        },
        {
          id: "market-concentration",
          title: "Market Concentration",
          value: 0,
          format: "percentage" as const,
          color: "#38bdf8",
        },
        {
          id: "growth-opportunities",
          title: "Growth Opportunities",
          value: 0,
          subtitle: "High potential regions",
          format: "number" as const,
          color: "#38bdf8",
        },
      ];
    }

    const topRegionDisplay = topRegion
      ? `${topRegion.state}, ${topRegion.country}`
      : "N/A";

    const topRegionSales = topRegion?.totalSales || 0;

    // Calculate market concentration (top 20% of regions)
    // This is a simplified calculation - in production you'd get this from the backend
    const concentrationRatio = metrics.stateCount > 0
      ? ((topRegionSales / metrics.totalSales) * 100)
      : 0;

    return [
      {
        id: "total-regional-sales",
        title: "Total Regional Sales",
        value: Number((metrics.totalSales || 0).toFixed(2)),
        subtitle: `${metrics.transactionCount?.toLocaleString() || 0} transactions`,
        format: "currency" as const,
        color: "#38bdf8",
        trend: metrics.growthRate !== null ? {
          value: Number(metrics.growthRate.toFixed(2)),
          format: "percentage" as const
        } : undefined
      },
      {
        id: "top-region",
        title: "Top Performing Region",
        value: topRegionDisplay,
        subtitle: `$${(topRegionSales / 1000).toFixed(1)}K sales`,
        format: "text" as const,
        color: "#f59e0b",
      },
      {
        id: "regional-coverage",
        title: "Regional Coverage",
        value: Number((metrics.countryCount || 0).toFixed(0)),
        subtitle: `${metrics.stateCount || 0} states/provinces`,
        format: "number" as const,
        color: "#10b981",
      },
      {
        id: "market-concentration",
        title: "Market Concentration",
        value: Number(concentrationRatio.toFixed(1)),
        subtitle: concentrationRatio > 50 ? "High concentration" : concentrationRatio > 20 ? "Medium concentration" : "Low concentration",
        format: "percentage" as const,
        color: "#8b5cf6",
      },
      {
        id: "growth-opportunities",
        title: "Growth Opportunities",
        value: opportunityCount,
        subtitle: "High potential regions",
        format: "number" as const,
        color: "#ec4899",
      },
    ];
  }, [metrics, topRegion, opportunityCount]);

  if (loading) {
    return (
      <MetricsRow>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={120} className="animate-pulse" />
        ))}
      </MetricsRow>
    );
  }

  return <KPIRow kpis={kpis} columns={5} animationDelay={50} />;
}
