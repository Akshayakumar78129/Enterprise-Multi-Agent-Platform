"use client";

import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';
import { Target } from 'lucide-react';

interface ActionPriorityMatrixProps {
  holdingCostData: any;
  stockOptData: any;
  loading?: boolean;
}

interface ActionItem {
  name: string;
  effort: number; // 1-10 scale
  impact: number; // savings value
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export function ActionPriorityMatrix({
  holdingCostData,
  stockOptData,
  loading = false
}: ActionPriorityMatrixProps) {
  const actionItems = useMemo(() => {
    const items: ActionItem[] = [];

    // High-cost items (low effort, high impact)
    const excessiveCostItems = holdingCostData.excessive_cost_items || 0;
    if (excessiveCostItems > 0) {
      items.push({
        name: `Reduce ${excessiveCostItems} high-cost items`,
        effort: 3,
        impact: holdingCostData.potential_annual_savings || 0,
        category: 'Cost Reduction',
        priority: 'critical'
      });
    }

    // Reorder needed items (low effort, high impact)
    const needsReorder = stockOptData.items_needing_reorder || 0;
    if (needsReorder > 0) {
      items.push({
        name: `Reorder ${needsReorder} items`,
        effort: 2,
        impact: stockOptData.stockout_prevention_value || (needsReorder * 500),
        category: 'Stock Level',
        priority: 'critical'
      });
    }

    // Overstock items (medium effort, medium impact)
    const overstock = stockOptData.items_overstock || 0;
    if (overstock > 0) {
      items.push({
        name: `Reduce ${overstock} overstocked items`,
        effort: 5,
        impact: stockOptData.total_cost_savings || 0,
        category: 'Stock Level',
        priority: 'high'
      });
    }

    // EOQ implementation (high effort, high impact)
    items.push({
      name: 'Implement EOQ system',
      effort: 8,
      impact: (stockOptData.ordering_cost_savings || 50000),
      category: 'Process',
      priority: 'high'
    });

    // Safety stock optimization (medium effort, medium impact)
    items.push({
      name: 'Optimize safety stock levels',
      effort: 6,
      impact: (holdingCostData.potential_annual_savings || 0) * 0.3,
      category: 'Cost Reduction',
      priority: 'medium'
    });

    // Automated reorder points (high effort, medium impact)
    items.push({
      name: 'Deploy automated reorder system',
      effort: 9,
      impact: (stockOptData.total_cost_savings || 0) * 0.4,
      category: 'Process',
      priority: 'medium'
    });

    // ABC classification (low effort, low-medium impact)
    items.push({
      name: 'Implement ABC classification',
      effort: 4,
      impact: (holdingCostData.potential_annual_savings || 0) * 0.2,
      category: 'Process',
      priority: 'medium'
    });

    // Supplier negotiation (medium effort, medium-high impact)
    items.push({
      name: 'Negotiate supplier terms',
      effort: 7,
      impact: (holdingCostData.total_annual_holding_cost || 0) * 0.15,
      category: 'Cost Reduction',
      priority: 'high'
    });

    return items;
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
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-sm font-semibold text-foreground mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground mb-1">
            Category: <span className="text-accent">{data.category}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-1">
            Effort: <span className="text-foreground">{data.effort}/10</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Impact: <span className="text-green-500">${data.impact.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#ef4444'; // red
      case 'high':
        return '#f59e0b'; // amber
      case 'medium':
        return '#3b82f6'; // blue
      case 'low':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Action Priority Matrix</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Effort vs Impact</p>
          <p className="text-sm font-semibold text-foreground">{actionItems.length} Actions</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
          <XAxis
            type="number"
            dataKey="effort"
            name="Effort"
            domain={[0, 10]}
            tick={{ fill: '#94a3b8' }}
            label={{ value: 'Implementation Effort', position: 'bottom', fill: '#94a3b8', offset: 20 }}
          />
          <YAxis
            type="number"
            dataKey="impact"
            name="Impact"
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            label={{ value: 'Annual Impact ($)', angle: -90, position: 'left', fill: '#94a3b8', offset: 60 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Quadrant lines */}
          <ReferenceLine x={5} stroke="#64748b" strokeDasharray="3 3" />
          <ReferenceLine
            y={actionItems.reduce((sum, item) => sum + item.impact, 0) / actionItems.length}
            stroke="#64748b"
            strokeDasharray="3 3"
          />

          <Scatter data={actionItems} fill="#8884d8">
            {actionItems.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.priority)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Quadrant labels */}
      <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
          <p className="font-semibold text-green-500 mb-1">Quick Wins (Low Effort, High Impact)</p>
          <p className="text-muted-foreground">Priority actions for immediate results</p>
        </div>
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
          <p className="font-semibold text-blue-500 mb-1">Major Projects (High Effort, High Impact)</p>
          <p className="text-muted-foreground">Strategic initiatives requiring resources</p>
        </div>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
          <p className="font-semibold text-yellow-500 mb-1">Fill Ins (Low Effort, Low Impact)</p>
          <p className="text-muted-foreground">Easy improvements when time permits</p>
        </div>
        <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded">
          <p className="font-semibold text-gray-500 mb-1">Low Priority (High Effort, Low Impact)</p>
          <p className="text-muted-foreground">Avoid or reconsider these actions</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-muted-foreground">Critical</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <span className="text-muted-foreground">High</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-muted-foreground">Low</span>
        </div>
      </div>
    </div>
  );
}
