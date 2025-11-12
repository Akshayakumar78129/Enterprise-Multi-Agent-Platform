"use client";

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getShiftClickManager } from 'components/index';

interface TrendDataPoint {
  period: string;
  total_cost: number;
  capital_cost: number;
  storage_cost: number;
  risk_cost: number;
  opportunity_cost: number;
  item_count?: number;
}

interface CostTrendAnalyzerProps {
  data: TrendDataPoint[];
  loading?: boolean;
}

export function CostTrendAnalyzer({ data, loading = false }: CostTrendAnalyzerProps) {
  const shiftClickManager = getShiftClickManager();

  const colors = {
    capital: '#3b82f6',      // Blue
    storage: '#10b981',      // Green
    risk: '#f59e0b',         // Amber
    opportunity: '#8b5cf6',  // Purple
    totalCost: '#06b6d4'     // Cyan
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('%') ? formatPercentage(entry.value) : formatCurrency(entry.value)}
            </p>
          ))}
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
        No trend data available
      </div>
    );
  }

  return (
    <div
      className="bg-surface border border-border rounded-lg p-6 cursor-pointer hover:border-accent/50 transition-colors"
      onClick={(e) => {
        if (e.shiftKey) {
          shiftClickManager.addPoint({
            label: 'Cost Trend Analysis',
            value: `${data.length} data points`,
            source: 'Cost Trend Chart'
          }, e.nativeEvent);
        }
      }}
    >
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="period"
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
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          <Area
            type="monotone"
            dataKey="capital_cost"
            stackId="1"
            stroke={colors.capital}
            fill={colors.capital}
            fillOpacity={0.8}
            strokeWidth={2}
            name="Capital Cost"
          />
          <Area
            type="monotone"
            dataKey="storage_cost"
            stackId="1"
            stroke={colors.storage}
            fill={colors.storage}
            fillOpacity={0.8}
            strokeWidth={2}
            name="Storage Cost"
          />
          <Area
            type="monotone"
            dataKey="risk_cost"
            stackId="1"
            stroke={colors.risk}
            fill={colors.risk}
            fillOpacity={0.8}
            strokeWidth={2}
            name="Risk Cost"
          />
          <Area
            type="monotone"
            dataKey="opportunity_cost"
            stackId="1"
            stroke={colors.opportunity}
            fill={colors.opportunity}
            fillOpacity={0.8}
            strokeWidth={2}
            name="Opportunity Cost"
          />

          <Line
            type="monotone"
            dataKey="total_cost"
            stroke={colors.totalCost}
            strokeWidth={4}
            dot={{ fill: colors.totalCost, r: 6 }}
            name="Total Cost"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
