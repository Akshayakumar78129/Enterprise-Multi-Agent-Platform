import React from 'react';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { formatWithCommas, formatShortNumber } from '../../utils/formatters';
import { TrendDirection } from '../../types';

interface TotalUnitsKpiProps {
  value: number;
  trend: number;
  direction: TrendDirection;
  loading?: boolean;
}

/**
 * KPI tile displaying the total units sold
 */
export const TotalUnitsKpi: React.FC<TotalUnitsKpiProps> = ({
  value,
  trend,
  direction,
  loading = false,
}) => {
  // Format the units value based on magnitude
  const formattedValue = value >= 10000 
    ? formatShortNumber(value) 
    : formatWithCommas(value);
  
  const trendValue = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
  
  return (
    <KpiTile
      title="Total Units"
      value={formattedValue}
      trend={trendValue}
      trendDirection={direction}
      loading={loading}
    />
  );
};

export default TotalUnitsKpi; 