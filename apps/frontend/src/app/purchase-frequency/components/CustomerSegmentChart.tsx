import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/rechartsSetup';
/**
 * Customer Segmentation Chart
 * Shows customer distribution across RFM segments
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
        <p className="text-foreground font-semibold mb-2">{data.segment}</p>
        <p className="text-cyan-400">Customers: {data.customer_count?.toLocaleString()}</p>
        <p className="text-green-400">Avg Frequency: {data.avg_frequency?.toFixed(2)}</p>
        <p className="text-yellow-400">Total Revenue: ${(data.total_revenue / 1000000)?.toFixed(2)}M</p>
      </div>
    );
  }
  return null;
};

interface CustomerSegmentChartProps {
  data: Array<{
    segment: string;
    customer_count: number;
    avg_frequency: number;
    avg_customer_value: number;
    total_revenue: number;
  }>;
  loading?: boolean;
}

const COLORS = {
  'High Value / High Frequency': '#10b981',
  'High Value / Low Frequency': '#f59e0b',
  'Low Value / High Frequency': '#3b82f6',
  'Low Value / Low Frequency': '#ef4444',
};

export function CustomerSegmentChart({ data, loading }: CustomerSegmentChartProps) {
  const shiftClickManager = getShiftClickManager();

  console.log('CustomerSegmentChart - loading:', loading, 'data:', data, 'data.length:', data?.length);

  if (loading) {
    return <div className="h-[400px] animate-pulse bg-muted rounded-lg" />;
  }

  if (!data || data.length === 0) {
    console.log('CustomerSegmentChart - SHOWING EMPTY STATE');
    return (
      <div className="h-[400px] flex items-center justify-center bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">No segmentation data available</p>
      </div>
    );
  }

  console.log('CustomerSegmentChart - RENDERING CHART with', data.length, 'segments');

  // Transform data for better display
  const chartData = data.map(d => ({
    ...d,
    name: d.segment.replace(' / ', '\n'),
    revenue_millions: (d.total_revenue / 1000000).toFixed(2)
  }));

  console.log('CustomerSegmentChart - chartData:', chartData);

  return (
    <ChartCard
      className="h-[400px]"
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: 'Customer Segmentation',
          value: `${data.length} segments with ${data.reduce((sum, d) => sum + d.customer_count, 0)} customers`,
          source: 'Purchase Frequency - Segmentation'
        }, event.nativeEvent);
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 30, right: 50, left: 50, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis
            dataKey="segment"
            stroke="#64748b"
            interval={0}
            angle={0}
            height={50}
            style={{ fontSize: '10px', fill: '#475569' }}
            label={{ value: 'Customer Segment', position: 'insideBottom', offset: -5, style: { fill: '#475569', fontSize: '12px', fontWeight: 500 } }}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px', fill: '#475569' }}
            label={{ value: 'Number of Customers', angle: -90, position: 'left', offset: 10, style: { fill: '#475569', fontSize: '13px', fontWeight: 500, textAnchor: 'middle' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="customer_count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.segment as keyof typeof COLORS] || '#8b5cf6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
