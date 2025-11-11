"use client";

import React, { useState, useMemo } from 'react';
import { Card, getShiftClickManager } from 'components/index';
import { formatCurrency, formatNumber } from '../../utils/formatNumber';
import { transformForHorizontalBar, getPerformanceColor } from '../../utils/dataTransformations';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from '@/lib/rechartsSetup';
interface PerformanceOverviewProps {
  data: any[];
  loading?: boolean;
  selectedDimension?: string;
  selectedMetric?: string;
}

export function PerformanceOverview({ data, loading, selectedDimension = 'category', selectedMetric = 'revenue' }: PerformanceOverviewProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const shiftClickManager = getShiftClickManager();

  // Transform data for horizontal bar chart with limit of 20
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Use transformation utility
    const transformed = transformForHorizontalBar(data, 20);

    return transformed.map(item => ({
      name: item.productName || item.category || item.regionName || item.name || 'Unknown',
      revenue: item.revenue || 0,
      units: item.unitsSold || item.units || 0,
    }));
  }, [data]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const total = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const topItem = data.length > 0 ? data[0] : null;
    const topPerformerName = topItem?.productName || topItem?.category || topItem?.regionName || null;
    const contributionPct = topItem && total > 0 ? ((topItem.revenue || 0) / total * 100).toFixed(0) : null;

    return {
      total,
      contribution: contributionPct ? `${contributionPct}%` : null,
      topPerformer: topPerformerName
    };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <p className="text-foreground font-semibold mb-2">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? formatCurrency(entry.value) : formatNumber(entry.value, 0)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate colors for gradient based on revenue values
  const barColors = useMemo(() => {
    if (chartData.length === 0) return [];
    const revenues = chartData.map(d => d.revenue);
    const min = Math.min(...revenues);
    const max = Math.max(...revenues);
    return revenues.map(revenue => getPerformanceColor(revenue, min, max));
  }, [chartData]);

  const metricLabel = selectedMetric === 'revenue' ? 'Revenue ($)' :
                      selectedMetric === 'units_sold' ? 'Units Sold' :
                      'Value';

  // Handle shift+click on chart elements
  const handleChartClick = (data: any) => {
    if (!shiftClickManager.isShiftKeyPressed()) return;

    // Recharts provides activeLabel and activeIndex when clicking on chart
    if (data.activeLabel !== undefined && data.activeIndex !== undefined) {
      // Find the data point using activeIndex or activeLabel
      const index = typeof data.activeIndex === 'string' ? parseInt(data.activeIndex) : data.activeIndex;
      const payload = chartData[index];

      if (payload) {
        shiftClickManager.addPoint({
          label: `${selectedDimension}: ${payload.name}`,
          value: `Revenue: ${formatCurrency(payload.revenue)} | Units: ${formatNumber(payload.units, 0)}`,
          source: `Performance Overview - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
          chartType: chartType
        }, data);
      }
    }
  };

  // Handle loading and empty states
  if (loading) {
    return (
      <Card className="glass-card">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading performance overview...</div>
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="glass-card">
        <div className="h-96 flex items-center justify-center">
          <div className="text-muted-foreground">No data available</div>
        </div>
      </Card>
    );
  }

  const renderChart = () => {
    const commonMargin = { top: 20, right: 140, left: 150, bottom: 20 };

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 140, left: 30, bottom: 60 }} onClick={handleChartClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="name"
              stroke="rgba(0,0,0,0.5)"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
              label={{ value: selectedDimension?.charAt(0).toUpperCase() + selectedDimension?.slice(1), position: 'insideBottom', offset: -10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(0,0,0,0.5)"
              label={{ value: metricLabel, angle: -90, position: 'insideLeft', offset: 10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
              tickFormatter={(value) => formatCompactNumber(value)}
              tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="revenue" stroke="#00e0ff" strokeWidth={2} name="Revenue" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="units" stroke="#e930ff" strokeWidth={2} name="Units" dot={{ r: 3 }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData} margin={{ top: 20, right: 140, left: 30, bottom: 60 }} onClick={handleChartClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="name"
              stroke="rgba(0,0,0,0.5)"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
              label={{ value: selectedDimension?.charAt(0).toUpperCase() + selectedDimension?.slice(1), position: 'insideBottom', offset: -10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(0,0,0,0.5)"
              label={{ value: metricLabel, angle: -90, position: 'insideLeft', offset: 10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
              tickFormatter={(value) => formatCompactNumber(value)}
              tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Area type="monotone" dataKey="revenue" stroke="#00e0ff" fill="rgba(0, 224, 255, 0.3)" name="Revenue" />
            <Area type="monotone" dataKey="units" stroke="#e930ff" fill="rgba(233, 48, 255, 0.3)" name="Units" />
          </AreaChart>
        );
      default:
        // HORIZONTAL Bar Chart (default)
        return (
          <BarChart data={chartData} layout="vertical" margin={commonMargin} onClick={handleChartClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              type="number"
              stroke="rgba(0,0,0,0.5)"
              tickFormatter={(value) => formatCompactNumber(value)}
              tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
              label={{ value: metricLabel, position: 'insideBottom', offset: -10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="rgba(0,0,0,0.5)"
              tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="revenue" name="Revenue" fill="#00e0ff">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index]} />
              ))}
            </Bar>
            <Bar dataKey="units" fill="#e930ff" name="Units" />
          </BarChart>
        );
    }
  };

  return (
    <Card className="glass-card">
      <div className="space-y-4">
        {/* Chart type toggles */}
        <div className="flex justify-end items-center px-2">
          <div className="flex gap-2">
            {(['bar', 'line', 'area'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  chartType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent/20 text-muted-foreground hover:bg-accent/40'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px] w-full flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Summary Metrics */}
        {summaryMetrics && (
          <div className="flex justify-around bg-accent/20 rounded-lg p-3">
            <div className="text-center">
              <span className="text-xs text-muted-foreground opacity-70">Total {selectedMetric}:</span>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(summaryMetrics.total)}</p>
            </div>
            {summaryMetrics.contribution && (
              <div className="text-center">
                <span className="text-xs text-muted-foreground opacity-70">Contribution:</span>
                <p className="text-sm font-semibold text-foreground">{summaryMetrics.contribution}</p>
              </div>
            )}
            {summaryMetrics.topPerformer && (
              <div className="text-center">
                <span className="text-xs text-muted-foreground opacity-70">Top {selectedDimension?.charAt(0).toUpperCase() + selectedDimension?.slice(1)}:</span>
                <p className="text-sm font-semibold text-foreground">{summaryMetrics.topPerformer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function formatCompactNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}
