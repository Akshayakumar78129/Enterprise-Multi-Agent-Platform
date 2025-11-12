"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { GrowthRateDataPoint } from '../../services/salesTrendsService';
import { Skeleton } from 'components/index';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface GrowthRateVisualizerProps {
  data: GrowthRateDataPoint[];
  loading?: boolean;
}

export function GrowthRateVisualizer({
  data,
  loading = false
}: GrowthRateVisualizerProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const periods = data.map(d => d.period);
    const growthRates = data.map(d => d.growthRate);
    const avgGrowthRate = data[0]?.avgGrowthRate || 0;

    // Color bars based on positive/negative growth
    const colors = growthRates.map(rate =>
      rate >= 0 ? '#10b981' : '#ef4444'
    );

    return [
      {
        x: periods,
        y: growthRates,
        type: 'bar' as const,
        name: 'Growth Rate',
        marker: {
          color: colors,
          line: {
            color: 'rgba(255,255,255,0.2)',
            width: 1
          }
        },
        hovertemplate: '<b>%{x}</b><br>Growth Rate: %{y:.2f}%<extra></extra>'
      },
      {
        x: periods,
        y: Array(periods.length).fill(avgGrowthRate),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Average Growth',
        line: {
          color: '#f59e0b',
          width: 2,
          dash: 'dash' as const
        },
        hovertemplate: '<b>Average</b><br>%{y:.2f}%<extra></extra>'
      },
      {
        x: periods,
        y: Array(periods.length).fill(0),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Zero Line',
        line: {
          color: 'rgba(255,255,255,0.2)',
          width: 1
        },
        showlegend: false,
        hoverinfo: 'skip'
      }
    ];
  }, [data]);

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
      color: '#9ca3af',
      tickangle: -45
    },
    yaxis: {
      title: 'Growth Rate (%)',
      gridcolor: 'rgba(255,255,255,0.05)',
      showgrid: true,
      zeroline: true,
      zerolinecolor: 'rgba(255,255,255,0.2)',
      zerolinewidth: 2,
      color: '#9ca3af'
    },
    margin: { t: 20, r: 20, b: 100, l: 80 },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      x: 0,
      y: 1.1,
      bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#e5e7eb' }
    },
    hovermode: 'x unified' as const,
    bargap: 0.3,
    hoverlabel: {
      bgcolor: '#ffffff',
      bordercolor: '#d1d5db',
      font: {
        color: '#1f2937',
        size: 13,
        family: 'Inter, system-ui, sans-serif'
      }
    }
  }), []);

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
        No growth rate data available
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
