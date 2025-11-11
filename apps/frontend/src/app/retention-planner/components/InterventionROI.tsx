import { Bar, BarChart, CartesianGrid, Label, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/rechartsSetup';
import React from 'react';
import { Card } from 'components/index';
interface InterventionROIProps {
  data: Array<{
    strategy: string;
    targetSegment: string;
    cost: number;
    expectedRevenue: number;
    roi: number;
    successRate: number;
  }>;
  loading?: boolean;
}

export function InterventionROI({ data, loading }: InterventionROIProps) {
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
          No ROI data available
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col">
      <ResponsiveContainer width="100%" height={480}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 70, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="strategy" className="text-xs" height={60}>
            <Label value="Intervention Strategy" offset={10} position="insideBottom" style={{ fill: 'hsl(var(--foreground))' }} />
          </XAxis>
          <YAxis className="text-xs">
            <Label value="Amount ($)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'hsl(var(--foreground))' }} />
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
            formatter={(value: number, name: string) => {
              if (name === 'roi') return [`${value.toFixed(1)}x`, 'ROI'];
              return [`$${value.toLocaleString()}`, name];
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{
              color: 'hsl(var(--foreground))',
              paddingBottom: '10px'
            }}
          />
          <Bar dataKey="cost" fill="#ef4444" name="Cost" radius={[8, 8, 0, 0]} />
          <Bar dataKey="expectedRevenue" fill="#10b981" name="Expected Revenue" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {data.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex justify-between p-2 bg-muted/50 rounded">
            <span className="font-medium">{item.strategy}</span>
            <span className="text-muted-foreground">{item.roi.toFixed(1)}x ROI</span>
          </div>
        ))}
      </div>
    </div>
  );
}
