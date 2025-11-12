"use client";

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

interface PerformanceTimelineProps {
  holdingCostData: any;
  stockOptData: any;
  loading?: boolean;
}

export function PerformanceTimeline({
  holdingCostData,
  stockOptData,
  loading = false
}: PerformanceTimelineProps) {
  // Generate projected timeline data (12 months)
  const timelineData = useMemo(() => {
    const currentCost = holdingCostData.total_annual_holding_cost || 0;
    const monthlyCurrent = currentCost / 12;

    const holdingSavings = holdingCostData.potential_annual_savings || 0;
    const stockSavings = stockOptData.total_cost_savings || 0;
    const totalSavings = holdingSavings + stockSavings;
    const monthlyOptimized = (currentCost - totalSavings) / 12;

    const data = [];
    for (let i = 0; i <= 12; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      // Linear projection with slight variation
      const implementationProgress = Math.min(i / 6, 1); // 6 months to full implementation
      const currentMonthly = monthlyCurrent * (12 - i);
      const optimizedMonthly = monthlyOptimized * (12 - i) + (monthlyOptimized * implementationProgress * i);

      data.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        current: Math.round(currentMonthly),
        optimized: Math.round(optimizedMonthly),
        savings: Math.round(currentMonthly - optimizedMonthly),
        serviceLevel: stockOptData.service_level || 95,
      });
    }
    return data;
  }, [holdingCostData, stockOptData]);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Service Level'
                ? `${entry.value}%`
                : `$${entry.value.toLocaleString()}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Performance Timeline Projection</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Implementation Period</p>
          <p className="text-sm font-semibold text-foreground">6 Months</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => `${value}%`}
            domain={[90, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="current"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Current Cost"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="optimized"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Optimized Cost"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="savings"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
            name="Monthly Savings"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="serviceLevel"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Service Level"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Projection Assumptions:</span> Linear implementation over 6 months with gradual cost reduction. Service level maintained at {stockOptData.service_level || 95}% target throughout optimization period.
        </p>
      </div>
    </div>
  );
}
