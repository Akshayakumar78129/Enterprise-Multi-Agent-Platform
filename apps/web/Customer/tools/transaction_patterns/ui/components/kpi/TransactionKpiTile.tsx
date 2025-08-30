import React from 'react';
import { useSelector } from 'react-redux';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectTransactionStats } from '../../state/transactionSlice';
import { formatNumber } from '../../utils/formatters';

interface TransactionKpiTileProps {
  previousCount?: number;
  className?: string;
}

export const TransactionKpiTile = ({ 
  previousCount,
  className
}: TransactionKpiTileProps) => {
  const theme = useTheme();
  const stats = useSelector(selectTransactionStats);
  
  if (!stats) {
    return (
      <KpiTile
        label="Total Transactions"
        value="-"
        isLoading={true}
        className={className}
      />
    );
  }
  
  const { totalTransactions } = stats;
  let trendDirection: string = 'neutral';
  let trendValue: string | null = null;
  
  // Calculate trend compared to previous period
  if (previousCount && previousCount > 0) {
    const percentChange = ((totalTransactions - previousCount) / previousCount) * 100;
    const isPositive = percentChange > 0;
    
    // Determine if this trend is good or bad (for transactions, more is usually good)
    trendDirection = isPositive ? 'up-good' : 'down-bad';
    trendValue = `${Math.abs(percentChange).toFixed(1)}% ${isPositive ? 'increase' : 'decrease'}`;
  }
  
  return (
    <KpiTile
      label="Total Transactions"
      value={formatNumber(totalTransactions)}
      trendDirection={trendDirection}
      trendValue={trendValue}
      className={className}
    />
  );
}; 