// Customer Insights dashboard components
import React from 'react';
import { Card, Skeleton } from 'components/index';

// Placeholder sub-components for Card (to be properly implemented later)
const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);
const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);
const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={className}>{children}</h3>
);

export function InsightKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
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
    { label: 'Total Customers', value: metrics?.totalCustomers?.toLocaleString() || '0' },
    { label: 'Avg Engagement Score', value: metrics?.averageEngagement?.toFixed(1) || '0' },
    { label: 'Top Performers', value: metrics?.topPerformers || 0 },
    { label: 'Insight Accuracy', value: metrics?.insightAccuracy || '0%' }
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

export function EngagementOverview({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Levels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-green-600">High Engagement</span>
            <span className="font-medium">{data?.high || 0} customers</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-600">Medium Engagement</span>
            <span className="font-medium">{data?.medium || 0} customers</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-orange-600">Low Engagement</span>
            <span className="font-medium">{data?.low || 0} customers</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-red-600">Very Low Engagement</span>
            <span className="font-medium">{data?.veryLow || 0} customers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomerProfiles({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Segments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data?.map((profile, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{profile.segment}</h4>
                  <p className="text-sm text-muted-foreground">{profile.count} customers</p>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{profile.value}</div>
                  <div className="text-xs text-muted-foreground">Total Value</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function BehaviorInsights({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavior Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Key Trends</h4>
            <ul className="space-y-1">
              {data?.trends?.map((trend: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">• {trend}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Usage Patterns</h4>
            <ul className="space-y-1">
              {data?.patterns?.map((pattern: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">• {pattern}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Recommendations({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.map((recommendation: string, index: number) => (
            <div key={index} className="border-l-4 border-blue-500 pl-3">
              <p className="text-sm">{recommendation}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendAnalysis({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Customer engagement trends and patterns visualization would go here
        </div>
      </CardContent>
    </Card>
  );
}