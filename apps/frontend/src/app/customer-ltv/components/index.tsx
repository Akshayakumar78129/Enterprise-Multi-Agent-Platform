import React from 'react';
import { Card, Skeleton } from 'components/index';

export function LtvKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    { label: 'Average LTV', value: `$${metrics?.avgLtv?.toLocaleString() || '0'}` },
    { label: 'Total Value', value: `$${metrics?.totalValue?.toLocaleString() || '0'}` },
    { label: 'High Value', value: metrics?.highValueCount || 0 },
    { label: 'LTV Growth', value: `${metrics?.ltvGrowth || 0}%` }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="p-6">
          <div className="text-sm font-medium text-muted-foreground">{kpi.label}</div>
          <div className="text-2xl font-bold">{kpi.value}</div>
        </Card>
      ))}
    </div>
  );
}

export function LtvDistribution({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">LTV Distribution</h3>
        <div className="text-sm text-muted-foreground">
          Customer lifetime value distribution chart would go here
        </div>
      </div>
    </Card>
  );
}

export function SegmentAnalysis({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Segment Analysis</h3>
        <div className="text-sm text-muted-foreground">
          LTV by customer segment analysis would go here
        </div>
      </div>
    </Card>
  );
}

export function LtvTrends({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">LTV Trends</h3>
        <div className="text-sm text-muted-foreground">
          Lifetime value trends over time would go here
        </div>
      </div>
    </Card>
  );
}

export function TopCustomers({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Customers by LTV</h3>
        <div className="text-sm text-muted-foreground">
          Top customers ranked by lifetime value would go here
        </div>
      </div>
    </Card>
  );
}