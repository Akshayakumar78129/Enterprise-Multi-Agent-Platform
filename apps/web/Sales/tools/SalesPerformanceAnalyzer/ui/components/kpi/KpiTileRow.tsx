import React, { FC } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { SalesKpiData } from '../../types';
// import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'; // Assuming heroicons are available

interface KpiTileProps {
  title: string;
  value: string | number;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  visual?: React.ReactNode; // For sparklines, gauges etc.
  stateColors?: { up: string; down: string; neutral: string };
}

const KpiTile: FC<KpiTileProps> = ({
  title,
  value,
  trend,
  trendDirection,
  subtitle,
  visual,
  stateColors = { up: 'electricCyan', down: 'signalMagenta', neutral: 'cloudWhite' }
}) => {
  const theme = useTheme();
  const trendColor = trendDirection === 'up' ? theme.colors[stateColors.up] : 
                     trendDirection === 'down' ? theme.colors[stateColors.down] :
                     theme.colors[stateColors.neutral];

  return (
    <Card 
      elevation="sm" 
      style={{
        padding: theme.spacing[3],
        textAlign: 'center',
        background: theme.colors.graphiteDark,
        minHeight: '120px', // As per spec
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ fontSize: '14px', color: theme.colors.cloudWhite, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: '32px', fontWeight: '600', color: theme.colors.cloudWhite }}>{value}</div>
      {subtitle && <div style={{ fontSize: '12px', color: theme.colors.cloudWhite, opacity: 0.7 }}>{subtitle}</div>}
      {trend !== undefined && trendDirection && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: trendColor }}>
          {trendDirection === 'up' && <span style={{ marginRight: theme.spacing[1] }}>↑</span>}
          {trendDirection === 'down' && <span style={{ marginRight: theme.spacing[1] }}>↓</span>}
          {trend.toFixed(2)}%
        </div>
      )}
      {visual && <div style={{ marginTop: theme.spacing[1] }}>{visual}</div>}
    </Card>
  );
};

interface KpiTileRowProps {
  data: SalesKpiData;
  loading: boolean;
}

export const KpiTileRow: FC<KpiTileRowProps> = ({ data, loading }) => {
  const theme = useTheme();

  if (loading) {
    return <div style={{color: theme.colors.cloudWhite, textAlign: 'center', padding: theme.spacing[4]}}>Loading KPIs...</div>;
  }
  
  const mockSparkline = <div style={{height: '20px', background: theme.colors.graphite, width: '80%', margin: 'auto'}} />; 
  const mockBarChart = <div style={{height: '20px', background: theme.colors.graphite, width: '80%', margin: 'auto'}} />;
  const mockGauge = <div style={{height: '20px', background: theme.colors.graphite, width: '80%', margin: 'auto'}} />;

  return (
    <Grid columns={5} gap="md">
      <GridItem>
        <KpiTile 
          title="Total Revenue" 
          value={`$${(data.totalRevenue.value / 1000000).toFixed(1)}M`}
          trend={data.totalRevenue.trend * 100}
          trendDirection={data.totalRevenue.direction}
          visual={mockSparkline}
        />
      </GridItem>
      <GridItem>
        <KpiTile 
          title="Units Sold" 
          value={data.totalUnitsSold.value.toLocaleString()}
          trend={data.totalUnitsSold.trend * 100}
          trendDirection={data.totalUnitsSold.direction}
          visual={mockBarChart}
        />
      </GridItem>
      <GridItem>
        <KpiTile 
          title="Avg. Order Value" 
          value={`$${data.averageOrderValue.value.toFixed(2)}`}
          trend={data.averageOrderValue.trend * 100}
          trendDirection={data.averageOrderValue.direction}
          visual={mockGauge}
        />
      </GridItem>
      <GridItem>
        <KpiTile 
          title="Profit Margin" 
          subtitle="Gross Margin"
          value={`${(data.conversionRate.value * 100).toFixed(1)}%`} // Using conversionRate for Profit Margin from SalesKpiData
                                                              // TODO: Add actual profitMargin to SalesKpiData if available
          trend={data.conversionRate.trend * 100} // Using conversionRate trend as placeholder
          trendDirection={data.conversionRate.direction} // Using conversionRate direction as placeholder
          visual={mockGauge}
        />
      </GridItem>
      <GridItem>
        <KpiTile 
          title="Top Performer" 
          value={data.topPerformingRegion.value}
          subtitle={`${(data.topPerformingRegion.percentage * 100).toFixed(0)}% of total`}
          visual={mockBarChart}
        />
      </GridItem>
    </Grid>
  );
}; 