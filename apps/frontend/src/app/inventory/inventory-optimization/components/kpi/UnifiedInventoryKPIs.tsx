"use client";

import React, { useMemo } from 'react';
import { KPIRow } from 'components/index';

interface UnifiedInventoryKPIsProps {
  holdingCostData: any;
  stockOptData: any;
  loading?: boolean;
}

export function UnifiedInventoryKPIs({ holdingCostData, stockOptData, loading = false }: UnifiedInventoryKPIsProps) {
  const kpis = useMemo(() => {
    if (!holdingCostData || !stockOptData) return [];

    return [
      {
        id: 'total-inventory-value',
        title: 'Total Inventory Value',
        value: holdingCostData.total_inventory_value || 0,
        format: 'currency' as const,
        trend: 'neutral' as const,
        description: 'Current total inventory value'
      },
      {
        id: 'holding-cost',
        title: 'Annual Holding Cost',
        value: holdingCostData.total_annual_holding_cost || 0,
        format: 'currency' as const,
        trend: 'down' as const,
        description: 'Total annual cost to hold inventory'
      },
      {
        id: 'total-savings',
        title: 'Total Savings Potential',
        value: (holdingCostData.potential_annual_savings || 0) + (stockOptData.total_cost_savings || 0),
        format: 'currency' as const,
        trend: 'up' as const,
        description: 'Combined optimization savings'
      },
      {
        id: 'service-level',
        title: 'Service Level',
        value: stockOptData.service_level || 0,
        format: 'percent' as const,
        trend: stockOptData.service_level >= 95 ? 'up' as const : 'down' as const,
        description: 'Target service level achievement'
      },
      {
        id: 'critical-items',
        title: 'Critical Items',
        value: (holdingCostData.excessive_cost_items || 0) + (stockOptData.items_needing_reorder || 0),
        format: 'number' as const,
        trend: 'down' as const,
        description: 'High cost + reorder needed items'
      },
      {
        id: 'optimization-score',
        title: 'Optimization Score',
        value: calculateOptimizationScore(holdingCostData, stockOptData),
        format: 'number' as const,
        trend: calculateOptimizationScore(holdingCostData, stockOptData) >= 70 ? 'up' as const : 'down' as const,
        description: 'Overall inventory health score (0-100)'
      },
    ];
  }, [holdingCostData, stockOptData]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-surface/50 rounded-lg"></div>
      </div>
    );
  }

  return <KPIRow kpis={kpis} columns={6} animationDelay={50} />;
}

function calculateOptimizationScore(holdingCostData: any, stockOptData: any): number {
  // Calculate a 0-100 score based on multiple factors
  let score = 100;

  // Penalty for excessive holding costs (max -30)
  const holdingCostPct = holdingCostData.avg_holding_cost_pct || 0;
  if (holdingCostPct > 0.4) {
    score -= Math.min(30, (holdingCostPct - 0.4) * 100);
  }

  // Penalty for items needing reorder (max -20)
  const reorderPct = (stockOptData.items_needing_reorder || 0) / Math.max(stockOptData.total_items || 1, 1);
  score -= Math.min(20, reorderPct * 100);

  // Penalty for overstocked items (max -20)
  const overstockPct = (stockOptData.items_overstock || 0) / Math.max(stockOptData.total_items || 1, 1);
  score -= Math.min(20, overstockPct * 100);

  // Bonus for high service level (max +10)
  const serviceLevel = stockOptData.service_level || 0;
  if (serviceLevel >= 95) {
    score += 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
