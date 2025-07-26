import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ClientSidePlot } from './ClientSidePlot';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectTransactionStats, selectLoading } from '../../state/transactionSlice';
import { useChartConfigs } from '../../utils/chartHelpers';
import { formatPercentage } from '../../utils/formatters';

interface PaymentMethodDistributionProps {
  height?: number;
  width?: number;
  onSegmentClick?: (method: string) => void;
}

export const PaymentMethodDistribution: React.FC<PaymentMethodDistributionProps> = ({
  height = 280,
  width = 280,
  onSegmentClick
}) => {
  const theme = useTheme();
  const { donutChartLayout, colorScales, hoverTemplates } = useChartConfigs();
  const stats = useSelector(selectTransactionStats);
  const loading = useSelector(selectLoading);
  
  const chartData = useMemo(() => {
    if (!stats?.paymentDistribution || stats.paymentDistribution.length === 0) return [];
    
    // Extract payment methods and percentages
    const methods = stats.paymentDistribution.map(item => item.method);
    const percentages = stats.paymentDistribution.map(item => item.percentage);
    
    // Generate color gradient based on the number of payment methods
    const colors = Array.from({ length: methods.length }, (_, i) => {
      const index = i / (methods.length - 1 || 1);
      // Create a shade of Electric Cyan
      const r = Math.round(0 + index * 0);
      const g = Math.round(224 + index * (-100));
      const b = Math.round(255 + index * (-50));
      return `rgb(${r}, ${g}, ${b})`;
    });
    
    return [{
      type: 'pie',
      labels: methods,
      values: percentages,
      hole: 0.4,
      marker: {
        colors: colors
      },
      textinfo: 'label+percent',
      textposition: 'outside',
      textfont: {
        color: theme.colors.cloudWhite,
        size: 12
      },
      hovertemplate: hoverTemplates.donut
    }];
  }, [stats, theme, hoverTemplates]);
  
  const handleClick = (event: any) => {
    if (onSegmentClick && event.points && event.points[0]) {
      const point = event.points[0];
      onSegmentClick(point.label);
    }
  };
  
  return (
    <Card 
      title="Payment Method Distribution"
      isLoading={loading}
      elevation="md"
    >
      {stats?.paymentDistribution && stats.paymentDistribution.length > 0 && (
        <ClientSidePlot
          data={chartData}
          layout={{
            ...donutChartLayout,
            height,
            width
          }}
          onClick={handleClick}
        />
      )}
    </Card>
  );
}; 