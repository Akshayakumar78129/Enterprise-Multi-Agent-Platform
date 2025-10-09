"use client";

import React, { useState, useMemo } from 'react';
import { Card, getShiftClickManager } from 'components/index';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatNumber';
import { filterByLimit } from '../../utils/dataTransformations';

interface PerformanceDistributionAnalyzerProps {
  data: any[];
  loading?: boolean;
  selectedDimension?: string;
  selectedMetric?: string;
}

const COLORS = ['#00e0ff', '#e930ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

type ChartType = 'bar' | 'pie';

export function PerformanceDistributionAnalyzer({
  data,
  loading,
  selectedDimension = 'category',
  selectedMetric = 'revenue'
}: PerformanceDistributionAnalyzerProps) {
  const [chartType, setChartType] = useState<ChartType>('pie');
  const shiftClickManager = getShiftClickManager();

  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Always show top 10
    const filtered = filterByLimit(data, 'top10');

    return filtered.map(item => ({
      name: item.productName || item.category || item.regionName || 'Unknown',
      value: item.revenue || item.units || 0,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <p className="text-foreground font-semibold mb-2">{data.name}</p>
          <p style={{ color: data.payload.fill }}>
            Value: {selectedMetric === 'revenue' ? formatCurrency(data.value) : formatNumber(data.value, 0)}
          </p>
          <p className="text-muted-foreground text-sm">
            {((data.value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle shift+click on chart elements
  const handleChartClick = (data: any) => {
    // For Pie chart, data comes directly; for Bar chart, it's in activePayload
    const payload = data.name ? data : (data.activePayload && data.activePayload[0] ? data.activePayload[0].payload : null);

    if (payload && shiftClickManager.isShiftKeyPressed()) {
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((payload.value / total) * 100).toFixed(1);
      shiftClickManager.addPoint({
        label: `${selectedDimension}: ${payload.name}`,
        value: `${selectedMetric === 'revenue' ? formatCurrency(payload.value) : formatNumber(payload.value, 0)} (${percentage}%)`,
        source: `Performance Distribution - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
        chartType: chartType
      }, data);
    }
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <PieChart>
          <Pie
            data={chartData}
            cx="40%"
            cy="50%"
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            onClick={handleChartClick}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ paddingLeft: '20px' }}
          />
        </PieChart>
      );
    } else if (chartType === 'bar') {
      return (
        <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 120, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis
            type="number"
            stroke="rgba(0,0,0,0.5)"
            tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
            label={{ value: 'Revenue', position: 'insideBottom', offset: -10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
          />
          <YAxis
            dataKey="name"
            type="category"
            stroke="rgba(0,0,0,0.5)"
            tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill="#00e0ff" name="Value" onClick={handleChartClick} />
        </BarChart>
      );
    } else {
      // Treemap placeholder - can be enhanced with actual treemap component
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Treemap view coming soon...
        </div>
      );
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading distribution...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex justify-end items-center px-2">
          <div className="flex gap-2">
            {(['bar', 'pie'] as const).map((type) => (
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
      </div>
    </Card>
  );
}
