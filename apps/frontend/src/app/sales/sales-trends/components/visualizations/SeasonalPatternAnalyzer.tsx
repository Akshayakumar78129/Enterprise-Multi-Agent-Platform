"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SeasonalityDataPoint } from '../../services/salesTrendsService';
import { Skeleton } from 'components/index';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface SeasonalPatternAnalyzerProps {
  data: SeasonalityDataPoint[];
  loading?: boolean;
}

export function SeasonalPatternAnalyzer({
  data,
  loading = false
}: SeasonalPatternAnalyzerProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group data by year and month for time series
    const years = Array.from(new Set(data.map(d => d.year))).sort();
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Color palette for different years
    const colorPalette = [
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f59e0b', // amber
      '#10b981', // emerald
      '#ec4899', // pink
      '#f97316', // orange
      '#3b82f6', // blue
    ];

    const traces: any[] = [];

    // Create a line for each year
    years.forEach((year, yearIdx) => {
      const yearData = months.map(month => {
        const dataPoint = data.find(d => d.year === year && d.month === month);
        return dataPoint ? dataPoint.revenue : null;
      });

      traces.push({
        x: monthNames,
        y: yearData,
        type: 'scatter' as const,
        mode: 'lines+markers' as const,
        name: year,
        line: {
          color: colorPalette[yearIdx % colorPalette.length],
          width: 2.5,
          shape: 'spline' as const
        },
        marker: {
          size: 7,
          color: colorPalette[yearIdx % colorPalette.length],
          line: {
            color: '#ffffff',
            width: 1.5
          }
        },
        hovertemplate: `<b style="color: #1f2937">${year} - %{x}</b><br><span style="color: #1f2937">Revenue: $%{y:,.2f}</span><extra></extra>`
      });
    });

    // Calculate average seasonal pattern across all years
    const avgSeasonalPattern = months.map((month, idx) => {
      const monthData = data.filter(d => d.month === month);
      if (monthData.length === 0) return null;
      const sum = monthData.reduce((acc, d) => acc + d.revenue, 0);
      return sum / monthData.length;
    });

    // Add average pattern line (more prominent)
    traces.push({
      x: monthNames,
      y: avgSeasonalPattern,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Average Pattern',
      line: {
        color: '#ffffff',
        width: 3,
        dash: 'dash' as const
      },
      hovertemplate: '<b style="color: #1f2937">Average - %{x}</b><br><span style="color: #1f2937">Revenue: $%{y:,.2f}</span><extra></extra>'
    });

    return traces;
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
      title: 'Month',
      gridcolor: 'rgba(255,255,255,0.05)',
      showgrid: true,
      zeroline: false,
      color: '#9ca3af'
    },
    yaxis: {
      title: 'Revenue ($)',
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
      font: {
        color: '#1f2937',
        size: 12,
        family: 'Inter, system-ui, sans-serif'
      }
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
        No seasonality data available
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
