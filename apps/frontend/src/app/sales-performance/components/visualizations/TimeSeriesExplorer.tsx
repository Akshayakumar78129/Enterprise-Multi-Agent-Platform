"use client";

import React, { useState, useMemo } from 'react';
import { Card, getShiftClickManager } from 'components/index';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatNumber';
import { aggregateByGranularity, type Granularity } from '../../utils/dataTransformations';

interface TimeSeriesExplorerProps {
  data: any[];
  loading?: boolean;
  selectedMetric?: string;
}

export function TimeSeriesExplorer({ data, loading, selectedMetric = 'revenue' }: TimeSeriesExplorerProps) {
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const shiftClickManager = getShiftClickManager();

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Use the aggregateByGranularity utility to actually aggregate data
    const aggregated = aggregateByGranularity(data, granularity);

    return aggregated.map(item => ({
      date: item.date || '',
      revenue: item.revenue || 0,
      units: item.units || 0,
      customers: item.customers || 0,
    }));
  }, [data, granularity]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <p className="text-foreground font-semibold mb-2">{label}</p>
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

  const metricLabel = selectedMetric === 'revenue' ? 'Revenue ($)' :
                      selectedMetric === 'units_sold' ? 'Units Sold' :
                      'Value';

  // Handle shift+click on chart elements
  const handleChartClick = (data: any) => {
    if (!shiftClickManager.isShiftKeyPressed()) return;

    // Recharts provides activeLabel and activeIndex when clicking on chart
    if (data.activeLabel !== undefined && data.activeIndex !== undefined) {
      // Find the data point using activeIndex
      const index = typeof data.activeIndex === 'string' ? parseInt(data.activeIndex) : data.activeIndex;
      const payload = chartData[index];

      if (payload) {
        shiftClickManager.addPoint({
          label: `Date: ${payload.date}`,
          value: `Revenue: ${formatCurrency(payload.revenue)} | Units: ${formatNumber(payload.units, 0)}`,
          source: `Time Series Explorer (${granularity.charAt(0).toUpperCase() + granularity.slice(1)})`,
          chartType: 'line'
        }, data);
      }
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading time series...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <div className="space-y-4">
        {/* Granularity controls */}
        <div className="flex justify-end items-center px-2">
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setGranularity(type)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  granularity === type
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
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 60, left: 30, bottom: 60 }}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(0,0,0,0.5)"
                tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
                label={{ value: 'Date', position: 'insideBottom', offset: -10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
              />
              <YAxis
                stroke="rgba(0,0,0,0.5)"
                label={{ value: metricLabel, angle: -90, position: 'insideLeft', offset: 10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
                tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0)}
                tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="revenue" stroke="#00e0ff" strokeWidth={2} name="Revenue" dot={{ r: 2 }} />
              <Line type="monotone" dataKey="units" stroke="#e930ff" strokeWidth={2} name="Units" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
