import React from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { ProductKpiData } from '../../types';

interface KpiTileRowProps {
  data: ProductKpiData;
  loading: boolean;
  style?: React.CSSProperties;
}

/**
 * Row of KPI tiles displaying key product performance metrics
 */
export const KpiTileRow: React.FC<KpiTileRowProps> = ({ data, loading, style }) => {
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
        return theme.colors.electricCyan;
      case 'up-bad':
      case 'down-bad':
        return theme.colors.signalMagenta;
      default:
        return theme.colors.cloudWhite;
    }
  };

  return (
    <Grid columns={5} gap={theme.spacing[4]} style={style}>
      {/* Total Sales */}
      <GridItem colSpan={1}>
        <Card
          elevation="sm"
          style={{
            background: theme.colors.midnight,
            border: `1px solid ${theme.colors.graphite}`,
            borderRadius: '12px',
            padding: theme.spacing[3],
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '14px',
              marginBottom: '8px',
            }}>
              Total Sales
            </div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '32px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}>
              {loading ? '...' : formatCurrency(data.totalSales.value)}
            </div>
          </div>
          <div style={{ 
            color: getTrendColor(data.totalSales.direction),
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {getTrendIcon(data.totalSales.direction)} {data.totalSales.trend}%
          </div>
        </Card>
      </GridItem>

      {/* Average Margin */}
      <GridItem colSpan={1}>
        <Card
          elevation="sm"
          style={{
            background: theme.colors.midnight,
            border: `1px solid ${theme.colors.graphite}`,
            borderRadius: '12px',
            padding: theme.spacing[3],
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '14px',
              marginBottom: '8px',
            }}>
              Average Margin
            </div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '32px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}>
              {loading ? '...' : formatPercentage(data.averageMargin.value)}
            </div>
          </div>
          <div style={{ 
            color: getTrendColor(data.averageMargin.direction),
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {getTrendIcon(data.averageMargin.direction)} {data.averageMargin.trend}%
          </div>
        </Card>
      </GridItem>

      {/* Top Category */}
      <GridItem colSpan={1}>
        <Card
          elevation="sm"
          style={{
            background: theme.colors.midnight,
            border: `1px solid ${theme.colors.graphite}`,
            borderRadius: '12px',
            padding: theme.spacing[3],
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '14px',
              marginBottom: '8px',
            }}>
              Top Category
            </div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '24px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              marginBottom: '4px',
            }}>
              {loading ? '...' : data.topCategory.value}
            </div>
            <div style={{ 
              color: theme.colors.electricCyan,
              fontSize: '14px',
            }}>
              {loading ? '...' : formatPercentage(data.topCategory.percentage)}
            </div>
          </div>
        </Card>
      </GridItem>

      {/* Price Distribution */}
      <GridItem colSpan={1}>
        <Card
          elevation="sm"
          style={{
            background: theme.colors.midnight,
            border: `1px solid ${theme.colors.graphite}`,
            borderRadius: '12px',
            padding: theme.spacing[3],
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '14px',
              marginBottom: '8px',
            }}>
              Price Distribution
            </div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '24px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              marginBottom: '4px',
            }}>
              {loading ? '...' : data.priceDistribution.dominant}
            </div>
            <div style={{ 
              color: theme.colors.electricCyan,
              fontSize: '14px',
            }}>
              {loading ? '...' : formatPercentage(data.priceDistribution.percentage)}
            </div>
          </div>
        </Card>
      </GridItem>

      {/* Total Units */}
      <GridItem colSpan={1}>
        <Card
          elevation="sm"
          style={{
            background: theme.colors.midnight,
            border: `1px solid ${theme.colors.graphite}`,
            borderRadius: '12px',
            padding: theme.spacing[3],
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '14px',
              marginBottom: '8px',
            }}>
              Total Units
            </div>
            <div style={{ 
              color: theme.colors.cloudWhite,
              fontSize: '32px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}>
              {loading ? '...' : new Intl.NumberFormat().format(data.totalUnits.value)}
            </div>
          </div>
          <div style={{ 
            color: getTrendColor(data.totalUnits.direction),
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {getTrendIcon(data.totalUnits.direction)} {data.totalUnits.trend}%
          </div>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default KpiTileRow; 