"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getShiftClickManager } from 'components/index';

interface Metric {
  metric: string;
  current: number;
  optimized: number;
  improvement: number;
}

interface MetricsComparisonProps {
  data: Metric[];
  loading?: boolean;
}

export function MetricsComparison({ data, loading = false }: MetricsComparisonProps) {
  const shiftClickManager = getShiftClickManager();
  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface/50 rounded w-1/2"></div>
          <div className="h-64 bg-surface/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No metrics comparison data available
        </div>
      </div>
    );
  }

  const formatNumber = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.metric}</p>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Current: <span className="text-foreground font-semibold">{formatNumber(data.current)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Optimized: <span className="text-green-500 font-semibold">{formatNumber(data.optimized)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Improvement: <span className={`font-semibold ${data.improvement > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.improvement > 0 ? '+' : ''}{data.improvement.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          onClick={(e: any) => {
            if (e && e.activePayload && e.activePayload[0]) {
              const metric = e.activePayload[0].payload;
              if (e.nativeEvent && e.nativeEvent.shiftKey) {
                shiftClickManager.addPoint({
                  label: `${metric.metric}`,
                  value: `Current: ${formatNumber(metric.current)}, Optimized: ${formatNumber(metric.optimized)}, Improvement: ${metric.improvement.toFixed(1)}%`,
                  source: 'Metrics Comparison Chart'
                }, e.nativeEvent);
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
          <XAxis
            dataKey="metric"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={formatNumber}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
          />
          <Bar dataKey="current" fill="#ef4444" name="Current" radius={[4, 4, 0, 0]} />
          <Bar dataKey="optimized" fill="#10b981" name="Optimized" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={(e) => {
              if (e.shiftKey) {
                shiftClickManager.addPoint({
                  label: `${item.metric}`,
                  value: `Improvement: ${item.improvement > 0 ? '+' : ''}${item.improvement.toFixed(1)}%, Current: ${formatNumber(item.current)}, Optimized: ${formatNumber(item.optimized)}`,
                  source: 'Metrics Comparison Card'
                }, e.nativeEvent);
              }
            }}
          >
            <p className="text-sm font-medium text-foreground mb-2">{item.metric}</p>
            <div>
              <p className="text-xs text-muted-foreground">Improvement</p>
              <p className={`text-lg font-semibold ${item.improvement > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.improvement > 0 ? '+' : ''}{item.improvement.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
