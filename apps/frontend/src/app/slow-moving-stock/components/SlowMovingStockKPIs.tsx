"use client";

import React, { useMemo } from 'react';
import { KPIRow, getShiftClickManager } from 'components/index';
import { Package, TrendingDown, Clock, DollarSign, AlertTriangle, Layers } from 'lucide-react';

interface SlowMovingStockKPIsProps {
  metrics: {
    totalItems?: number;
    totalInventoryValue?: number;
    avgTurnoverRate?: number;
    avgDaysSinceLastSale?: number;
    slowMovingItems?: number;
    carryingCost?: number;
  };
  loading?: boolean;
}

export function SlowMovingStockKPIs({ metrics = {}, loading = false }: SlowMovingStockKPIsProps) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => {
    const {
      totalItems = 0,
      totalInventoryValue = 0,
      avgTurnoverRate = 0,
      avgDaysSinceLastSale = 0,
      slowMovingItems = 0,
      carryingCost = 0
    } = metrics;

    return [
      {
        id: "total-items",
        title: "Total Items",
        value: totalItems.toLocaleString(),
        icon: <Package className="h-5 w-5" />,
        trend: undefined,
        loading,
      },
      {
        id: "slow-moving-items",
        title: "Slow Moving Items",
        value: slowMovingItems.toLocaleString(),
        icon: <TrendingDown className="h-5 w-5" />,
        trend: undefined,
        loading,
        description: "Items with turnover < 2 turns/year"
      },
      {
        id: "avg-turnover-rate",
        title: "Avg Turnover Rate",
        value: avgTurnoverRate.toFixed(2),
        icon: <Layers className="h-5 w-5" />,
        trend: undefined,
        loading,
        description: "Average turns per year"
      },
      {
        id: "avg-days-since-last-sale",
        title: "Avg Days Since Last Sale",
        value: Math.round(avgDaysSinceLastSale).toLocaleString(),
        icon: <Clock className="h-5 w-5" />,
        trend: undefined,
        loading,
        description: "Average days since last transaction"
      },
      {
        id: "carrying-cost",
        title: "Carrying Cost (90+ Days)",
        value: `$${(carryingCost / 1000).toFixed(1)}K`,
        icon: <AlertTriangle className="h-5 w-5" />,
        trend: undefined,
        loading,
        description: "Value of items not sold in 90+ days"
      },
      {
        id: "total-inventory-value",
        title: "Total Inventory Value",
        value: `$${(totalInventoryValue / 1000000).toFixed(2)}M`,
        icon: <DollarSign className="h-5 w-5" />,
        trend: undefined,
        loading,
      },
    ];
  }, [metrics, loading]);

  return (
    <KPIRow
      kpis={kpis}
      columns={6}
      onKPIShiftClick={(kpi, event) => {
        shiftClickManager.addPoint({
          id: `kpi-${kpi.id}`,
          label: kpi.title,
          value: kpi.value,
          source: 'Slow Moving Stock KPIs',
          metadata: {
            fromShiftClick: true,
            timestamp: Date.now(),
            dashboardContext: 'slow-moving-stock'
          }
        }, event.nativeEvent);
      }}
    />
  );
}
