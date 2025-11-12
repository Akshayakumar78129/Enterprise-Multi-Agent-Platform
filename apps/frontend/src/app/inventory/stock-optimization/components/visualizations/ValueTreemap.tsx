"use client";

import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { getShiftClickManager } from 'components/index';

interface TreemapItem {
  name: string;
  value: number;
  savings: number;
  itemCount: number;
  color: string;
  children?: Array<{
    name: string;
    value: number;
    savings: number;
    status: string;
  }>;
}

interface ValueTreemapProps {
  data: TreemapItem[];
  loading?: boolean;
}

export function ValueTreemap({ data, loading = false }: ValueTreemapProps) {
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
          No treemap data available
        </div>
      </div>
    );
  }

  const getColorByOpportunity = (color: string) => {
    switch (color) {
      case 'high':
        return '#e930ff'; // Signal Magenta - high opportunity
      case 'medium':
        return '#fdca40'; // Amber - medium opportunity
      case 'low':
        return '#00e0ff'; // Electric Cyan - low opportunity (optimal)
      default:
        return '#5fd4d6';
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, value, color, savings, itemCount } = props;

    if (width < 60 || height < 40) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: getColorByOpportunity(color),
            stroke: '#0a1224',
            strokeWidth: 2,
            opacity: 0.8,
            cursor: 'pointer'
          }}
          onClick={(e) => {
            if (e.shiftKey) {
              shiftClickManager.addPoint({
                label: name,
                value: `Value: ${formatCurrency(value)}, Savings: ${formatCurrency(savings)}, Items: ${itemCount}`,
                source: 'Value Treemap'
              }, e.nativeEvent);
            }
          }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="#f7f9fb"
          fontSize={width > 100 ? 14 : 11}
          fontWeight="600"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 8}
          textAnchor="middle"
          fill="#f7f9fb"
          fontSize={width > 100 ? 12 : 10}
          opacity={0.9}
        >
          {formatCurrency(value)}
        </text>
        {itemCount && width > 80 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 24}
            textAnchor="middle"
            fill="#f7f9fb"
            fontSize={9}
            opacity={0.8}
          >
            {itemCount} items
          </text>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Inventory Value: <span className="text-foreground font-medium">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Savings Potential: <span className="text-green-500 font-medium">{formatCurrency(data.savings)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Items: <span className="text-foreground font-medium">{data.itemCount}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Opportunity: <span className="text-foreground font-medium capitalize">{data.color}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate totals for summary
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalSavings = data.reduce((sum, item) => sum + item.savings, 0);
  const totalItems = data.reduce((sum, item) => sum + item.itemCount, 0);

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Inventory Value</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
        </div>
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
          <p className="text-xs text-muted-foreground mb-1">Total Savings Potential</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(totalSavings)}</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Items</p>
          <p className="text-2xl font-bold text-foreground">{totalItems}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e930ff' }}></div>
          <span>High Opportunity</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fdca40' }}></div>
          <span>Medium Opportunity</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00e0ff' }}></div>
          <span>Optimal</span>
        </div>
      </div>

      {/* Treemap */}
      <ResponsiveContainer width="100%" height={500}>
        <Treemap
          data={data}
          dataKey="value"
          stroke="#0a1224"
          fill="#8884d8"
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
