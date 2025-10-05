// Transaction Patterns dashboard components
import React from 'react';
import {
  Card,
  Skeleton,
  FilterBar,
  DashboardSection,
  ChartCard,
  KPIRow,
  AnimatedKPITile
} from 'components';

interface LoadingProps {
  loading?: boolean;
}

// Export all transaction pattern components
export { TransactionFilters } from './TransactionFilters';
export { TemporalHeatmap } from './TemporalHeatmap';
export { DualAxisTimeSeries } from './DualAxisTimeSeries';
export { AmountDistribution } from './AmountDistribution';
export { ProductMatrix } from './ProductMatrix';

export function PatternKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  if (loading) {
    return (
      <KPIRow
        kpis={[...Array(4)].map(() => ({
          title: '',
          value: '',
          loading: true
        }))}
      />
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const kpis = [
    {
      id: 'total-transactions',
      title: 'Total Transactions',
      value: formatNumber(metrics?.totalTransactions || 0),
      change: metrics?.transactionGrowth || 0,
      trend: metrics?.transactionGrowth > 0 ? 'up' : 'down' as const,
      subtitle: formatCurrency(metrics?.totalAmount || 0) + ' total value'
    },
    {
      id: 'anomaly-rate',
      title: 'Anomaly Rate',
      value: `${(metrics?.anomalyRate || 0).toFixed(1)}%`,
      change: metrics?.anomalyChange || 0,
      trend: metrics?.anomalyChange < 0 ? 'up' : 'down' as const,
      subtitle: 'Unusual patterns detected'
    },
    {
      id: 'avg-transaction',
      title: 'Avg Transaction',
      value: formatCurrency(metrics?.avgTransactionValue || 0),
      change: metrics?.avgValueChange || 0,
      trend: metrics?.avgValueChange > 0 ? 'up' : 'down' as const
    },
    {
      id: 'peak-hour',
      title: 'Peak Hour',
      value: metrics?.peakHour ? `${metrics.peakHour}:00` : '14:00',
      change: 0,
      trend: 'neutral' as const,
      subtitle: 'Highest transaction volume'
    }
  ];

  return <KPIRow kpis={kpis} />;
}

export function TemporalPatterns({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card title="Temporal Patterns">
      <div>Transaction timing patterns visualization</div>
    </Card>
  );
}

export function ProductCombinations({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card title="Product Combinations">
      <div>Frequently bought together analysis</div>
    </Card>
  );
}

export function AnomalyDetection({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card title="Anomaly Detection">
      <div>Unusual transaction patterns</div>
    </Card>
  );
}

export function PaymentMethods({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card title="Payment Methods">
      <div>Payment method distribution</div>
    </Card>
  );
}

export function PatternTrends({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card title="Pattern Trends">
      <div>Transaction pattern trends over time</div>
    </Card>
  );
}