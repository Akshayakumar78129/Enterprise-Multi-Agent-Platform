"use client";

import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  ZAxis
} from 'recharts';
import { getShiftClickManager } from 'components/index';

interface SavingOpportunity {
  id: string;
  name: string;
  category: string;
  warehouse: string;
  difficulty: number; // 1-5 scale
  potential_savings: number;
  inventory_value: number;
  primary_component: 'capital' | 'storage' | 'risk' | 'opportunity';
  implementation_timeline?: number;
  description?: string;
}

interface OpportunityAnalyzerProps {
  data: SavingOpportunity[];
  loading?: boolean;
}

export function OpportunityAnalyzer({ data, loading = false }: OpportunityAnalyzerProps) {
  const shiftClickManager = getShiftClickManager();
  const [groupBy, setGroupBy] = useState<'item' | 'category' | 'warehouse' | 'component'>('item');
  const [difficultyFilter, setDifficultyFilter] = useState<number>(5);
  const [selectedOpportunity, setSelectedOpportunity] = useState<SavingOpportunity | null>(null);

  const colors = {
    capital: '#3b82f6',
    storage: '#10b981',
    risk: '#f59e0b',
    opportunity: '#8b5cf6'
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item =>
      item.difficulty <= difficultyFilter
    );
  }, [data, difficultyFilter]);

  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    if (groupBy === 'item') {
      return filteredData.map(item => ({
        x: item.difficulty,
        y: item.potential_savings,
        z: item.inventory_value / 1000, // Scale for bubble size
        fill: colors[item.primary_component],
        name: item.name,
        rawData: item
      }));
    }

    // Group data
    const grouped = filteredData.reduce((acc, item) => {
      const key = groupBy === 'category' ? item.category :
                 groupBy === 'warehouse' ? item.warehouse : item.primary_component;

      if (!acc[key]) {
        acc[key] = {
          name: key,
          difficulty: 0,
          potential_savings: 0,
          inventory_value: 0,
          primary_component: item.primary_component,
          count: 0
        };
      }

      acc[key].difficulty += item.difficulty;
      acc[key].potential_savings += item.potential_savings;
      acc[key].inventory_value += item.inventory_value;
      acc[key].count += 1;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map((item: any) => ({
      x: item.difficulty / item.count,
      y: item.potential_savings,
      z: item.inventory_value / 1000,
      fill: colors[item.primary_component],
      name: item.name,
      count: item.count,
      rawData: item
    }));
  }, [filteredData, groupBy, colors]);

  const avgSavings = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return filteredData.reduce((sum, d) => sum + d.potential_savings, 0) / filteredData.length;
  }, [filteredData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Difficulty: <span className="text-foreground font-medium">{data.x.toFixed(1)}/5</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Potential Savings: <span className="text-accent font-medium">{formatCurrency(data.y)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Inventory Value: <span className="text-foreground font-medium">{formatCurrency(data.z * 1000)}</span>
          </p>
          {data.count && (
            <p className="text-sm text-muted-foreground">
              Items: <span className="text-foreground font-medium">{data.count}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-surface/50 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground bg-surface border border-border rounded-lg">
        No savings opportunity data available
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      {/* Controls */}
      <div className="flex gap-4 items-center mb-4 flex-wrap">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-muted-foreground">Group by:</label>
          {(['item', 'category', 'warehouse', 'component'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setGroupBy(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                groupBy === type
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface border border-border text-foreground hover:bg-muted'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Max Difficulty:</label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(parseInt(e.target.value))}
            className="w-20 accent-accent"
          />
          <span className="text-sm text-foreground font-medium w-4">{difficultyFilter}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
          onClick={(e: any) => {
            if (e && e.activePayload && e.activePayload[0]) {
              const opp = e.activePayload[0].payload.rawData;
              setSelectedOpportunity(opp);

              if (e.nativeEvent && e.nativeEvent.shiftKey) {
                shiftClickManager.addPoint({
                  label: e.activePayload[0].payload.name,
                  value: formatCurrency(e.activePayload[0].payload.y),
                  source: 'Savings Opportunity Chart'
                }, e.nativeEvent);
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 6]}
            ticks={[1, 2, 3, 4, 5]}
            className="text-muted-foreground text-xs"
            tick={{ fill: 'currentColor' }}
          >
            <Label
              value="Implementation Difficulty (1-5)"
              position="bottom"
              offset={-10}
              style={{ textAnchor: 'middle', fill: 'currentColor' }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            className="text-muted-foreground text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          >
            <Label
              value="Potential Annual Savings"
              angle={-90}
              position="left"
              offset={-10}
              style={{ textAnchor: 'middle', fill: 'currentColor' }}
            />
          </YAxis>
          <ZAxis type="number" dataKey="z" range={[100, 1000]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          {/* Quadrant lines */}
          <ReferenceLine x={3} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.5} />
          <ReferenceLine y={avgSavings} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.5} />

          <Scatter
            data={chartData}
            fill="#8884d8"
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Quadrant Labels */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-sm font-semibold text-green-600">Quick Wins</div>
          <div className="text-xs text-muted-foreground">Easy, High Savings</div>
        </div>
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-sm font-semibold text-blue-600">Major Projects</div>
          <div className="text-xs text-muted-foreground">Difficult, High Savings</div>
        </div>
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="text-sm font-semibold text-yellow-600">Fill-ins</div>
          <div className="text-xs text-muted-foreground">Easy, Lower Savings</div>
        </div>
        <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
          <div className="text-sm font-semibold text-gray-600">Back Burner</div>
          <div className="text-xs text-muted-foreground">Difficult, Lower Savings</div>
        </div>
      </div>

      {/* Selected Opportunity Details */}
      {selectedOpportunity && (
        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-lg">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            {selectedOpportunity.name}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Difficulty</div>
              <div className="text-sm font-semibold text-foreground">
                {selectedOpportunity.difficulty.toFixed(1)}/5
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Potential Savings</div>
              <div className="text-sm font-semibold text-accent">
                {formatCurrency(selectedOpportunity.potential_savings)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Inventory Value</div>
              <div className="text-sm font-semibold text-foreground">
                {formatCurrency(selectedOpportunity.inventory_value)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Primary Component</div>
              <div className="text-sm font-semibold text-foreground capitalize">
                {selectedOpportunity.primary_component}
              </div>
            </div>
          </div>
          {selectedOpportunity.description && (
            <p className="mt-3 text-sm text-muted-foreground">{selectedOpportunity.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
