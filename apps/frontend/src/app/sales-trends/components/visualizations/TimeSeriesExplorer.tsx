"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TimeSeriesDataPoint } from '../../services/salesTrendsService';
import { Skeleton } from 'components/index';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface TimeSeriesExplorerProps {
  data: TimeSeriesDataPoint[];
  loading?: boolean;
  selectedMetric?: string;
}

export function TimeSeriesExplorer({
  data,
  loading = false,
  selectedMetric = 'revenue'
}: TimeSeriesExplorerProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const periods = data.map(d => d.period);

    // Main metric trace
    const metricValues = data.map(d => {
      switch (selectedMetric) {
        case 'units': return d.units;
        case 'aov': return d.avgOrderValue;
        case 'margin': return d.avgOrderValue; // Note: margin not in time series, using AOV as fallback
        default: return d.revenue;
      }
    });

    // Moving average trace
    const movingAvgValues = data.map(d => d.movingAverage || null);

    const metricNames: Record<string, string> = {
      revenue: 'Revenue',
      units: 'Units Sold',
      aov: 'Avg Order Value',
      margin: 'Avg Order Value'
    };

    return [
      {
        x: periods,
        y: metricValues,
        type: 'scatter' as const,
        mode: 'lines+markers' as const,
        name: metricNames[selectedMetric] || 'Revenue',
        line: {
          color: '#8b5cf6',
          width: 3,
          shape: 'spline' as const
        },
        marker: {
          size: 8,
          color: '#8b5cf6',
          line: {
            color: '#ffffff',
            width: 2
          }
        },
        hovertemplate: `<b style="color: #1f2937">%{x}</b><br><span style="color: #1f2937">${metricNames[selectedMetric]}: %{y:,.2f}</span><extra></extra>`
      },
      {
        x: periods,
        y: movingAvgValues,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: '3-Period Moving Avg',
        line: {
          color: '#f59e0b',
          width: 2,
          dash: 'dash' as const
        },
        hovertemplate: '<b style="color: #1f2937">%{x}</b><br><span style="color: #1f2937">Moving Avg: %{y:,.2f}</span><extra></extra>'
      }
    ];
  }, [data, selectedMetric]);

  const layout = useMemo(() => ({
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Inter, system-ui, sans-serif',
      color: '#e5e7eb'
    },
    xaxis: {
      title: 'Time Period',
      gridcolor: 'rgba(255,255,255,0.05)',
      showgrid: true,
      zeroline: false,
      color: '#9ca3af'
    },
    yaxis: {
      title: selectedMetric === 'revenue' || selectedMetric === 'aov' ? 'Amount ($)' : 'Quantity',
      gridcolor: 'rgba(255,255,255,0.05)',
      showgrid: true,
      zeroline: false,
      color: '#9ca3af'
    },
    margin: { t: 20, r: 20, b: 60, l: 80 },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      x: 0,
      y: 1.1,
      bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#e5e7eb' }
    },
    hovermode: 'x unified' as const,
    hoverlabel: {
      bgcolor: '#ffffff',
      bordercolor: '#d1d5db',
      font: {
        color: '#1f2937',
        size: 13,
        family: 'Inter, system-ui, sans-serif'
      }
    }
  }), [selectedMetric]);

  const config = {
    responsive: true,
    displayModeBar: false,
    displaylogo: false
  };

  if (loading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No time series data available
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <Plot
        data={chartData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}
