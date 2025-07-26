import React from 'react';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { formatPercentage } from '../../utils/formatters';
import { TrendDirection } from '../../types';

interface AverageMarginKpiProps {
  value: number;
  trend: number;
  direction: TrendDirection;
  loading?: boolean;
}

/**
 * KPI tile displaying the average margin percentage
 */
export const AverageMarginKpi: React.FC<AverageMarginKpiProps> = ({
  value,
  trend,
  direction,
  loading = false,
}) => {
  const formattedValue = formatPercentage(value);
  const trendValue = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
  
  return (
    <KpiTile
      title="Average Margin"
      value={formattedValue}
      trend={trendValue}
      trendDirection={direction}
      loading={loading}
    />
  );
};

export default AverageMarginKpi; 