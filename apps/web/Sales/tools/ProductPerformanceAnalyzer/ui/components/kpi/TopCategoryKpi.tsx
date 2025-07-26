import React from 'react';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { truncateText } from '../../utils/formatters';

interface TopCategoryKpiProps {
  category: string;
  percentage: number;
  loading?: boolean;
}

/**
 * KPI tile displaying the top performing category
 */
export const TopCategoryKpi: React.FC<TopCategoryKpiProps> = ({
  category,
  percentage,
  loading = false,
}) => {
  const formattedCategory = truncateText(category, 18);
  const formattedPercentage = `${percentage.toFixed(1)}%`;
  
  return (
    <KpiTile
      title="Top Category"
      value={formattedCategory}
      subtitle={`${formattedPercentage} of total sales`}
      loading={loading}
    />
  );
};

export default TopCategoryKpi; 