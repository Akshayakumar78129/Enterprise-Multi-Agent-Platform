"use client";

import React, { useMemo } from 'react';
import { KPIRow, getShiftClickManager } from 'components/index';
import { Package, TrendingUp, AlertTriangle, Calendar, CheckCircle, DollarSign } from 'lucide-react';

interface InventoryLevelKPIsProps {
  metrics: {
    totalInventoryValue?: number;
    stockTurnover?: number;
    stockoutRisk?: number;
    averageDaysOnHand?: number;
    inventoryAccuracy?: number;
    excessStock?: number;
  };
  loading?: boolean;
}

export function InventoryLevelKPIs({ metrics = {}, loading = false }: InventoryLevelKPIsProps) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => {
    const {
      totalInventoryValue = 0,
      stockTurnover = 0,
      stockoutRisk = 0,
      averageDaysOnHand = 0,
      inventoryAccuracy = 0,
      excessStock = 0
    } = metrics;

    return [
      {
        id: "total-inventory-value",
        title: "Total Inventory Value",
        value: totalInventoryValue,
        format: "currency" as const,
        subtitle: "Current stock value",
        icon: DollarSign,
        color: "#8b5cf6",
      },
      {
        id: "stock-turnover",
        title: "Stock Turnover Rate",
        value: stockTurnover,
        format: "number" as const,
        subtitle: "Times per year",
        icon: TrendingUp,
        color: "#10b981",
        suffix: "x/year"
      },
      {
        id: "stockout-risk",
        title: "Stockout Risk",
        value: stockoutRisk,
        format: "percentage" as const,
        subtitle: "Items at risk",
        icon: AlertTriangle,
        color: stockoutRisk > 10 ? "#ef4444" : "#f59e0b",
      },
      {
        id: "average-days-on-hand",
        title: "Avg Days on Hand",
        value: averageDaysOnHand,
        format: "number" as const,
        subtitle: "Average inventory age",
        icon: Calendar,
        color: "#06b6d4",
        suffix: " days"
      },
      {
        id: "inventory-accuracy",
        title: "Inventory Accuracy",
        value: inventoryAccuracy,
        format: "percentage" as const,
        subtitle: "System vs physical",
        icon: CheckCircle,
        color: inventoryAccuracy >= 95 ? "#10b981" : "#f59e0b",
      },
      {
        id: "excess-stock",
        title: "Excess Stock Value",
        value: excessStock,
        format: "currency" as const,
        subtitle: "Overstocked items",
        icon: Package,
        color: "#ec4899",
      },
    ];
  }, [metrics]);

  return (
    <KPIRow
      kpis={kpis}
      columns={6}
      animationDelay={50}
      loading={loading}
      onKPIShiftClick={(kpi, event) => {
        shiftClickManager.addPoint({
          label: kpi.title,
          value: typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value.toString(),
          source: 'Inventory Level KPIs'
        }, event.nativeEvent);
      }}
    />
  );
}

export default InventoryLevelKPIs;
