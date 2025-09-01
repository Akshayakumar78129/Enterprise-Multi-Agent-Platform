/**
 * KPI Tiles Row Component
 * Displays all 5 KPI tiles in a horizontal row with exact specifications
 */

import React, { useState } from 'react';
import { KPITile } from './KPITile';
import { formatCurrency, formatNumber, formatTurnoverRatio, formatPercentage } from '../../utils/formatters';

// Define KPI metrics interface
export interface KPIMetrics {
  totalSlowMovingItems: number;
  slowMovingValue: number;
  averageTurnoverRatio: number;
  agedInventoryPercent: number;
  carryingCostImpact: number;
}


export interface KPITilesRowProps {
  metrics: KPIMetrics;
  onKpiClick?: (kpiId: string, event?: React.MouseEvent) => void;
  targets?: Record<string, string>;
  onTargetChange?: (kpiId: string) => (newTarget: string) => void;
}

export const KPITilesRow: React.FC<KPITilesRowProps> = ({ metrics, onKpiClick, targets, onTargetChange }) => {
  // State for each target value (default to initial values)
  // If targets/onTargetChange are not provided, use local state (for backward compatibility)
  const [localTargets, setLocalTargets] = useState({
    'slow-moving-items': '< 300',
    'slow-moving-value': '< $1M',
    'turnover-ratio': '4.0x',
    'aged-inventory': '< 15%',
    'carrying-cost': '< $75K',
  });
  const effectiveTargets = targets || localTargets;
  const effectiveOnTargetChange = onTargetChange || ((kpiId: string) => (newTarget: string) => setLocalTargets(prev => ({ ...prev, [kpiId]: newTarget })));

  // Helper function to determine trend based on values
  const getTrend = (current: number, target: number): 'improving' | 'worsening' | 'stable' => {
    const ratio = current / target;
    if (ratio < 0.9) return 'improving';
    if (ratio > 1.1) return 'worsening';
    return 'stable';
  };

  // Calculate gauge values (0-100)
  const slowItemsGauge = Math.min((metrics.totalSlowMovingItems / 500) * 100, 100);
  const slowValueGauge = Math.min((metrics.slowMovingValue / 2000000) * 100, 100);
  const turnoverGauge = Math.min((metrics.averageTurnoverRatio / 6) * 100, 100);
  const agedGauge = Math.min((metrics.agedInventoryPercent / 30) * 100, 100);
  const costGauge = Math.min((metrics.carryingCostImpact / 150000) * 100, 100);

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      marginBottom: '32px',
      padding: '0 16px'
    }}>
      {/* KPI Tile 1: Total Slow-Moving Items */}
      <KPITile
        title="Total Slow-Moving Items"
        value={formatNumber(metrics.totalSlowMovingItems)}
        trend={getTrend(metrics.totalSlowMovingItems, 300)}
        icon="📦"
        subtitle="+5% vs last month"
        gaugeValue={slowItemsGauge}
        gaugeType="circular"
        targetValue={effectiveTargets['slow-moving-items']}
        kpiId="slow-moving-items"
        onTileClick={onKpiClick ? ((kpiId, event) => onKpiClick(kpiId, event)) : undefined}
        onTargetChange={effectiveOnTargetChange('slow-moving-items')}
      />

      {/* KPI Tile 2: Slow-Moving Value */}
      <KPITile
        title="Slow-Moving Value"
        value={formatCurrency(metrics.slowMovingValue)}
        trend={getTrend(metrics.slowMovingValue, 1000000)}
        icon="💰"
        subtitle="+$125K vs last month"
        gaugeValue={slowValueGauge}
        gaugeType="circular"
        targetValue={effectiveTargets['slow-moving-value']}
        kpiId="slow-moving-value"
        onTileClick={onKpiClick ? ((kpiId, event) => onKpiClick(kpiId, event)) : undefined}
        onTargetChange={effectiveOnTargetChange('slow-moving-value')}
      />

      {/* KPI Tile 3: Average Turnover Ratio */}
      <KPITile
        title="Average Turnover Ratio"
        value={formatTurnoverRatio(metrics.averageTurnoverRatio)}
        trend={getTrend(metrics.averageTurnoverRatio, 4.0)} // current, target
        icon="🔄"
        subtitle="Target: 4.0x"
        gaugeValue={turnoverGauge}
        gaugeType="horizontal"
        targetValue={effectiveTargets['turnover-ratio']}
        kpiId="turnover-ratio"
        onTileClick={onKpiClick ? ((kpiId, event) => onKpiClick(kpiId, event)) : undefined}
        onTargetChange={effectiveOnTargetChange('turnover-ratio')}
      />

      {/* KPI Tile 4: Aged Inventory */}
      <KPITile
        title="Aged Inventory"
        value={formatPercentage(metrics.agedInventoryPercent / 100)}
        trend={getTrend(metrics.agedInventoryPercent, 15)}
        icon="⏰"
        subtitle="90+ days old"
        gaugeValue={agedGauge}
        gaugeType="horizontal"
        targetValue={effectiveTargets['aged-inventory']}
        kpiId="aged-inventory"
        onTileClick={onKpiClick ? ((kpiId, event) => onKpiClick(kpiId, event)) : undefined}
        onTargetChange={effectiveOnTargetChange('aged-inventory')}
      />

      {/* KPI Tile 5: Carrying Cost Impact */}
      <KPITile
        title="Carrying Cost Impact"
        value={formatCurrency(metrics.carryingCostImpact)}
        trend={getTrend(metrics.carryingCostImpact, 75000)}
        icon="📈"
        subtitle="Monthly burden"
        gaugeValue={costGauge}
        gaugeType="circular"
        targetValue={effectiveTargets['carrying-cost']}
        kpiId="carrying-cost"
        onTileClick={onKpiClick ? ((kpiId, event) => onKpiClick(kpiId, event)) : undefined}
        onTargetChange={effectiveOnTargetChange('carrying-cost')}
      />
    </div>
  );
};
