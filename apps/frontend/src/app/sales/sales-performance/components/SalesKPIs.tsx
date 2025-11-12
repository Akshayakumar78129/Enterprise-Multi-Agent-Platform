"use client";

import React, { useMemo } from 'react';
import { KPIRow, MetricsRow, Skeleton, getShiftClickManager } from 'components/index';

interface SalesKPIsProps {
  metrics: {
    totalRevenue: number;
    totalUnits: number;
    avgOrderValue: number;
    uniqueCustomers: number;
    revenueGrowth: number;
    conversionRate: number;
  };
  loading?: boolean;
}

export function SalesKPIs({ metrics, loading }: SalesKPIsProps) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => {
    if (!metrics) {
      return [
        {
          id: "total-revenue",
          title: "Total Revenue",
          value: 0,
          format: "currency" as const,
          color: "#38bdf8",
        },
        {
          id: "units-sold",
          title: "Units Sold",
          value: 0,
          format: "number" as const,
          color: "#38bdf8",
        },
        {
          id: "avg-order-value",
          title: "Avg Order Value",
          value: 0,
          format: "currency" as const,
          color: "#38bdf8",
        },
        {
          id: "unique-customers",
          title: "Unique Customers",
          value: 0,
          format: "number" as const,
          color: "#38bdf8",
        },
        {
          id: "revenue-growth",
          title: "Revenue Growth",
          value: 0,
          format: "percentage" as const,
          color: "#38bdf8",
        },
        {
          id: "conversion-rate",
          title: "Conversion Rate",
          value: 0,
          format: "percentage" as const,
          color: "#38bdf8",
        },
      ];
    }

    return [
      {
        id: "total-revenue",
        title: "Total Revenue",
        value: Number((metrics.totalRevenue || 0).toFixed(2)),
        format: "currency" as const,
        color: "#38bdf8",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Total Revenue",
            value: `$${(metrics.totalRevenue || 0).toLocaleString()}`,
            source: "Sales Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "units-sold",
        title: "Units Sold",
        value: Number((metrics.totalUnits || 0).toFixed(2)),
        format: "number" as const,
        color: "#38bdf8",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Units Sold",
            value: `${(metrics.totalUnits || 0).toLocaleString()} units`,
            source: "Sales Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "avg-order-value",
        title: "Avg Order Value",
        value: Number((metrics.avgOrderValue || 0).toFixed(2)),
        format: "currency" as const,
        color: "#38bdf8",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Avg Order Value",
            value: `$${(metrics.avgOrderValue || 0).toFixed(2)}`,
            source: "Sales Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "unique-customers",
        title: "Unique Customers",
        value: Number((metrics.uniqueCustomers || 0).toFixed(2)),
        format: "number" as const,
        color: "#38bdf8",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Unique Customers",
            value: `${(metrics.uniqueCustomers || 0).toLocaleString()} customers`,
            source: "Sales Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "revenue-growth",
        title: "Revenue Growth",
        value: Number((metrics.revenueGrowth || 0).toFixed(2)),
        format: "percentage" as const,
        color: "#38bdf8",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Revenue Growth",
            value: `${(metrics.revenueGrowth || 0).toFixed(1)}%`,
            source: "Sales Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "conversion-rate",
        title: "Conversion Rate",
        value: Number((metrics.conversionRate || 0).toFixed(2)),
        format: "percentage" as const,
        color: "#38bdf8",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Conversion Rate",
            value: `${(metrics.conversionRate || 0).toFixed(1)}%`,
            source: "Sales Performance - KPIs"
          }, event.nativeEvent);
        }
      },
    ];
  }, [metrics, shiftClickManager]);

  if (loading) {
    return (
      <MetricsRow>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} height={120} className="animate-pulse" />
        ))}
      </MetricsRow>
    );
  }

  return <KPIRow kpis={kpis} columns={6} animationDelay={50} />;
}
