import React, { forwardRef, useImperativeHandle } from 'react';
import KPITile from './KPITile';
import { KPIData } from '../../types';

interface KPITilesRowProps {
  data: KPIData;
  width?: number;
  onTileClick?: (metric: string) => void;
}

const KPITilesRow = forwardRef<any, KPITilesRowProps>(({
  data,
  width = 700,
  onTileClick
}, ref) => {
  // Create refs for each KPI tile
  const totalCustomersRef = React.useRef<any>(null);
  const avgPurchaseFrequencyRef = React.useRef<any>(null);
  const avgIntervalDaysRef = React.useRef<any>(null);
  const activeCustomersRef = React.useRef<any>(null);
  const highValueCustomersRef = React.useRef<any>(null);

  // Expose methods to control all tiles
  useImperativeHandle(ref, () => ({
    highlightTile: (metric: string) => {
      switch (metric) {
        case 'total_customers':
          totalCustomersRef.current?.highlight();
          break;
        case 'avg_purchase_frequency':
          avgPurchaseFrequencyRef.current?.highlight();
          break;
        case 'avg_interval_days':
          avgIntervalDaysRef.current?.highlight();
          break;
        case 'active_customers_percentage':
          activeCustomersRef.current?.highlight();
          break;
        case 'high_value_customers_percentage':
          highValueCustomersRef.current?.highlight();
          break;
      }
    },
    pulseTile: (metric: string) => {
      switch (metric) {
        case 'total_customers':
          totalCustomersRef.current?.pulse();
          break;
        case 'avg_purchase_frequency':
          avgPurchaseFrequencyRef.current?.pulse();
          break;
        case 'avg_interval_days':
          avgIntervalDaysRef.current?.pulse();
          break;
        case 'active_customers_percentage':
          activeCustomersRef.current?.pulse();
          break;
        case 'high_value_customers_percentage':
          highValueCustomersRef.current?.pulse();
          break;
      }
    },
    resetAll: () => {
      totalCustomersRef.current?.reset();
      avgPurchaseFrequencyRef.current?.reset();
      avgIntervalDaysRef.current?.reset();
      activeCustomersRef.current?.reset();
      highValueCustomersRef.current?.reset();
    }
  }));

  // Calculate trends if we have previous period data
  const calculateTrend = (current: number, previous?: number): number | undefined => {
    if (previous === undefined) return undefined;
    return ((current - previous) / previous) * 100;
  };

  // Calculate trends for each metric
  const totalCustomersTrend = calculateTrend(
    data.total_customers,
    data.previous_period_comparison?.total_customers
  );

  const avgPurchaseFrequencyTrend = calculateTrend(
    data.avg_purchase_frequency,
    data.previous_period_comparison?.avg_purchase_frequency
  );

  const avgIntervalDaysTrend = calculateTrend(
    data.avg_interval_days,
    data.previous_period_comparison?.avg_interval_days
  );

  const activeCustomersTrend = calculateTrend(
    data.active_customers_percentage,
    data.previous_period_comparison?.active_customers_percentage
  );

  const highValueCustomersTrend = calculateTrend(
    data.high_value_customers_percentage,
    data.previous_period_comparison?.high_value_customers_percentage
  );

  // Calculate if any metrics are in critical state
  const isIntervalCritical = avgIntervalDaysTrend !== undefined && avgIntervalDaysTrend > 10;
  const isActiveCritical = data.active_customers_percentage < 25;
  const isFrequencyCritical = avgPurchaseFrequencyTrend !== undefined && avgPurchaseFrequencyTrend < -10;

  // Calculate tile width based on container width and spacing
  // We want 5 tiles with 16px spacing between them
  const tileSpacing = 16;
  const tileWidth = (width - (tileSpacing * 4)) / 5;

  return (
    <div
      className="kpi-tiles-row"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: `${width}px`,
        marginBottom: '24px'
      }}
    >
      <KPITile
        ref={totalCustomersRef}
        title="Total Customers"
        value={data.total_customers}
        trend={totalCustomersTrend}
        width={tileWidth}
        height={120}
        onClick={() => onTileClick?.('total_customers')}
      />

      <KPITile
        ref={avgPurchaseFrequencyRef}
        title="Avg. Purchase Frequency"
        value={data.avg_purchase_frequency}
        trend={avgPurchaseFrequencyTrend}
        format="decimal"
        isCritical={isFrequencyCritical}
        showSpark
        width={tileWidth}
        height={120}
        onClick={() => onTileClick?.('avg_purchase_frequency')}
      />

      <KPITile
        ref={avgIntervalDaysRef}
        title="Avg. Days Between"
        value={data.avg_interval_days}
        trend={avgIntervalDaysTrend}
        format="decimal"
        isCritical={isIntervalCritical}
        width={tileWidth}
        height={120}
        onClick={() => onTileClick?.('avg_interval_days')}
      />

      <KPITile
        ref={activeCustomersRef}
        title="Active Customers (90d)"
        value={data.active_customers_percentage}
        trend={activeCustomersTrend}
        format="percentage"
        isCritical={isActiveCritical}
        width={tileWidth}
        height={120}
        onClick={() => onTileClick?.('active_customers_percentage')}
      />

      <KPITile
        ref={highValueCustomersRef}
        title="High Value Customers"
        value={data.high_value_customers_percentage}
        trend={highValueCustomersTrend}
        format="percentage"
        showSpark
        width={tileWidth}
        height={120}
        onClick={() => onTileClick?.('high_value_customers_percentage')}
      />
    </div>
  );
});

KPITilesRow.displayName = 'KPITilesRow';

export default KPITilesRow; 