"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingDown } from 'lucide-react';

interface CostImpactWaterfallProps {
  holdingCostData: any;
  stockOptData: any;
  loading?: boolean;
}

interface WaterfallData {
  name: string;
  value: number;
  total: number;
  type: 'start' | 'positive' | 'negative' | 'end';
}

export function CostImpactWaterfall({
  holdingCostData,
  stockOptData,
  loading = false
}: CostImpactWaterfallProps) {
  const waterfallData = useMemo(() => {
    const currentCost = holdingCostData.total_annual_holding_cost || 0;
    const holdingSavings = holdingCostData.potential_annual_savings || 0;
    const stockSavings = stockOptData.total_cost_savings || 0;
    const orderingSavings = (stockOptData.ordering_cost_savings || 0);

    let runningTotal = currentCost;

    const data: WaterfallData[] = [
      {
        name: 'Current Cost',
        value: currentCost,
        total: currentCost,
        type: 'start'
      },
      {
        name: 'Holding Optimization',
        value: -holdingSavings,
        total: runningTotal,
        type: 'negative'
      },
    ];

    runningTotal -= holdingSavings;

    data.push({
      name: 'Stock Level Optimization',
      value: -stockSavings,
      total: runningTotal,
      type: 'negative'
    });

    runningTotal -= stockSavings;

    if (orderingSavings > 0) {
      data.push({
        name: 'Ordering Optimization',
        value: -orderingSavings,
        total: runningTotal,
        type: 'negative'
      });
      runningTotal -= orderingSavings;
    }

    data.push({
      name: 'Optimized Cost',
      value: runningTotal,
      total: runningTotal,
      type: 'end'
    });

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="text-accent font-medium">
              ${Math.abs(data.value).toLocaleString()}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Running Total: <span className="text-foreground font-medium">
              ${data.total.toLocaleString()}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (type: string) => {
    switch (type) {
      case 'start':
        return '#ef4444'; // red
      case 'negative':
        return '#10b981'; // green
      case 'positive':
        return '#ef4444'; // red
      case 'end':
        return '#3b82f6'; // blue
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingDown className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Cost Reduction Waterfall</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Savings</p>
          <p className="text-lg font-semibold text-green-500">
            ${((holdingCostData.potential_annual_savings || 0) +
               (stockOptData.total_cost_savings || 0)).toLocaleString()}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#64748b" />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {waterfallData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-muted-foreground">Current/Increase</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-muted-foreground">Savings</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-muted-foreground">Optimized</span>
        </div>
      </div>
    </div>
  );
}
