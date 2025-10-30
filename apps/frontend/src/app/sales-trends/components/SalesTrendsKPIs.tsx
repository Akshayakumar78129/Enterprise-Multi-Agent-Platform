"use client";

import React, { useMemo } from 'react';
import { KPIRow } from 'components/index';
import { SalesTrendKPIs } from '../services/salesTrendsService';

interface SalesTrendsKPIsProps {
  metrics: SalesTrendKPIs;
  loading?: boolean;
}

export function SalesTrendsKPIs({ metrics, loading = false }: SalesTrendsKPIsProps) {
  const kpis = useMemo(() => {
    return [
      {
        id: "total-revenue",
        title: "Total Revenue",
        value: Number((metrics.totalRevenue || 0).toFixed(2)),
        format: "currency" as const,
        color: "#8b5cf6"
      },
      {
        id: "total-units",
        title: "Total Units Sold",
        value: Number((metrics.totalUnits || 0).toFixed(2)),
        format: "number" as const,
        color: "#10b981"
      },
      {
        id: "avg-order-value",
        title: "Average Order Value",
        value: Number((metrics.avgOrderValue || 0).toFixed(2)),
        format: "currency" as const,
        color: "#f59e0b"
      },
      {
        id: "margin-percentage",
        title: "Profit Margin",
        value: Number((metrics.marginPercentage || 0).toFixed(2)),
        format: "percentage" as const,
        color: "#06b6d4"
      },
      {
        id: "revenue-growth",
        title: "Revenue Growth",
        value: Number((metrics.revenueGrowth || 0).toFixed(2)),
        format: "percentage" as const,
        color: metrics.revenueGrowth >= 0 ? "#10b981" : "#ef4444"
      },
      {
        id: "transaction-count",
        title: "Total Transactions",
        value: Number((metrics.transactionCount || 0).toFixed(0)),
        format: "number" as const,
        color: "#ec4899"
      }
    ];
  }, [metrics]);

  return <KPIRow kpis={kpis} columns={6} animationDelay={50} />;
}
