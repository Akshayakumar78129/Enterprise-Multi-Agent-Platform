"use client";

import React, { useMemo, useEffect } from 'react';
import { LineChart } from 'components';

interface TrendDataPoint {
  month: string;
  quantity: number;
  value: number;
  item_count: number;
}

interface DemandTrendChartProps {
  data: TrendDataPoint[];
  loading?: boolean;
}

export function DemandTrendChart({ data, loading }: DemandTrendChartProps) {
  // Debug logging
  useEffect(() => {
    console.log('[DemandTrendChart] Received data:', data);
    console.log('[DemandTrendChart] Data length:', data?.length);
    console.log('[DemandTrendChart] Loading:', loading);
  }, [data, loading]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Extract labels (months)
    const labels = data.map(d => {
      const date = new Date(d.month);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    // Create datasets
    const datasets = [
      {
        label: 'Quantity',
        data: data.map(d => d.quantity || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Value ($)',
        data: data.map(d => (d.value || 0) / 1000), // Convert to thousands
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
      }
    ];

    return { labels, datasets };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-muted-foreground">Loading trend data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-muted-foreground">No trend data available</div>
      </div>
    );
  }

  return (
    <LineChart
      data={chartData}
      height={300}
      showLegend={true}
      options={{
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantity / Value ($K)',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            ticks: {
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          }
        },
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  if (label.includes('Value')) {
                    label += '$' + context.parsed.y.toLocaleString() + 'K';
                  } else {
                    label += context.parsed.y.toLocaleString();
                  }
                }
                return label;
              }
            }
          }
        }
      }}
    />
  );
}
