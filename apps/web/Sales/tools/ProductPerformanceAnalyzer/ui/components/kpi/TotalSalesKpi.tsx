import React from 'react';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { formatCurrency, formatShortNumber } from '../../utils/formatters';
import { TrendDirection } from '../../types';

interface TotalSalesKpiProps {
  value: number;
  trend: number;
  direction: TrendDirection;
  loading?: boolean;
}

/**
 * KPI tile displaying the total sales metric
 */
export const TotalSalesKpi: React.FC<TotalSalesKpiProps> = ({
  value,
  trend,
  direction,
  loading = false,
}) => {
  // Format the sales value based on magnitude
  const formattedValue = value >= 10000 
    ? formatShortNumber(value) 
    : formatCurrency(value);
  
  const trendValue = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
  
  return (
    <KpiTile
      title="Total Sales"
      value={formattedValue}
      trend={trendValue}
      trendDirection={direction}
      loading={loading}
    />
  );
};

export default TotalSalesKpi; 