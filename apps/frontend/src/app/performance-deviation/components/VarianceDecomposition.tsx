import React, { useMemo } from 'react';
import {
  ChartCard,
  Skeleton,
  Badge
} from 'components';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface VarianceDecompositionProps {
  data: any;
  loading?: boolean;
}

const COLORS = [
  '#00E0FF', // Electric Cyan
  '#9333EA', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#6B7280'  // Gray
];

export function VarianceDecomposition({
  data,
  loading
}: VarianceDecompositionProps) {
  const components = data?.components || [];

  // Transform data for pie chart - MUST be before any conditional returns
  const chartData = useMemo(() =>
    components.map((comp: any, index: number) => ({
      name: comp.name,
      value: (comp.share * 100),
      color: COLORS[index % COLORS.length]
    })), [components]);

  // Loading state - AFTER all hooks
  if (loading) {
    return (
      <ChartCard className="glass-card card-hover">
        <Skeleton height={400} />
      </ChartCard>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground">
            {payload[0].name}
          </p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value.toFixed(1)}% of variance
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    if (entry.value < 5) return null; // Don't show label for small slices
    return `${entry.value.toFixed(0)}%`;
  };

  return (
    <ChartCard
      title="Variance Decomposition"
      className="glass-card card-hover"
    >
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string, entry: any) => (
                <span className="text-sm">
                  {value} ({entry.payload.value.toFixed(1)}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats - Center Aligned */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-accent/5 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Explained Variance</p>
          <p className="text-lg font-semibold text-accent">
            {components
              .filter((c: any) => c.name !== 'Unexplained/Noise' && c.name !== 'Noise / Unexplained')
              .reduce((sum: number, c: any) => sum + c.share * 100, 0)
              .toFixed(1)}%
          </p>
        </div>
        <div className="bg-muted/10 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Unexplained</p>
          <p className="text-lg font-semibold text-muted-foreground">
            {components
              .filter((c: any) => c.name === 'Unexplained/Noise' || c.name === 'Noise / Unexplained')
              .reduce((sum: number, c: any) => sum + c.share * 100, 0)
              .toFixed(1)}%
          </p>
        </div>
      </div>
    </ChartCard>
  );
}