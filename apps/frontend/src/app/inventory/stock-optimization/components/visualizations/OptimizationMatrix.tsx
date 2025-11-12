"use client";

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { getShiftClickManager } from 'components/index';

interface MatrixItem {
  itemName: string;
  category: string;
  effort: number;
  impact: number;
  savings: number;
  itemCount: number;
  quadrant: string;
  priority: number;
}

interface OptimizationMatrixProps {
  data: MatrixItem[];
  loading?: boolean;
}

export function OptimizationMatrix({ data, loading = false }: OptimizationMatrixProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface/50 rounded w-1/2"></div>
          <div className="h-[500px] bg-surface/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="h-[500px] flex items-center justify-center text-muted-foreground">
          No optimization matrix data available
        </div>
      </div>
    );
  }

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'Quick Wins':
        return '#00e0ff'; // Electric Cyan
      case 'Major Projects':
        return '#5fd4d6'; // Lighter Cyan
      case 'Fill-Ins':
        return '#aa45dd'; // Muted Purple
      case 'Avoid':
        return '#e930ff'; // Signal Magenta
      default:
        return '#9ca3af';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.itemName}</p>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Category: <span className="text-foreground font-medium">{data.category}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Quadrant: <span className="text-foreground font-medium">{data.quadrant}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Effort: <span className="text-foreground font-medium">{data.effort.toFixed(1)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Impact: <span className="text-foreground font-medium">{data.impact.toFixed(1)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Savings: <span className="text-green-500 font-medium">${data.savings.toFixed(2)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const quickWins = data.filter(d => d.quadrant === 'Quick Wins');
  const majorProjects = data.filter(d => d.quadrant === 'Major Projects');
  const fillIns = data.filter(d => d.quadrant === 'Fill-Ins');
  const avoid = data.filter(d => d.quadrant === 'Avoid');

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      {/* Quadrant Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-semibold text-foreground">Quick Wins</h5>
            <span className="text-2xl font-bold text-cyan-500">{quickWins.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">High Impact, Low Effort</p>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-semibold text-foreground">Major Projects</h5>
            <span className="text-2xl font-bold text-blue-500">{majorProjects.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">High Impact, High Effort</p>
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-semibold text-foreground">Fill-Ins</h5>
            <span className="text-2xl font-bold text-purple-500">{fillIns.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">Low Impact, Low Effort</p>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-semibold text-foreground">Avoid</h5>
            <span className="text-2xl font-bold text-red-500">{avoid.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">Low Impact, High Effort</p>
        </div>
      </div>

      {/* Scatter Chart */}
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          onClick={(e: any) => {
            if (e && e.activePayload && e.activePayload[0]) {
              const item = e.activePayload[0].payload;
              if (e.nativeEvent && e.nativeEvent.shiftKey) {
                shiftClickManager.addPoint({
                  label: `${item.itemName} (${item.quadrant})`,
                  value: `Effort: ${item.effort.toFixed(1)}, Impact: ${item.impact.toFixed(1)}, Savings: $${item.savings.toFixed(2)}`,
                  source: 'Optimization Matrix'
                }, e.nativeEvent);
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />

          {/* Quadrant backgrounds */}
          <defs>
            <pattern id="quickwins" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#00e0ff" opacity="0.05" />
            </pattern>
            <pattern id="major" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#5fd4d6" opacity="0.05" />
            </pattern>
            <pattern id="fillins" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#aa45dd" opacity="0.05" />
            </pattern>
            <pattern id="avoid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#e930ff" opacity="0.05" />
            </pattern>
          </defs>

          <XAxis
            type="number"
            dataKey="effort"
            name="Effort"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Implementation Effort →', position: 'bottom', fill: '#9ca3af', fontSize: 14 }}
            domain={[0, 100]}
          />
          <YAxis
            type="number"
            dataKey="impact"
            name="Impact"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: '← Financial Impact', angle: -90, position: 'left', fill: '#9ca3af', fontSize: 14 }}
            domain={[0, 100]}
          />

          {/* Quadrant dividing lines */}
          <ReferenceLine x={50} stroke="#f7f9fb" strokeDasharray="5 5" strokeWidth={2} />
          <ReferenceLine y={50} stroke="#f7f9fb" strokeDasharray="5 5" strokeWidth={2} />

          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          <Scatter name="Opportunities" data={data} fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getQuadrantColor(entry.quadrant)} opacity={0.8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Recommendation */}
      {quickWins.length > 0 && (
        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <h5 className="text-sm font-semibold text-foreground mb-2">💡 Recommended Action</h5>
          <p className="text-sm text-muted-foreground">
            Focus on <strong className="text-cyan-500">{quickWins.length} Quick Win opportunities</strong> first.
            These provide high impact with minimal implementation effort, potentially saving{' '}
            <strong className="text-green-500">
              ${quickWins.reduce((sum, item) => sum + item.savings, 0).toFixed(2)}
            </strong> annually.
          </p>
        </div>
      )}
    </div>
  );
}
