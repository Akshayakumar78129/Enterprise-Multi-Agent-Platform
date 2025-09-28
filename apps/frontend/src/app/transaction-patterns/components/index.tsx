// Basic placeholder components for Transaction Patterns dashboard
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Skeleton } from 'components/ui/skeleton';

interface LoadingProps {
  loading?: boolean;
}

export function PatternKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
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
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground">{kpi.label}</div>
            <div className="text-2xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TemporalPatterns({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Temporal Patterns</CardTitle></CardHeader>
      <CardContent><div>Transaction timing patterns visualization</div></CardContent>
    </Card>
  );
}

export function ProductCombinations({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Product Combinations</CardTitle></CardHeader>
      <CardContent><div>Frequently bought together analysis</div></CardContent>
    </Card>
  );
}

export function AnomalyDetection({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Anomaly Detection</CardTitle></CardHeader>
      <CardContent><div>Unusual transaction patterns</div></CardContent>
    </Card>
  );
}

export function PaymentMethods({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
      <CardContent><div>Payment method distribution</div></CardContent>
    </Card>
  );
}

export function PatternTrends({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Pattern Trends</CardTitle></CardHeader>
      <CardContent><div>Transaction pattern trends over time</div></CardContent>
    </Card>
  );
}