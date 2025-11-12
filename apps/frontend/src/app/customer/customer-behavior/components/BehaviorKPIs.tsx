"use client";

import React, { useMemo } from "react";
import { KPIRow, getShiftClickManager } from "components/index";

interface BehaviorKPIProps {
  kpiMetrics: {
    avgFrequency: string | number;
    avgOrderValue: string | number;
    topCategory: string;
    primaryChannel: string;
    avgEngagement: string | number;
  };
  loading: boolean;
}

export function BehaviorKPIs({ kpiMetrics, loading }: BehaviorKPIProps) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => [
    {
      id: "avg-frequency",
      title: "Avg Purchase Frequency",
      value: parseFloat(String(kpiMetrics.avgFrequency)) || 0,
      format: "number" as const,
      color: "#06b6d4",
      onShiftClick: (event: React.MouseEvent) => {
        shiftClickManager.addPoint({
          label: "Avg Purchase Frequency",
          value: `${kpiMetrics.avgFrequency} days`,
          source: 'Behavior KPIs'
        }, event.nativeEvent);
      }
    },
    {
      id: "avg-order-value",
      title: "Avg Order Value",
      value: parseFloat(String(kpiMetrics.avgOrderValue)) || 0,
      format: "currency" as const,
      color: "#10b981",
      onShiftClick: (event: React.MouseEvent) => {
        shiftClickManager.addPoint({
          label: "Avg Order Value",
          value: `$${kpiMetrics.avgOrderValue}`,
          source: 'Behavior KPIs'
        }, event.nativeEvent);
      }
    },
    {
      id: "top-category",
      title: "Top Category",
      value: kpiMetrics.topCategory,
      format: "text" as const,
      color: "#8b5cf6",
      onShiftClick: (event: React.MouseEvent) => {
        shiftClickManager.addPoint({
          label: "Top Category",
          value: kpiMetrics.topCategory,
          source: 'Behavior KPIs'
        }, event.nativeEvent);
      }
    },
    {
      id: "primary-channel",
      title: "Primary Channel",
      value: kpiMetrics.primaryChannel,
      format: "text" as const,
      color: "#3b82f6",
      onShiftClick: (event: React.MouseEvent) => {
        shiftClickManager.addPoint({
          label: "Primary Channel",
          value: kpiMetrics.primaryChannel,
          source: 'Behavior KPIs'
        }, event.nativeEvent);
      }
    },
    {
      id: "avg-engagement",
      title: "Avg Engagement",
      value: parseFloat(String(kpiMetrics.avgEngagement)) || 0,
      format: "number" as const,
      color: "#f59e0b",
      onShiftClick: (event: React.MouseEvent) => {
        shiftClickManager.addPoint({
          label: "Avg Engagement",
          value: `${kpiMetrics.avgEngagement}`,
          source: 'Behavior KPIs'
        }, event.nativeEvent);
      }
    }
  ], [kpiMetrics, shiftClickManager]);

  return <KPIRow kpis={kpis} columns={5} animationDelay={50} />;
}
