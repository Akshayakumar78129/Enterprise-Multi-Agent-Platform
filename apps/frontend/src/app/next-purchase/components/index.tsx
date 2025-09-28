// Basic placeholder components for Next Purchase dashboard
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Skeleton } from 'components/ui/skeleton';

export function PredictionKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
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
    { label: 'Predictions Made', value: metrics?.totalPredictions || 0 },
    { label: 'High Probability', value: metrics?.highProbability || 0 },
    { label: 'Avg Days to Purchase', value: metrics?.avgDays || '0' },
    { label: 'Model Accuracy', value: metrics?.accuracy || '0%' }
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

export function NextPurchasePredictions({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Purchase Predictions</CardTitle></CardHeader>
      <CardContent><div>ML-powered next purchase predictions</div></CardContent>
    </Card>
  );
}

export function PurchaseProbability({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Purchase Probability</CardTitle></CardHeader>
      <CardContent><div>Probability distribution of purchases</div></CardContent>
    </Card>
  );
}

export function RecommendedProducts({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Product Recommendations</CardTitle></CardHeader>
      <CardContent><div>Recommended products for customers</div></CardContent>
    </Card>
  );
}

export function TimingForecast({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Timing Forecast</CardTitle></CardHeader>
      <CardContent><div>When customers are likely to purchase</div></CardContent>
    </Card>
  );
}

export function PredictionAccuracy({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Model Performance</CardTitle></CardHeader>
      <CardContent><div>Prediction accuracy metrics</div></CardContent>
    </Card>
  );
}