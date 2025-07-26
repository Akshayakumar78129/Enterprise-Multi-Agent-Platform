import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ClientSidePlot } from './ClientSidePlot';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectTransactionStats, selectLoading } from '../../state/transactionSlice';
import { useChartConfigs } from '../../utils/chartHelpers';
import { formatPercentage } from '../../utils/formatters';

interface DailyVolumeDistributionProps {
  height?: number;
  width?: number;
  onBarClick?: (day: string) => void;
}

export const DailyVolumeDistribution: React.FC<DailyVolumeDistributionProps> = ({
  height = 220,
  width = 320,
  onBarClick
}) => {
  const theme = useTheme();
  const stats = useSelector(selectTransactionStats);
  const loading = useSelector(selectLoading);
  
  const chartData = useMemo(() => {
    if (!stats?.dailyDistribution || stats.dailyDistribution.length === 0) return [];
    
    // Sort days in order: Monday to Sunday
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedDistribution = [...stats.dailyDistribution].sort((a, b) => {
      if (a.day && b.day) {
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      }
      return 0;
    });
    
    const days = sortedDistribution.map(item => item.day);
    const percentages = sortedDistribution.map(item => item.percentage);
    
    // Create colors - highlight weekends
    const colors = days.map(day => {
      if (day === 'Saturday' || day === 'Sunday') {
        return theme.colors.signalMagenta;
      }
      return theme.colors.electricCyan;
    });
    
    return [{
      type: 'bar',
      orientation: 'h',
      x: percentages,
      y: days,
      marker: {
        color: colors
      },
      text: percentages.map(p => formatPercentage(p)),
      textposition: 'auto',
      hovertemplate: '<b>%{y}</b><br>%{text} of transactions<extra></extra>'
    }];
  }, [stats, theme]);
  
  const handleClick = (event: any) => {
    if (onBarClick && event.points && event.points[0]) {
      const point = event.points[0];
      onBarClick(point.y);
    }
  };
  
  return (
    <Card 
      title="Daily Volume Distribution"
      isLoading={loading}
      elevation="md"
    >
      {stats?.dailyDistribution && stats.dailyDistribution.length > 0 && (
        <ClientSidePlot
          data={chartData}
          layout={{
            height,
            width,
            margin: { l: 100, r: 20, t: 10, b: 40 },
            paper_bgcolor: theme.colors.graphite,
            plot_bgcolor: theme.colors.graphite,
            font: { 
              family: theme.typography.fontFamily,
              color: theme.colors.cloudWhite 
            },
            xaxis: {
              title: 'Percentage of Transactions',
              tickformat: ',.0%',
              gridcolor: theme.colors.graphiteDark,
              zerolinecolor: theme.colors.graphiteDark
            },
            yaxis: {
              automargin: true,
              gridcolor: theme.colors.graphiteDark,
              zerolinecolor: theme.colors.graphiteDark
            },
            bargap: 0.3
          }}
          onClick={handleClick}
        />
      )}
    </Card>
  );
}; 