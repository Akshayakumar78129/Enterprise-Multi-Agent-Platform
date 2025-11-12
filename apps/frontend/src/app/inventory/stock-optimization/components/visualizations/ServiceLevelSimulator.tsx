"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getShiftClickManager } from 'components/index';

interface ServiceLevelSimulatorProps {
  data: {
    impactData: Array<{
      serviceLevel: number;
      inventoryValue: number;
      holdingCost: number;
      stockoutProbability: number;
    }>;
    currentServiceLevel: number;
    optimalServiceLevel: number;
  };
  loading?: boolean;
}

export function ServiceLevelSimulator({ data, loading = false }: ServiceLevelSimulatorProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface/50 rounded w-1/2"></div>
          <div className="h-[400px] bg-surface/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.impactData || data.impactData.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          No service level impact data available
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">Service Level: {data.serviceLevel}%</p>
          <div className="space-y-1">
            <p className="text-sm text-cyan-500">
              Inventory Value: {formatCurrency(data.inventoryValue)}
            </p>
            <p className="text-sm text-purple-500">
              Holding Cost: {formatCurrency(data.holdingCost)}
            </p>
            <p className="text-sm text-red-500">
              Stockout Risk: {data.stockoutProbability.toFixed(2)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data.impactData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          onClick={(e: any) => {
            if (e && e.activePayload && e.activePayload[0]) {
              const point = e.activePayload[0].payload;
              if (e.nativeEvent && e.nativeEvent.shiftKey) {
                shiftClickManager.addPoint({
                  label: `Service Level ${point.serviceLevel}%`,
                  value: `Inventory: ${formatCurrency(point.inventoryValue)}, Stockout Risk: ${point.stockoutProbability.toFixed(2)}%`,
                  source: 'Service Level Simulator'
                }, e.nativeEvent);
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
          <XAxis
            dataKey="serviceLevel"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Service Level (%)', position: 'bottom', fill: '#9ca3af' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#00e0ff"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={formatCurrency}
            label={{ value: 'Inventory Value', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#e930ff"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Stockout Risk (%)', angle: 90, position: 'insideRight', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
          />

          {/* Current service level line */}
          <ReferenceLine
            x={data.currentServiceLevel}
            stroke="#f7f9fb"
            strokeDasharray="5 5"
            label={{ value: 'Current', fill: '#f7f9fb', fontSize: 12 }}
          />

          {/* Optimal service level line */}
          <ReferenceLine
            x={data.optimalServiceLevel}
            stroke="#00c389"
            strokeDasharray="5 5"
            label={{ value: 'Optimal', fill: '#00c389', fontSize: 12 }}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="inventoryValue"
            stroke="#00e0ff"
            strokeWidth={3}
            name="Inventory Value"
            dot={{ fill: '#00e0ff', r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="stockoutProbability"
            stroke="#e930ff"
            strokeWidth={3}
            name="Stockout Risk"
            dot={{ fill: '#e930ff', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Current Service Level</p>
          <p className="text-2xl font-bold text-foreground">{data.currentServiceLevel}%</p>
        </div>
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
          <p className="text-xs text-muted-foreground mb-1">Recommended Optimal</p>
          <p className="text-2xl font-bold text-green-500">{data.optimalServiceLevel}%</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Trade-off</p>
          <p className="text-sm text-foreground">Higher service → More inventory → Lower stockouts</p>
        </div>
      </div>
    </div>
  );
}
