/**
 * Customer Lifecycle Stages Chart
 * Shows customer distribution across lifecycle stages
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
        <p className="text-foreground font-semibold mb-2">{data.stage}</p>
        <p className="text-cyan-400">Customers: {data.customer_count?.toLocaleString()}</p>
        <p className="text-green-400">Avg Frequency: {data.avg_frequency?.toFixed(2)}</p>
        <p className="text-yellow-400">Total Revenue: ${(data.total_revenue / 1000000)?.toFixed(2)}M</p>
      </div>
    );
  }
  return null;
};

interface LifecycleStagesChartProps {
  data: Array<{
    stage: string;
    customer_count: number;
    avg_frequency: number;
    total_revenue: number;
  }>;
  loading?: boolean;
}

const STAGE_COLORS = {
  'New': '#10b981',
  'Active': '#3b82f6',
  'At Risk': '#f59e0b',
  'Dormant': '#ef4444',
  'Lost': '#64748b',
};

export function LifecycleStagesChart({ data, loading }: LifecycleStagesChartProps) {
  const shiftClickManager = getShiftClickManager();

  console.log('LifecycleStagesChart - loading:', loading, 'data:', data, 'data.length:', data?.length);

  if (loading) {
    return <div className="h-[400px] animate-pulse bg-muted rounded-lg" />;
  }

  if (!data || data.length === 0) {
    console.log('LifecycleStagesChart - SHOWING EMPTY STATE');
    return (
      <div className="h-[400px] flex items-center justify-center bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">No lifecycle stage data available</p>
      </div>
    );
  }

  console.log('LifecycleStagesChart - RENDERING CHART with', data.length, 'stages');

  return (
    <ChartCard
      className="h-[400px]"
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: 'Lifecycle Stages',
          value: `${data.reduce((sum, d) => sum + d.customer_count, 0)} customers across ${data.length} stages`,
          source: 'Purchase Frequency - Lifecycle'
        }, event.nativeEvent);
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis
            dataKey="stage"
            stroke="#64748b"
            style={{ fontSize: '12px', fill: '#475569' }}
            label={{ value: 'Lifecycle Stage', position: 'bottom', offset: 0, style: { fill: '#475569', fontSize: '13px', fontWeight: 500 } }}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px', fill: '#475569' }}
            label={{ value: 'Number of Customers', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#475569', fontSize: '13px', fontWeight: 500, textAnchor: 'middle' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="customer_count" name="Customers" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STAGE_COLORS[entry.stage as keyof typeof STAGE_COLORS] || '#8b5cf6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
