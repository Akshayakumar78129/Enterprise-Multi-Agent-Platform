import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from '@/lib/rechartsSetup';
import React from 'react';
import { Card } from 'components/index';
interface LifecycleStagesProps {
  data: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  loading?: boolean;
}

const LIFECYCLE_COLORS: Record<string, string> = {
  'Active': '#10b981',
  'Engaged': '#3b82f6',
  'At Risk': '#f59e0b',
  'Dormant': '#ef4444',
  'Lost': '#991b1b'
};

export function LifecycleStages({ data, loading }: LifecycleStagesProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-32 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No lifecycle data available
        </div>
      </Card>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ stage, percentage }) => `${stage} customers (${percentage.toFixed(1)}%)`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={LIFECYCLE_COLORS[entry.stage] || '#6366f1'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          labelStyle={{
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            marginBottom: '4px'
          }}
          itemStyle={{
            color: 'hsl(var(--foreground))',
            padding: '2px 0'
          }}
          formatter={(value: number, name: string, props: any) => [
            `${value} customers (${props.payload.percentage.toFixed(1)}%)`,
            props.payload.stage
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
