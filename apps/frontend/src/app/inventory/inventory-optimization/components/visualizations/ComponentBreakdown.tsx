"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart2 } from 'lucide-react';

interface ComponentBreakdownProps {
  holdingCostData: any;
  stockOptData: any;
  loading?: boolean;
}

export function ComponentBreakdown({
  holdingCostData,
  stockOptData,
  loading = false
}: ComponentBreakdownProps) {
  const componentData = useMemo(() => {
    // Get cost breakdown data
    const costBreakdown = holdingCostData.cost_breakdown || {
      storage_costs: 0,
      opportunity_costs: 0,
      risk_costs: 0,
    };

    const totalCost = holdingCostData.total_annual_holding_cost || 0;

    // Calculate components
    const storageCost = costBreakdown.storage_costs || (totalCost * 0.50);
    const opportunityCost = costBreakdown.opportunity_costs || (totalCost * 0.35);
    const riskCost = costBreakdown.risk_costs || (totalCost * 0.15);

    // Calculate potential savings by component
    const totalSavings = holdingCostData.potential_annual_savings || 0;
    const storageSavings = totalSavings * 0.40; // 40% from storage optimization
    const opportunitySavings = totalSavings * 0.35; // 35% from reducing capital tie-up
    const riskSavings = totalSavings * 0.25; // 25% from risk reduction

    return [
      {
        component: 'Storage Costs',
        current: Math.round(storageCost),
        optimized: Math.round(storageCost - storageSavings),
        savings: Math.round(storageSavings),
        percentage: 50,
      },
      {
        component: 'Opportunity Costs',
        current: Math.round(opportunityCost),
        optimized: Math.round(opportunityCost - opportunitySavings),
        savings: Math.round(opportunitySavings),
        percentage: 35,
      },
      {
        component: 'Risk Costs',
        current: Math.round(riskCost),
        optimized: Math.round(riskCost - riskSavings),
        savings: Math.round(riskSavings),
        percentage: 15,
      },
      {
        component: 'Ordering Costs',
        current: Math.round((stockOptData.current_ordering_cost || 100000)),
        optimized: Math.round((stockOptData.optimized_ordering_cost || 70000)),
        savings: Math.round((stockOptData.ordering_cost_savings || 30000)),
        percentage: 0,
      },
    ];
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
              {entry.name}: <span className="font-medium">${entry.value.toLocaleString()}</span>
            </p>
          ))}
          {payload[0] && (
            <p className="text-sm text-green-500 mt-1">
              Savings: <span className="font-medium">
                ${(payload[0].payload.current - payload[0].payload.optimized).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const totalCurrent = componentData.reduce((sum, item) => sum + item.current, 0);
  const totalOptimized = componentData.reduce((sum, item) => sum + item.optimized, 0);
  const totalSavings = totalCurrent - totalOptimized;

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <PieChart2 className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Cost Component Breakdown</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Reduction</p>
          <p className="text-lg font-semibold text-green-500">${totalSavings.toLocaleString()}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={componentData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
          <XAxis
            dataKey="component"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar dataKey="current" fill="#ef4444" name="Current" radius={[4, 4, 0, 0]} />
          <Bar dataKey="optimized" fill="#10b981" name="Optimized" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-3">
        {componentData.map((component, index) => {
          const savingsPct = component.current > 0
            ? ((component.savings / component.current) * 100).toFixed(1)
            : '0.0';

          return (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{component.component}</p>
                <p className="text-xs text-muted-foreground">
                  {component.percentage > 0 ? `${component.percentage}% of holding costs` : 'Variable ordering costs'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-sm font-medium text-red-500">${component.current.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">→</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Optimized</p>
                  <p className="text-sm font-medium text-green-500">${component.optimized.toLocaleString()}</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-xs text-muted-foreground">Savings</p>
                  <p className="text-sm font-medium text-accent">{savingsPct}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Current Total Cost</p>
          <p className="text-xl font-semibold text-red-500">${(totalCurrent / 1000000).toFixed(2)}M</p>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Optimized Total Cost</p>
          <p className="text-xl font-semibold text-green-500">${(totalOptimized / 1000000).toFixed(2)}M</p>
        </div>
        <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Savings</p>
          <p className="text-xl font-semibold text-accent">
            {((totalSavings / totalCurrent) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
