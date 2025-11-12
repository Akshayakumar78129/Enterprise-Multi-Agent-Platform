import { Bar, BarChart, CartesianGrid, Cell, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/rechartsSetup';
import React from 'react';
import { Card } from 'components/index';
interface ChurnRiskGaugeProps {
  data: Array<{
    riskLevel: string;
    count: number;
    percentage: number;
  }>;
  loading?: boolean;
}

const RISK_COLORS: Record<string, string> = {
  'Low Risk': '#10b981',
  'Medium Risk': '#f59e0b',
  'High Risk': '#ef4444',
  'Critical Risk': '#991b1b'
};

export function ChurnRiskGauge({ data, loading }: ChurnRiskGaugeProps) {
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
          No risk data available
        </div>
      </Card>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="riskLevel" className="text-xs">
          <Label value="Risk Level" offset={-5} position="insideBottom" style={{ fill: 'hsl(var(--foreground))' }} />
        </XAxis>
        <YAxis className="text-xs">
          <Label value="Number of Customers" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'hsl(var(--foreground))' }} />
        </YAxis>
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
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
          formatter={(value: number, name: string, props: any) => [
            `${value} customers (${props.payload.percentage.toFixed(1)}%)`,
            'Risk Level'
          ]}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.riskLevel] || '#6366f1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
