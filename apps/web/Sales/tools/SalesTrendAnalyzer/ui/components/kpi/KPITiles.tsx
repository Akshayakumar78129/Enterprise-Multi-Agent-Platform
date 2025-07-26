import React from 'react';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { KPITileProps, THEME } from '../../types';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

interface KPITilesProps extends KPITileProps {
  selectedMetric?: string;
  onMetricSelect?: (metric: string) => void;
}

const KPITiles: React.FC<KPITilesProps> = ({ data, isLoading = false, previousPeriodData, selectedMetric, onMetricSelect }) => {
  // console.log('KPITiles render:', { data, isLoading, selectedMetric });

  if (!data && !isLoading) {
    // console.log('KPITiles: No data and not loading, returning null');
    return null;
  }

  const calculateGrowth = (current: number, previous: number): number => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendDirection = (growth: number): 'up-good' | 'down-good' | 'neutral' => {
    if (growth > 0) return 'up-good';
    if (growth < 0) return 'down-good';
    return 'neutral';
  };

  const tiles = [
    {
      label: 'Total Revenue',
      value: data?.total_revenue || 0,
      previousValue: previousPeriodData?.total_revenue,
      formatter: formatCurrency,
      growth: previousPeriodData ? calculateGrowth(data?.total_revenue || 0, previousPeriodData.total_revenue) : undefined,
      subValue: 'Net sales amount',
      variant: 'default' as const,
      icon: '💰',
      metric: 'revenue',
    },
    {
      label: 'Total Units',
      value: data?.total_units || 0,
      previousValue: previousPeriodData?.total_units,
      formatter: formatNumber,
      growth: previousPeriodData ? calculateGrowth(data?.total_units || 0, previousPeriodData.total_units) : undefined,
      subValue: 'Products sold',
      variant: 'default' as const,
      icon: '📦',
      metric: 'units',
    },
    {
      label: 'Average Order Value',
      value: data?.avg_order_value || 0,
      previousValue: previousPeriodData?.avg_order_value,
      formatter: formatCurrency,
      growth: previousPeriodData ? calculateGrowth(data?.avg_order_value || 0, previousPeriodData.avg_order_value) : undefined,
      subValue: 'Revenue per order',
      variant: 'default' as const,
      icon: '🛍️',
      metric: 'aov',
    },
    {
      label: 'Margin %',
      value: data?.margin_percentage || 0,
      previousValue: previousPeriodData?.margin_percentage,
      formatter: formatPercentage,
      growth: previousPeriodData ? calculateGrowth(data?.margin_percentage || 0, previousPeriodData.margin_percentage) : undefined,
      subValue: 'Profit margin',
      variant: 'default' as const,
      icon: '📈',
      metric: 'margin',
    },
  ];

  // console.log('KPITiles: Generated tiles:', tiles);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
        padding: '20px',
        background: THEME.colors.midnightNavy,
        borderRadius: '18px',
        boxShadow: '0 4px 24px 0 rgba(10,18,36,0.12)',
      }}
    >
      {tiles.map((tile, idx) => (
        <div
          key={tile.label}
          style={{
            cursor: onMetricSelect ? 'pointer' : 'default',
            border: tile.metric === selectedMetric ? `2px solid ${THEME.colors.electricCyan}` : '2px solid transparent',
            borderRadius: 16,
            transition: 'border 0.2s, box-shadow 0.2s',
            background: THEME.colors.graphite,
            padding: '24px 20px',
            boxShadow: tile.metric === selectedMetric ? '0 0 0 4px rgba(0,224,255,0.12)' : '0 2px 12px 0 rgba(10,18,36,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            minHeight: 140,
            position: 'relative',
            outline: 'none',
          }}
          onClick={() => {
            onMetricSelect && onMetricSelect(tile.metric);
          }}
          tabIndex={0}
          onKeyPress={e => {
            if (e.key === 'Enter' && onMetricSelect) onMetricSelect(tile.metric);
          }}
        >
          <span style={{ fontSize: 32, marginBottom: 8, color: THEME.colors.electricCyan }}>{tile.icon}</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: THEME.colors.cloudWhite, marginBottom: 4 }}>{tile.label}</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: THEME.colors.cloudWhite, marginBottom: 2 }}>{tile.formatter(tile.value)}</span>
          <span style={{ fontSize: 14, color: THEME.colors.cloudWhite, opacity: 0.7, marginBottom: 8 }}>{tile.subValue}</span>
          {tile.growth !== undefined && (
            <span style={{ fontSize: 14, color: tile.growth > 0 ? THEME.colors.electricCyan : tile.growth < 0 ? THEME.colors.signalMagenta : THEME.colors.cloudWhite, fontWeight: 500 }}>
              {tile.growth > 0 ? '▲' : tile.growth < 0 ? '▼' : '→'} {Math.abs(tile.growth).toFixed(1)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPITiles; 