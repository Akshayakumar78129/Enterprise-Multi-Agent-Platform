"use client";

import React, { useState, useMemo } from 'react';
import { Card, getShiftClickManager } from 'components/index';
import { formatCurrency, formatNumber } from '../../utils/formatNumber';
import { calculateCorrelation, getMetricValue } from '../../utils/dataTransformations';

import { CartesianGrid, Line, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from '@/lib/rechartsSetup';
interface PerformanceCorrelationMatrixProps {
  data: any[];
  loading?: boolean;
  selectedDimension?: string;
}

type MetricType = 'revenue' | 'units' | 'aov' | 'growth' | 'margin';

export function PerformanceCorrelationMatrix({
  data,
  loading,
  selectedDimension = 'category'
}: PerformanceCorrelationMatrixProps) {
  const [xMetric, setXMetric] = useState<MetricType>('revenue');
  const [yMetric, setYMetric] = useState<MetricType>('units');
  const shiftClickManager = getShiftClickManager();

  const scatterData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    return data.slice(0, 20).map(item => ({
      x: getMetricValue(item, xMetric),
      y: getMetricValue(item, yMetric),
      z: item.marketShare || item.avgPrice || 100,
      name: item.productName || item.category || item.regionName || 'Unknown',
    }));
  }, [data, xMetric, yMetric]);

  // Use the utility function to calculate correlation
  const correlation = useMemo(() => {
    if (!data || data.length < 2) return { coefficient: 0, strength: 'No data', direction: '' };
    return calculateCorrelation(data, xMetric, yMetric);
  }, [data, xMetric, yMetric]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formatValue = (metric: MetricType, value: number) => {
        if (metric === 'revenue' || metric === 'aov') return formatCurrency(value);
        if (metric === 'growth' || metric === 'margin') return `${formatNumber(value)}%`;
        return formatNumber(value, 0);
      };
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <p className="text-foreground font-semibold mb-2">{data.name}</p>
          <p className="text-cyan-400">{getMetricLabel(xMetric)}: {formatValue(xMetric, data.x)}</p>
          <p className="text-purple-400">{getMetricLabel(yMetric)}: {formatValue(yMetric, data.y)}</p>
        </div>
      );
    }
    return null;
  };

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'revenue': return 'Revenue ($)';
      case 'units': return 'Units Sold';
      case 'aov': return 'Average Order Value ($)';
      case 'growth': return 'Growth Rate (%)';
      case 'margin': return 'Margin (%)';
      default: return 'Value';
    }
  };

  // Handle shift+click on scatter plot points
  const handleScatterClick = (data: any) => {
    if (!shiftClickManager.isShiftKeyPressed()) return;

    // Recharts provides activeLabel and activeIndex when clicking on chart
    if (data.activeLabel !== undefined && data.activeIndex !== undefined) {
      // Find the data point using activeIndex
      const index = typeof data.activeIndex === 'string' ? parseInt(data.activeIndex) : data.activeIndex;
      const payload = scatterData[index];

      if (payload) {
        const formatValue = (metric: MetricType, value: number) => {
          if (metric === 'revenue' || metric === 'aov') return formatCurrency(value);
          if (metric === 'growth' || metric === 'margin') return `${formatNumber(value)}%`;
          return formatNumber(value, 0);
        };
        shiftClickManager.addPoint({
          label: `${selectedDimension}: ${payload.name}`,
          value: `${getMetricLabel(xMetric)}: ${formatValue(xMetric, payload.x)} | ${getMetricLabel(yMetric)}: ${formatValue(yMetric, payload.y)}`,
          source: 'Performance Correlation Matrix',
          chartType: 'scatter'
        }, data);
      }
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading correlation...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <div className="space-y-4">
        {/* Metric selectors */}
        <div className="flex gap-4 px-2 items-center justify-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">X-Axis:</label>
            <select
              value={xMetric}
              onChange={(e) => setXMetric(e.target.value as MetricType)}
              className="px-3 py-1.5 text-sm rounded-md bg-accent/20 text-foreground border border-cyan-400/50 hover:bg-accent/40 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            >
              <option value="revenue">Revenue</option>
              <option value="units">Units</option>
              <option value="aov">Avg Order Value</option>
              <option value="growth">Growth Rate</option>
              <option value="margin">Margin</option>
            </select>
          </div>
          <span className="text-muted-foreground text-sm">vs</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Y-Axis:</label>
            <select
              value={yMetric}
              onChange={(e) => setYMetric(e.target.value as MetricType)}
              className="px-3 py-1.5 text-sm rounded-md bg-accent/20 text-foreground border border-purple-400/50 hover:bg-accent/40 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            >
              <option value="revenue">Revenue</option>
              <option value="units">Units</option>
              <option value="aov">Avg Order Value</option>
              <option value="growth">Growth Rate</option>
              <option value="margin">Margin</option>
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[350px] w-full flex items-center overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 60, left: 30, bottom: 60 }} onClick={handleScatterClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="x"
                name={xMetric}
                stroke="rgba(0,0,0,0.5)"
                tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
                label={{ value: getMetricLabel(xMetric), position: 'insideBottom', offset: -10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
                tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0)}
              />
              <YAxis
                dataKey="y"
                name={yMetric}
                stroke="rgba(0,0,0,0.5)"
                tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
                label={{ value: getMetricLabel(yMetric), angle: -90, position: 'insideLeft', offset: 10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
                tickFormatter={(value) => formatNumber(value, 0)}
              />
              <ZAxis dataKey="z" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter name={selectedDimension?.charAt(0).toUpperCase() + selectedDimension?.slice(1)} data={scatterData} fill="#00e0ff" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Key Correlations */}
        <div className="bg-accent/20 rounded-lg p-3 px-2">
          <div className="text-sm text-foreground text-center">
            <span className="font-semibold">Key Correlations:</span>
            <p className="mt-1 text-muted-foreground">
              <span className="text-cyan-400">{xMetric}</span> ↔ <span className="text-purple-400">{yMetric}</span>: {correlation.strength} {correlation.direction} ({correlation.coefficient.toFixed(2)})
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
