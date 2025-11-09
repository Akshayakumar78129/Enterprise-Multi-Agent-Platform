import React from 'react';
import { Card } from 'components/index';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis, Label } from 'recharts';

interface ValueRiskMatrixProps {
  data: Array<{
    valueSegment: string;
    riskSegment: string;
    count: number;
    totalValue: number;
    priority: string;
  }>;
  loading?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  'Critical': '#ef4444',
  'High': '#f59e0b',
  'Medium': '#3b82f6',
  'Low': '#10b981'
};

export function ValueRiskMatrix({ data, loading }: ValueRiskMatrixProps) {
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
          No matrix data available
        </div>
      </Card>
    );
  }

  // Transform data for scatter plot
  const scatterData = data.map(item => ({
    x: item.riskSegment === 'Low Risk' ? 1 : item.riskSegment === 'Medium Risk' ? 2 : 3,
    y: item.valueSegment === 'Low Value' ? 1 : item.valueSegment === 'Medium Value' ? 2 : 3,
    z: item.count,
    count: item.count,
    value: item.totalValue,
    priority: item.priority,
    label: `${item.valueSegment} / ${item.riskSegment}`
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, left: 60, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            dataKey="x"
            name="Risk Level"
            domain={[0, 4]}
            ticks={[1, 2, 3]}
            tickFormatter={(value) => value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'}
            className="text-xs"
          >
            <Label value="Risk Level" offset={-5} position="insideBottom" style={{ fill: 'hsl(var(--foreground))' }} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            name="Value Segment"
            domain={[0, 4]}
            ticks={[1, 2, 3]}
            tickFormatter={(value) => value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'}
            className="text-xs"
          >
            <Label value="Customer Value" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'hsl(var(--foreground))' }} />
          </YAxis>
          <ZAxis type="number" dataKey="z" range={[100, 1000]} />
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
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: any, name: string, props: any) => {
              if (name === 'count') return [`${value} customers`, 'Count'];
              if (name === 'value') return [`$${value.toLocaleString()}`, 'Total Value'];
              if (name === 'priority') return [value, 'Priority'];
              return [value, name];
            }}
          />
          <Scatter data={scatterData}>
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#6366f1'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
        {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
          <div key={priority} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{priority} Priority</span>
          </div>
        ))}
      </div>
    </div>
  );
}
