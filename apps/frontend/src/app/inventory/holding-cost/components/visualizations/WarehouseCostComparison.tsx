"use client";

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { getShiftClickManager } from 'components/index';

interface WarehouseData {
  warehouse_name: string;
  warehouse_id: string;
  warehouse_type?: string;
  total_cost: number;
  cost_percentage: number;
  cost_per_item: number;
  capital_cost: number;
  storage_cost: number;
  risk_cost: number;
  opportunity_cost: number;
  item_count: number;
}

interface WarehouseCostComparisonProps {
  data: WarehouseData[];
  loading?: boolean;
}

export function WarehouseCostComparison({ data, loading = false }: WarehouseCostComparisonProps) {
  const shiftClickManager = getShiftClickManager();
  const [sortBy, setSortBy] = useState<'total_cost' | 'cost_percentage' | 'cost_per_item' | 'warehouse_name'>('total_cost');
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(null);

  const colors = {
    capital: '#3b82f6',
    storage: '#10b981',
    risk: '#f59e0b',
    opportunity: '#8b5cf6',
    percentage: '#ef4444'
  };

  const sortedData = useMemo(() => {
    if (!data) return [];

    return [...data].sort((a, b) => {
      switch (sortBy) {
        case 'total_cost':
          return b.total_cost - a.total_cost;
        case 'cost_percentage':
          return b.cost_percentage - a.cost_percentage;
        case 'cost_per_item':
          return b.cost_per_item - a.cost_per_item;
        case 'warehouse_name':
          return a.warehouse_name.localeCompare(b.warehouse_name);
        default:
          return 0;
      }
    });
  }, [data, sortBy]);

  const chartData = useMemo(() => {
    if (!sortedData) return [];

    return sortedData.map(w => ({
      name: w.warehouse_name,
      capital: w.capital_cost || 0,
      storage: w.storage_cost || 0,
      risk: w.risk_cost || 0,
      opportunity: w.opportunity_cost || 0,
      total: w.total_cost || 0,
      rawData: w
    }));
  }, [sortedData]);

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
          <p className="text-sm" style={{ color: colors.capital }}>
            Capital: {formatCurrency(data.capital)}
          </p>
          <p className="text-sm" style={{ color: colors.storage }}>
            Storage: {formatCurrency(data.storage)}
          </p>
          <p className="text-sm" style={{ color: colors.risk }}>
            Risk: {formatCurrency(data.risk)}
          </p>
          <p className="text-sm" style={{ color: colors.opportunity }}>
            Opportunity: {formatCurrency(data.opportunity)}
          </p>
          <p className="text-sm font-semibold text-accent mt-2 pt-2 border-t border-border">
            Total: {formatCurrency(data.total)}
          </p>
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
        No warehouse data available
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      {/* Controls */}
      <div className="flex gap-4 items-center mb-4">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-muted-foreground">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg text-sm bg-surface border border-border text-foreground"
          >
            <option value="total_cost">Total Cost</option>
            <option value="warehouse_name">Warehouse Name</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          onClick={(e: any) => {
            if (e && e.activePayload && e.activePayload[0]) {
              const warehouse = e.activePayload[0].payload.rawData;
              setSelectedWarehouse(warehouse);

              if (e.nativeEvent && e.nativeEvent.shiftKey) {
                shiftClickManager.addPoint({
                  label: `Warehouse: ${warehouse.warehouse_name}`,
                  value: `Cost: ${formatCurrency(warehouse.total_cost)}`,
                  source: 'Warehouse Comparison Chart'
                }, e.nativeEvent);
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            className="text-muted-foreground text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-muted-foreground text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
          />

          <Bar dataKey="capital" stackId="a" fill={colors.capital} name="Capital Cost" />
          <Bar dataKey="storage" stackId="a" fill={colors.storage} name="Storage Cost" />
          <Bar dataKey="risk" stackId="a" fill={colors.risk} name="Risk Cost" />
          <Bar dataKey="opportunity" stackId="a" fill={colors.opportunity} name="Opportunity Cost" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Selected Warehouse Details */}
      {selectedWarehouse && (
        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-lg">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            {selectedWarehouse.warehouse_name} Details
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total Cost</div>
              <div className="text-sm font-semibold text-accent">
                {formatCurrency(selectedWarehouse.total_cost)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cost Percentage</div>
              <div className="text-sm font-semibold text-foreground">
                {(selectedWarehouse.cost_percentage * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cost per Item</div>
              <div className="text-sm font-semibold text-foreground">
                {formatCurrency(selectedWarehouse.cost_per_item)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Items</div>
              <div className="text-sm font-semibold text-foreground">
                {selectedWarehouse.item_count.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
