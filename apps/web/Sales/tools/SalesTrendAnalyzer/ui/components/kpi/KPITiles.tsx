import React from 'react';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { KPITilesProps, THEME } from '../../types';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

const KPITiles: React.FC<KPITilesProps> = ({ data, isLoading = false, previousPeriodData, selectedMetric, onMetricSelect, onInfoIconClick }) => {
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
      tooltip: 'Total money earned from all sales after deducting returns and discounts',
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
      tooltip: 'Total number of individual products sold regardless of their price',
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
      tooltip: 'Average dollar amount customers spend per order when they buy',
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
      tooltip: 'Percentage of revenue left as profit after all costs',
    },
  ];

  // console.log('KPITiles: Generated tiles:', tiles);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}
    >
      {tiles.map((tile, idx) => (
        <div
          key={tile.label}
          className="glass-card"
          style={{
            cursor: onMetricSelect ? 'pointer' : 'default',
            border: tile.metric === selectedMetric 
              ? `2px solid ${THEME.colors.primary}` 
              : '2px solid transparent',
            borderRadius: '20px',
            transition: THEME.animations.spring,
            padding: '24px',
            boxShadow: tile.metric === selectedMetric 
              ? '0 8px 32px rgba(59, 130, 246, 0.25)' 
              : THEME.glass.boxShadow,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            minHeight: THEME.dimensions.kpiTile.height,
            minWidth: THEME.dimensions.kpiTile.minWidth,
            position: 'relative',
            outline: 'none',
            overflow: 'hidden',
            animation: `${THEME.animations.scaleIn}`,
            animationDelay: `${idx * 0.1}s`,
            animationFillMode: 'both'
          }}
          onClick={() => {
            onMetricSelect && onMetricSelect(tile.metric);
          }}
          tabIndex={0}
          onKeyPress={e => {
            if (e.key === 'Enter' && onMetricSelect) onMetricSelect(tile.metric);
          }}
          onMouseEnter={(e) => {
            if (onMetricSelect) {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (onMetricSelect) {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = tile.metric === selectedMetric 
                ? `0 8px 32px ${THEME.colors.primary20}` 
                : THEME.glass.boxShadow;
            }
          }}
        >
          {/* Gradient Background Overlay for Selected State */}
          {tile.metric === selectedMetric && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.08) 0%, rgba(233, 48, 255, 0.08) 100%)',
                borderRadius: '18px',
                zIndex: -1
              }}
            />
          )}

          {/* Icon with Gradient Background */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: THEME.colors.primaryGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px',
              boxShadow: `0 4px 16px ${THEME.colors.primary20}`
            }}
          >
            {tile.icon}
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: THEME.typography.sizes.base,
              fontWeight: THEME.typography.weights.semibold,
              color: THEME.colors.text.primary,
              margin: '0 0 8px 0',
              lineHeight: '1.2'
            }}
          >
            {tile.label}
          </h3>

          {/* Main Value with Gradient Text for Selected */}
          <div
            style={{
              fontSize: THEME.typography.sizes['2xl'],
              fontWeight: THEME.typography.weights.extrabold,
              background: tile.metric === selectedMetric 
                ? THEME.colors.text.gradient
                : 'none',
              WebkitBackgroundClip: tile.metric === selectedMetric ? 'text' : 'none',
              WebkitTextFillColor: tile.metric === selectedMetric ? 'transparent' : THEME.colors.text.primary,
              backgroundClip: tile.metric === selectedMetric ? 'text' : 'none',
              margin: '0 0 4px 0',
              lineHeight: '1.1'
            }}
          >
            {tile.formatter(tile.value)}
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontSize: THEME.typography.sizes.sm,
              color: THEME.colors.text.secondary,
              margin: '0 0 12px 0',
              fontWeight: THEME.typography.weights.medium
            }}
          >
            {tile.subValue}
          </p>

          {/* Growth Indicator */}
          {tile.growth !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '8px',
                background: tile.growth > 0 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : tile.growth < 0 
                  ? 'rgba(239, 68, 68, 0.1)' 
                  : 'rgba(107, 114, 128, 0.1)',
                fontSize: THEME.typography.sizes.sm,
                fontWeight: THEME.typography.weights.semibold,
                color: tile.growth > 0 
                  ? THEME.colors.risk.green 
                  : tile.growth < 0 
                  ? THEME.colors.risk.red 
                  : THEME.colors.text.secondary
              }}
            >
              <span style={{ fontSize: '12px' }}>
                {tile.growth > 0 ? '📈' : tile.growth < 0 ? '📉' : '➡️'}
              </span>
              {tile.growth > 0 ? '+' : ''}{Math.abs(tile.growth).toFixed(1)}%
            </div>
          )}

          {/* Info Icon in Top Right */}
          {onInfoIconClick && (
            <div
              title="Click for KPI explanation"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onInfoIconClick(e, tile.metric);
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: THEME.colors.primary20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '11px',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = THEME.colors.primary40;
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = THEME.colors.primary20;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ℹ️
            </div>
          )}

          {/* Floating Dot Pattern for Visual Interest */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '44px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: THEME.colors.primary40,
              opacity: tile.metric === selectedMetric ? 1 : 0.3,
              transition: THEME.animations.smooth
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '30px',
              right: '56px',
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              background: THEME.colors.secondary40,
              opacity: tile.metric === selectedMetric ? 1 : 0.2,
              transition: THEME.animations.smooth
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default KPITiles; 