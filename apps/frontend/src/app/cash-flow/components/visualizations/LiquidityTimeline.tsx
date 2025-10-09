"use client";

import React, { useMemo } from 'react';
import { Card, Skeleton, getShiftClickManager } from 'components/index';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface LiquidityTimelineData {
  date: string;
  cash_balance: number;
  liquidity_status: string;
  threshold_min?: number;
  threshold_target?: number;
}

interface LiquidityTimelineProps {
  data: LiquidityTimelineData[];
  loading?: boolean;
}

export function LiquidityTimeline({ data, loading }: LiquidityTimelineProps) {
  const shiftClickManager = getShiftClickManager();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => ({
      date: item.date,
      cashBalance: item.cash_balance,
      status: item.liquidity_status,
      thresholdMin: item.threshold_min,
      thresholdTarget: item.threshold_target,
    }));
  }, [data]);

  const thresholds = useMemo(() => {
    if (!data || data.length === 0) return { min: 0, target: 0 };
    return {
      min: data[0]?.threshold_min || 1000000,
      target: data[0]?.threshold_target || 10000000,
    };
  }, [data]);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton height={400} className="animate-pulse" />
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No liquidity timeline data available
        </div>
      </Card>
    );
  }

  const handleChartClick = (clickData: any) => {
    if (!shiftClickManager.isShiftKeyPressed()) return;

    if (clickData && clickData.activePayload && clickData.activePayload.length > 0) {
      const payload = clickData.activePayload[0].payload;
      shiftClickManager.addPoint({
        label: `Date: ${payload.date}`,
        value: `Cash Balance: $${(payload.cashBalance / 1000000).toFixed(2)}M | Status: ${payload.status}`,
        source: 'Liquidity Timeline',
        chartType: 'line'
      }, clickData);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">{data.date}</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Cash Balance:</span>
            <span className="font-semibold text-foreground">
              ${(data.cashBalance / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Status:</span>
            <span
              className={`font-semibold ${
                data.status === 'critical'
                  ? 'text-red-500'
                  : data.status === 'warning'
                  ? 'text-amber-500'
                  : 'text-green-500'
              }`}
            >
              {data.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="w-full pt-2">
          <ResponsiveContainer width="100%" height={420}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#888"
                tick={{ fill: '#888', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis
                stroke="#888"
                tick={{ fill: '#888', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="line"
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />

            {/* Threshold lines */}
            <ReferenceLine
              y={thresholds.min}
              stroke="#ff5252"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: 'Minimum Threshold',
                position: 'insideTopRight',
                fill: '#ff5252',
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={thresholds.target}
              stroke="#00ff88"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: 'Target Level',
                position: 'insideTopRight',
                fill: '#00ff88',
                fontSize: 11,
              }}
            />

              {/* Cash balance line */}
              <Line
                type="monotone"
                dataKey="cashBalance"
                name="Cash Balance"
                stroke="#00e0ff"
                strokeWidth={3}
                dot={{ fill: '#00e0ff', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status legend */}
        <div className="flex items-center justify-center gap-6 text-xs border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Healthy (&gt; $5M)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-muted-foreground">Warning ($1M - $5M)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Critical (&lt; $1M)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
