// Basic placeholder components for Engagement Classifier dashboard
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Skeleton } from 'components/ui/skeleton';

export function EngagementKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
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
    { label: 'Total Customers', value: metrics?.totalCustomers || 0 },
    { label: 'Highly Engaged', value: metrics?.highEngagement || 0 },
    { label: 'At Risk', value: metrics?.atRisk || 0 },
    { label: 'Avg Engagement Score', value: metrics?.avgScore || '0' }
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

export function EngagementDistribution({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Engagement Distribution</CardTitle></CardHeader>
      <CardContent><div>Customer engagement level distribution</div></CardContent>
    </Card>
  );
}

export function CustomerClassification({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Customer Classification</CardTitle></CardHeader>
      <CardContent><div>ML-based customer classification</div></CardContent>
    </Card>
  );
}

export function EngagementScore({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Engagement Scoring</CardTitle></CardHeader>
      <CardContent><div>Customer engagement scoring model</div></CardContent>
    </Card>
  );
}

export function ActionableInsights({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Actionable Insights</CardTitle></CardHeader>
      <CardContent><div>Recommendations for improving engagement</div></CardContent>
    </Card>
  );
}

export function EngagementTrends({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Engagement Trends</CardTitle></CardHeader>
      <CardContent><div>Engagement trends over time</div></CardContent>
    </Card>
  );
}