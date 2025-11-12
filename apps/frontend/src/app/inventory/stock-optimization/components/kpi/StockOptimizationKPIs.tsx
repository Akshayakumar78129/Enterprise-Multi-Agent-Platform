"use client";

import React, { useMemo } from 'react';
import { KPIRow, MetricsRow, Skeleton, getShiftClickManager } from 'components/index';

interface StockOptimizationKPIsProps {
  data: {
    total_optimized_value: number;
    items_needing_reorder: number;
    safety_stock_coverage: number;
    avg_order_frequency: number;
    total_cost_savings: number;
    service_level: number;
    total_items: number;
    items_overstock: number;
    items_understock: number;
  };
  loading?: boolean;
}

export function StockOptimizationKPIs({ data, loading = false }: StockOptimizationKPIsProps) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => {
    if (!data) return [];

    return [
      {
        id: 'optimized-value',
        title: 'Optimized Stock Value',
        value: data.total_optimized_value || 0,
        format: 'currency' as const,
        color: '#3b82f6'
      },
      {
        id: 'cost-savings',
        title: 'Annual Cost Savings',
        value: data.total_cost_savings || 0,
        format: 'currency' as const,
        color: '#10b981'
      },
      {
        id: 'service-level',
        title: 'Service Level',
        value: data.service_level || 0,
        format: 'percentage' as const,
        color: '#8b5cf6'
      },
      {
        id: 'reorder-items',
        title: 'Items Need Reorder',
        value: data.items_needing_reorder || 0,
        format: 'number' as const,
        color: '#ef4444'
      },
      {
        id: 'overstock-items',
        title: 'Overstocked Items',
        value: data.items_overstock || 0,
        format: 'number' as const,
        color: '#f59e0b'
      },
      {
        id: 'safety-coverage',
        title: 'Safety Stock Days',
        value: data.safety_stock_coverage || 0,
        format: 'number' as const,
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
          source: 'Stock Optimization KPIs'
        }, event.nativeEvent);
      }}
    />
  );
}
