import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from '@/lib/rechartsSetup';
/**
 * Purchase Interval Chart
 * Shows distribution of days between customer purchases
 */

import React from 'react';
import { ChartCard, getShiftClickManager } from 'components/index';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <p className="text-foreground font-semibold mb-2">{data.name}</p>
        <p className="text-cyan-400">Customers: {data.value?.toLocaleString()}</p>
        <p className="text-green-400">Percentage: {data.percentage?.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

interface PurchaseIntervalChartProps {
  data: Array<{
    interval_days: string;
    customer_count: number;
    percentage: number;
  }>;
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Custom label component with smart positioning to avoid overlap
const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percentage, name, index } = props;

  const RADIAN = Math.PI / 180;

  // Smart spacing: very small slices pushed much further out
  let labelRadius;
  if (percentage < 2) {
    labelRadius = outerRadius * 1.55; // Very small - push far out
  } else if (percentage < 5) {
    labelRadius = outerRadius * 1.35; // Small - push moderately out
  } else {
    labelRadius = outerRadius * 1.2; // Normal spacing
  }

  let x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  let y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

  // Vertical offset for very small adjacent slices to prevent overlap
  // Apply offset based on index for slices < 2%
  if (percentage < 2) {
    // Offset alternating small slices up/down
    const offset = index % 2 === 0 ? -8 : 8;
    y += offset;
  } else if (percentage < 5) {
    // Smaller offset for medium-small slices
    const offset = index % 2 === 0 ? -4 : 4;
    y += offset;
  }

  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <text
      x={x}
      y={y}
      fill="#475569"
      textAnchor={textAnchor}
      dominantBaseline="central"
      fontSize={percentage < 2 ? '10px' : '12px'}
      fontWeight="500"
    >
      {`${name}: ${percentage.toFixed(1)}%`}
    </text>
  );
};

export function PurchaseIntervalChart({ data, loading }: PurchaseIntervalChartProps) {
  const shiftClickManager = getShiftClickManager();

  console.log('PurchaseIntervalChart - loading:', loading, 'data:', data, 'data.length:', data?.length);

  if (loading) {
    return <div className="h-[400px] animate-pulse bg-muted rounded-lg" />;
  }

  if (!data || data.length === 0) {
    console.log('PurchaseIntervalChart - SHOWING EMPTY STATE');
    return (
      <div className="h-[400px] flex items-center justify-center bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">No purchase interval data available</p>
      </div>
    );
  }

  console.log('PurchaseIntervalChart - RENDERING CHART with', data.length, 'intervals');

  // Transform data for pie chart
  const chartData = data.map(d => ({
    name: `${d.interval_days} days`,
    value: d.customer_count,
    percentage: d.percentage
  }));

  console.log('PurchaseIntervalChart - chartData:', chartData);

  return (
    <ChartCard
      className="h-[400px]"
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: 'Purchase Intervals',
          value: `${data.reduce((sum, d) => sum + d.customer_count, 0)} customers analyzed`,
          source: 'Purchase Frequency - Intervals'
        }, event.nativeEvent);
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={{
              stroke: '#94a3b8',
              strokeWidth: 1
            }}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => {
              const entry = chartData.find(d => d.name === value);
              return `${value} (${entry?.percentage.toFixed(1)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
