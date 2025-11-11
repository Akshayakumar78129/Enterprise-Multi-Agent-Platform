import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/rechartsSetup';
/**
 * Frequency Distribution Chart
 * Shows purchase frequency distribution across bins
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
        <p className="text-foreground font-semibold mb-2">{data.bin_range} purchases</p>
        <p className="text-cyan-400">Customers: {data.customer_count?.toLocaleString()}</p>
        <p className="text-green-400">Percentage: {data.percentage?.toFixed(1)}%</p>
        <p className="text-yellow-400">Revenue: ${data.total_revenue?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

interface FrequencyDistributionProps {
  data: Array<{
    bin_range: string;
    customer_count: number;
    percentage: number;
    total_revenue: number;
  }>;
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function FrequencyDistribution({ data, loading }: FrequencyDistributionProps) {
  const shiftClickManager = getShiftClickManager();

  console.log('FrequencyDistribution - loading:', loading, 'data:', data, 'data.length:', data?.length);

  if (loading) {
    return <div className="h-[400px] animate-pulse bg-muted rounded-lg" />;
  }

  if (!data || data.length === 0) {
    console.log('FrequencyDistribution - SHOWING EMPTY STATE');
    return (
      <div className="h-[400px] flex items-center justify-center bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">No frequency distribution data available</p>
      </div>
    );
  }

  console.log('FrequencyDistribution - RENDERING CHART with', data.length, 'bins');

  return (
    <ChartCard
      className="h-[400px]"
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: 'Frequency Distribution',
          value: `${data.length} bins with ${data.reduce((sum, d) => sum + d.customer_count, 0)} customers`,
          source: 'Purchase Frequency - Distribution'
        }, event.nativeEvent);
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis
            dataKey="bin_range"
            stroke="#64748b"
            style={{ fontSize: '12px', fill: '#475569' }}
            label={{ value: 'Purchase Frequency Range', position: 'bottom', offset: 0, style: { fill: '#475569', fontSize: '13px', fontWeight: 500 } }}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px', fill: '#475569' }}
            label={{ value: 'Number of Customers', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#475569', fontSize: '13px', fontWeight: 500, textAnchor: 'middle' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="customer_count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
