// Basic placeholder components for Purchase Frequency dashboard
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Skeleton } from 'components/ui/skeleton';

interface LoadingProps {
  loading?: boolean;
}

export function FrequencyKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
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
    { label: 'Avg Purchase Frequency', value: metrics?.avgPurchaseFrequency?.toFixed(2) || '0' },
    { label: 'Avg Interval (Days)', value: metrics?.avgIntervalDays?.toFixed(1) || '0' },
    { label: 'High Frequency Customers', value: metrics?.highFrequencyCustomers || 0 },
    { label: 'Active Customers', value: metrics?.activeCustomers || 0 }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

export function FrequencyDistribution({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequency Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>{item.category} purchases</span>
              <span className="font-medium">{item.count} customers ({item.percentage?.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function IntervalAnalysis({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Intervals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Min Interval:</span>
            <span className="font-medium">{data?.min_interval?.toFixed(1) || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span>Median Interval:</span>
            <span className="font-medium">{data?.median_interval?.toFixed(1) || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span>Max Interval:</span>
            <span className="font-medium">{data?.max_interval?.toFixed(1) || 0} days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerSegments({ segments, loading }: { segments: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Segments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {segments?.map((segment, index) => (
            <div key={index} className="border rounded-lg p-3">
              <h4 className="font-medium">{segment.segmentName}</h4>
              <div className="text-sm text-muted-foreground mt-1">
                {segment.customerCount} customers | Avg: {segment.avgPurchases?.toFixed(1)} purchases
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ValuePatterns({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Value Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Avg Transaction Value:</span>
            <span className="font-medium">${data?.avg_transaction_value?.toFixed(2) || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>High Value Customers:</span>
            <span className="font-medium">{data?.high_value_customers || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Revenue:</span>
            <span className="font-medium">${data?.total_revenue?.toFixed(2) || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FrequencyTrends({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequency Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Frequency trends visualization would go here
        </div>
      </CardContent>
    </Card>
  );
}