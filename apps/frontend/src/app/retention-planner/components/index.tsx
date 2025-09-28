// Basic placeholder components for Retention Planner dashboard
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Skeleton } from 'components/ui/skeleton';

export function RetentionKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
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
    { label: 'Retention Rate', value: metrics?.retentionRate || '0%' },
    { label: 'At Risk Customers', value: metrics?.atRisk || 0 },
    { label: 'Retention Value', value: metrics?.retentionValue || '$0' },
    { label: 'Campaign ROI', value: metrics?.campaignROI || '0%' }
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

export function RetentionStrategies({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Retention Strategies</CardTitle></CardHeader>
      <CardContent><div>Recommended retention strategies</div></CardContent>
    </Card>
  );
}

export function ChurnRiskAnalysis({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Churn Risk Analysis</CardTitle></CardHeader>
      <CardContent><div>Customers at risk of churning</div></CardContent>
    </Card>
  );
}

export function CustomerLifecycle({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Customer Lifecycle</CardTitle></CardHeader>
      <CardContent><div>Customer lifecycle analysis</div></CardContent>
    </Card>
  );
}

export function RetentionCampaigns({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Retention Campaigns</CardTitle></CardHeader>
      <CardContent><div>Active and planned retention campaigns</div></CardContent>
    </Card>
  );
}

export function ROIProjections({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>ROI Projections</CardTitle></CardHeader>
      <CardContent><div>Expected ROI from retention efforts</div></CardContent>
    </Card>
  );
}