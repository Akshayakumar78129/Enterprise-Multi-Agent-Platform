// Basic placeholder components for Transaction Patterns dashboard
import React from 'react';
import { Card, Skeleton } from 'components';

interface LoadingProps {
  loading?: boolean;
}

export function PatternKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    { label: 'Total Transactions', value: metrics?.totalTransactions || 0 },
    { label: 'Pattern Anomalies', value: metrics?.anomalyRate || '0%' },
    { label: 'Frequent Patterns', value: metrics?.frequentPatterns || 0 },
    { label: 'Peak Hours', value: metrics?.peakHours || 'N/A' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index}>
          <div className="text-sm font-medium text-muted-foreground">{kpi.label}</div>
          <div className="text-2xl font-bold">{kpi.value}</div>
        </Card>
      ))}
    </div>
  );
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