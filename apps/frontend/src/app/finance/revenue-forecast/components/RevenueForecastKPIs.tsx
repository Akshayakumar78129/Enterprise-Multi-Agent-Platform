"use client";

import React, { useMemo } from 'react';
import { KPIRow } from 'components/index';
import { getSelectionManager } from '../services/SelectionManager';

export function RevenueForecastKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  const selectionManager = getSelectionManager();

  // Map status to color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#10b981'; // green
      case 'warning': return '#f59e0b'; // amber
      case 'critical': return '#ef4444'; // red
      default: return '#8b5cf6'; // purple
    }
  };

  const getTrendValue = (kpi: any) => {
    if (kpi?.trend === 'up') return Math.abs(kpi?.change || 0);
    if (kpi?.trend === 'down') return -Math.abs(kpi?.change || 0);
    return 0;
  };

  const kpis = useMemo(() => {
    return [
      {
        id: "rule-of-40",
        title: 'Rule of 40',
        value: metrics?.ruleOf40?.value || 0,
        format: "number" as const,
        subtitle: 'Growth + EBITDA Margin',
        trend: getTrendValue(metrics?.ruleOf40),
        color: getStatusColor(metrics?.ruleOf40?.status || 'good')
      },
      {
        id: "net-revenue-retention",
        title: 'Net Revenue Retention',
        value: metrics?.netRevenueRetention?.value || 0,
        format: "percentage" as const,
        subtitle: 'Customer expansion rate',
        trend: getTrendValue(metrics?.netRevenueRetention),
        color: getStatusColor(metrics?.netRevenueRetention?.status || 'good')
      },
      {
        id: "ltv-cac-ratio",
        title: 'LTV/CAC Ratio',
        value: metrics?.ltvCacRatio?.value || 0,
        format: "number" as const,
        subtitle: 'Unit economics efficiency',
        trend: getTrendValue(metrics?.ltvCacRatio),
        color: getStatusColor(metrics?.ltvCacRatio?.status || 'good')
      },
      {
        id: "revenue-quality",
        title: 'Revenue Quality Score',
        value: metrics?.revenueQuality?.value || 0,
        format: "number" as const,
        subtitle: 'Sustainability metric',
        trend: getTrendValue(metrics?.revenueQuality),
        color: getStatusColor(metrics?.revenueQuality?.status || 'good')
      },
      {
        id: "market-momentum",
        title: 'Market Share Momentum',
        value: metrics?.marketMomentum?.value || 0,
        format: "number" as const,
        subtitle: 'Competitive position',
        trend: getTrendValue(metrics?.marketMomentum),
        color: getStatusColor(metrics?.marketMomentum?.status || 'good')
      }
    ];
  }, [metrics]);

  return (
    <KPIRow
      kpis={kpis}
      columns={5}
      animationDelay={50}
      onKPIShiftClick={(kpi, event) => {
        // Format the value based on the KPI format type
        let formattedValue = '';
        if (kpi.format === 'currency') {
          formattedValue = `$${kpi.value.toLocaleString()}`;
        } else if (kpi.format === 'percentage') {
          formattedValue = `${kpi.value.toFixed(1)}%`;
        } else if (kpi.format === 'number') {
          formattedValue = kpi.value.toLocaleString();
        } else {
          formattedValue = kpi.value.toString();
        }

        selectionManager.addPoint({
          label: kpi.title,
          value: formattedValue,
          source: 'Revenue Forecast KPIs'
        }, event.shiftKey);
      }}
    />
  );
}
