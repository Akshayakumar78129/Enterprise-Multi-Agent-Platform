"use client";

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { getShiftClickManager } from 'components/index';

interface PerformanceGaugeProps {
  data: {
    score: number;
    status: string;
    serviceScore: number;
    stockScore: number;
    costScore: number;
    breakdown: {
      optimal_items: number;
      attention_needed: number;
      service_level: number;
      savings_opportunity: number;
    };
  };
  loading?: boolean;
}

export function PerformanceGauge({ data, loading = false }: PerformanceGaugeProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface/50 rounded w-1/2"></div>
          <div className="h-[300px] bg-surface/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.score === undefined) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No performance data available
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return '#00c389';
      case 'good':
        return '#00e0ff';
      case 'fair':
        return '#fdca40';
      case 'poor':
        return '#e930ff';
      default:
        return '#9ca3af';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const gaugeData = [
    {
      name: 'Performance',
      value: data.score,
      fill: getStatusColor(data.status)
    }
  ];

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      shiftClickManager.addPoint({
        label: `Inventory Efficiency: ${data.score}`,
        value: `Status: ${data.status}, Service: ${data.serviceScore}, Stock: ${data.stockScore}, Cost: ${data.costScore}`,
        source: 'Performance Gauge'
      }, e.nativeEvent);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6" onClick={handleClick}>
      {/* Gauge Chart */}
      <div className="flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={gaugeData}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
              fill={getStatusColor(data.status)}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Score Display (centered) */}
        <div className="text-center -mt-32 mb-16">
          <div className="text-6xl font-bold" style={{ color: getStatusColor(data.status) }}>
            {data.score}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {getStatusLabel(data.status)}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-1">Service</p>
          <p className="text-xl font-bold text-foreground">{data.serviceScore}</p>
          <p className="text-xs text-muted-foreground mt-1">30% weight</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-1">Stock</p>
          <p className="text-xl font-bold text-foreground">{data.stockScore}</p>
          <p className="text-xs text-muted-foreground mt-1">40% weight</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-1">Cost</p>
          <p className="text-xl font-bold text-foreground">{data.costScore}</p>
          <p className="text-xs text-muted-foreground mt-1">30% weight</p>
        </div>
      </div>

      {/* Status Indicators */}
      {data.breakdown && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <p className="text-xs text-muted-foreground mb-1">Optimal Items</p>
            <p className="text-lg font-semibold text-green-500">{data.breakdown.optimal_items || 0}</p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
            <p className="text-xs text-muted-foreground mb-1">Need Attention</p>
            <p className="text-lg font-semibold text-orange-500">{data.breakdown.attention_needed || 0}</p>
          </div>
        </div>
      )}

      {/* Improvement Recommendations */}
      {data.status !== 'excellent' && data.breakdown && (
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h5 className="text-sm font-semibold text-foreground mb-2">Improvement Opportunities</h5>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {data.stockScore < 70 && data.breakdown.attention_needed !== undefined && (
              <li>• Optimize stock levels for {data.breakdown.attention_needed} items</li>
            )}
            {data.serviceScore < 70 && (
              <li>• Increase service level to reduce stockout risk</li>
            )}
            {data.costScore < 70 && data.breakdown.savings_opportunity !== undefined && (
              <li>• Implement recommendations to save ${data.breakdown.savings_opportunity.toFixed(2)}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
