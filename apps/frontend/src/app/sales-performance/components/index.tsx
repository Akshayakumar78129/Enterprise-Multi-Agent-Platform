// Sales Performance dashboard components
import React from 'react';
import { Card, Skeleton } from 'components/index';

export function SalesKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
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
    { label: 'Total Sales', value: `$${(metrics?.totalRevenue || 0).toLocaleString()}` },
    { label: 'Units Sold', value: (metrics?.totalUnits || 0).toLocaleString() },
    { label: 'Avg Order Value', value: `$${(metrics?.avgOrderValue || 0).toFixed(2)}` },
    { label: 'Customers', value: (metrics?.uniqueCustomers || 0).toLocaleString() }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index}>
          <div className="text-sm font-medium text-muted-foreground">{kpi.label}</div>
          <div className="text-2xl font-bold mt-2">{kpi.value}</div>
        </Card>
      ))}
    </div>
  );
}

export function SalesOverview({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="text-lg font-semibold mb-4">Sales Overview</div>
      <div className="text-sm text-muted-foreground">
        Sales overview metrics and trends would go here
      </div>
    </Card>
  );
}

export function TopProducts({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="text-lg font-semibold mb-4">Top Products</div>
      <div className="text-sm text-muted-foreground">
        Top performing products list would go here
      </div>
    </Card>
  );
}

export function SalesTeamPerformance({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="text-lg font-semibold mb-4">Team Performance</div>
      <div className="text-sm text-muted-foreground">
        Sales team performance metrics would go here
      </div>
    </Card>
  );
}

export function SalesTargets({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="text-lg font-semibold mb-4">Sales Targets</div>
      <div className="text-sm text-muted-foreground">
        Sales targets vs actual performance would go here
      </div>
    </Card>
  );
}

export function RevenueTrends({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="text-lg font-semibold mb-4">Revenue Trends</div>
      <div className="text-sm text-muted-foreground">
        Revenue trends visualization would go here
      </div>
    </Card>
  );
}