import React from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { ProductKpiData } from '../../types';

interface KpiTileRowWithInsightsProps {
  data: ProductKpiData;
  loading: boolean;
  onKpiClick?: (kpiData: any, kpiType: string) => void;
  style?: React.CSSProperties;
}

/**
 * Enhanced KPI tiles with individual AI Insights triggers
 */
export const KpiTileRowWithInsights: React.FC<KpiTileRowWithInsightsProps> = ({ 
  data, 
  loading, 
  onKpiClick,
  style 
}) => {
  const theme = useTheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up-good':
        return '↑';
      case 'up-bad':
        return '↑';
      case 'down-good':
        return '↓';
      case 'down-bad':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up-good':
      case 'down-good':
        return theme.colors.signalGreen;
      case 'up-bad':
      case 'down-bad':
        return theme.colors.signalMagenta;
      default:
        return theme.colors.mutedForeground;
    }
  };

  const handleKpiClick = (kpiKey: string, kpiValue: any) => {
    if (onKpiClick) {
      onKpiClick({
        kpiKey,
        ...kpiValue,
        allKpis: data
      }, `kpi_${kpiKey}`);
    }
  };

  const kpiConfig = [
    {
      key: 'totalSales',
      title: 'Total Sales',
      icon: '💰',
      value: data.totalSales,
      formatter: formatCurrency,
    },
    {
      key: 'averageMargin',
      title: 'Average Margin',
      icon: '📊',
      value: data.averageMargin,
      formatter: formatPercentage,
    },
    {
      key: 'totalUnits',
      title: 'Total Units',
      icon: '📦',
      value: data.totalUnits,
      formatter: (v: any) => v.value.toLocaleString(),
    },
    {
      key: 'topCategory',
      title: 'Top Category',
      icon: '🏆',
      value: data.topCategory,
      formatter: (v: any) => `${v.value} (${v.percentage}%)`,
    },
    {
      key: 'priceDistribution',
      title: 'Price Distribution',
      icon: '💳',
      value: data.priceDistribution,
      formatter: (v: any) => `${v.dominant} (${v.percentage}%)`,
    },
  ];

  return (
    <Grid columns={5} gap="md" style={style}>
      {kpiConfig.map((kpi) => (
        <GridItem key={kpi.key} colSpan={1}>
          <Card
            elevation="md"
            style={{
              background: theme.colors.midnight,
              border: `1px solid ${theme.colors.graphite}`,
              borderRadius: '12px',
              padding: theme.spacing[4],
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 224, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = theme.colors.graphite;
            }}
            onClick={() => handleKpiClick(kpi.key, kpi.value)}
          >
            {/* AI Insights Icon */}
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(0, 224, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              border: '1px solid rgba(0, 224, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Click for AI Insights"
            >
              🤖
            </div>

            {/* KPI Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                <span style={{ fontSize: '24px' }}>{kpi.icon}</span>
                <span style={{ 
                  color: theme.colors.mutedForeground, 
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {kpi.title}
                </span>
              </div>

              {/* Value */}
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 700,
                color: theme.colors.lightCyan
              }}>
                {loading ? (
                  <div style={{
                    width: '100px',
                    height: '32px',
                    background: 'linear-gradient(90deg, rgba(0,224,255,0.1) 0%, rgba(0,224,255,0.2) 50%, rgba(0,224,255,0.1) 100%)',
                    borderRadius: '4px',
                    animation: 'shimmer 2s infinite',
                  }} />
                ) : (
                  kpi.formatter(kpi.value)
                )}
              </div>

              {/* Trend */}
              {kpi.value?.trend !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                  <span style={{ 
                    color: getTrendColor(kpi.value.direction || 'neutral'),
                    fontSize: '18px',
                    fontWeight: 600
                  }}>
                    {getTrendIcon(kpi.value.direction || 'neutral')}
                  </span>
                  <span style={{ 
                    color: getTrendColor(kpi.value.direction || 'neutral'),
                    fontSize: '14px'
                  }}>
                    {Math.abs(kpi.value.trend)}%
                  </span>
                  <span style={{ 
                    color: theme.colors.mutedForeground, 
                    fontSize: '12px' 
                  }}>
                    vs last period
                  </span>
                </div>
              )}
            </div>

            {/* Hover hint */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              color: 'rgba(0, 224, 255, 0.4)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
            }}
            className="hover-hint">
              Click for insights
            </div>
          </Card>
        </GridItem>
      ))}

      <style jsx>{`
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        .hover-hint {
          opacity: 0;
        }
        
        div:hover .hover-hint {
          opacity: 1;
        }
      `}</style>
    </Grid>
  );
};