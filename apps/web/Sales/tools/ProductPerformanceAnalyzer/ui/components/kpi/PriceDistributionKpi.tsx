import React from 'react';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';

interface PriceDistributionKpiProps {
  dominantBand: string;
  percentage: number;
  loading?: boolean;
}

/**
 * KPI tile displaying the dominant price band
 */
export const PriceDistributionKpi: React.FC<PriceDistributionKpiProps> = ({
  dominantBand,
  percentage,
  loading = false,
}) => {
  const formattedPercentage = `${percentage.toFixed(1)}%`;
  
  return (
    <KpiTile
      title="Price Distribution"
      value={dominantBand}
      subtitle={`${formattedPercentage} of products`}
      loading={loading}
    />
  );
};

export default PriceDistributionKpi; 