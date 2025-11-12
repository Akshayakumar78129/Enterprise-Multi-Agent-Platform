"use client";

import React, { useMemo } from 'react';
import { KPIRow, MetricsRow, Skeleton, getShiftClickManager } from 'components/index';

interface HoldingCostKPIsProps {
  data: {
    total_inventory_value: number;
    total_annual_holding_cost: number;
    avg_holding_cost_pct: number;
    total_items_analyzed: number;
    excessive_cost_items: number;
    potential_annual_savings: number;
    total_storage_cost: number;
    total_opportunity_cost: number;
    total_risk_cost: number;
  };
  loading?: boolean;
}

export function HoldingCostKPIs({ data, loading = false }: HoldingCostKPIsProps) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => {
    if (!data) return [];

    return [
      {
        id: 'total-inventory-value',
        title: 'Total Inventory Value',
        value: data.total_inventory_value || 0,
        format: 'currency' as const,
        color: '#3b82f6'
      },
      {
        id: 'annual-holding-cost',
        title: 'Annual Holding Cost',
        value: data.total_annual_holding_cost || 0,
        format: 'currency' as const,
        color: '#ef4444'
      },
      {
        id: 'avg-holding-cost-pct',
        title: 'Avg Holding Cost %',
        value: data.avg_holding_cost_pct || 0,
        format: 'percentage' as const,
        color: '#f59e0b'
      },
      {
        id: 'items-analyzed',
        title: 'Items Analyzed',
        value: data.total_items_analyzed || 0,
        format: 'number' as const,
        color: '#10b981'
      },
      {
        id: 'excessive-cost-items',
        title: 'High Cost Items',
        value: data.excessive_cost_items || 0,
        format: 'number' as const,
        color: '#8b5cf6'
      },
      {
        id: 'potential-savings',
        title: 'Potential Savings',
        value: data.potential_annual_savings || 0,
        format: 'currency' as const,
        color: '#06b6d4'
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <MetricsRow>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} height={120} className="animate-pulse" />
        ))}
      </MetricsRow>
    );
  }

  return (
    <KPIRow
      kpis={kpis}
      columns={6}
      animationDelay={50}
      onKPIShiftClick={(kpi, event) => {
        shiftClickManager.addPoint({
          label: kpi.title,
          value: typeof kpi.value === 'number' ? kpi.value.toString() : kpi.value.toString(),
          source: 'Holding Cost KPIs'
        }, event.nativeEvent);
      }}
    />
  );
}
