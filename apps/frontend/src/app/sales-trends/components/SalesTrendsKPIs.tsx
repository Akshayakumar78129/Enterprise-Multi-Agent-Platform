"use client";

import React, { useMemo } from 'react';
import { KPIRow, getShiftClickManager } from 'components/index';
import { SalesTrendKPIs } from '../services/salesTrendsService';

interface SalesTrendsKPIsProps {
  metrics: SalesTrendKPIs;
  loading?: boolean;
}

export function SalesTrendsKPIs({ metrics, loading = false }: SalesTrendsKPIsProps) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => {
    return [
      {
        id: "total-revenue",
        title: "Total Revenue",
        value: Number((metrics.totalRevenue || 0).toFixed(2)),
        format: "currency" as const,
        color: "#8b5cf6",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Total Revenue",
            value: `$${(metrics.totalRevenue || 0).toLocaleString()}`,
            source: "Sales Trends - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "total-units",
        title: "Total Units Sold",
        value: Number((metrics.totalUnits || 0).toFixed(2)),
        format: "number" as const,
        color: "#10b981",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Total Units Sold",
            value: `${(metrics.totalUnits || 0).toLocaleString()} units`,
            source: "Sales Trends - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "avg-order-value",
        title: "Average Order Value",
        value: Number((metrics.avgOrderValue || 0).toFixed(2)),
        format: "currency" as const,
        color: "#f59e0b",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Average Order Value",
            value: `$${(metrics.avgOrderValue || 0).toFixed(2)}`,
            source: "Sales Trends - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "margin-percentage",
        title: "Profit Margin",
        value: Number((metrics.marginPercentage || 0).toFixed(2)),
        format: "percentage" as const,
        color: "#06b6d4",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Profit Margin",
            value: `${(metrics.marginPercentage || 0).toFixed(1)}%`,
            source: "Sales Trends - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "revenue-growth",
        title: "Revenue Growth",
        value: Number((metrics.revenueGrowth || 0).toFixed(2)),
        format: "percentage" as const,
        color: metrics.revenueGrowth >= 0 ? "#10b981" : "#ef4444",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Revenue Growth",
            value: `${(metrics.revenueGrowth || 0).toFixed(1)}%`,
            source: "Sales Trends - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "transaction-count",
        title: "Total Transactions",
        value: Number((metrics.transactionCount || 0).toFixed(0)),
        format: "number" as const,
        color: "#ec4899",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Total Transactions",
            value: `${(metrics.transactionCount || 0).toLocaleString()} transactions`,
            source: "Sales Trends - KPIs"
          }, event.nativeEvent);
        }
      }
    ];
  }, [metrics, shiftClickManager]);

  return <KPIRow kpis={kpis} columns={6} animationDelay={50} />;
}
