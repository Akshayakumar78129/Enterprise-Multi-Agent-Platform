"use client";

import React, { useMemo } from 'react';
import { BarChart } from 'components';

interface PerformanceDataPoint {
  item: string;
  category: string;
  quantity: number;
  value: number;
  transaction_count: number;
  avg_transaction_value: number;
}

interface PerformanceMetricsChartProps {
  data: PerformanceDataPoint[];
  loading?: boolean;
}

export function PerformanceMetricsChart({ data, loading }: PerformanceMetricsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Extract labels (items with category only if available)
    const labels = data.map(d => {
      const category = d.category && d.category !== 'Unknown' ? d.category : null;
      return category ? `${d.item} (${category})` : d.item;
    });

    // Create dataset for total value
    const datasets = [
      {
        label: 'Total Value ($K)',
        data: data.map(d => (d.value || 0) / 1000), // Convert to thousands
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      }
    ];

    return { labels, datasets };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-muted-foreground">Loading performance data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-muted-foreground">No performance data available</div>
      </div>
    );
  }

  return (
    <BarChart
      data={chartData}
      height={300}
      showLegend={true}
      horizontal={true}
      options={{
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Total Value ($K)',
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
          y: {
            title: {
              display: true,
              text: 'Item',
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
                if (context.parsed.x !== null) {
                  label += '$' + context.parsed.x.toLocaleString() + 'K';
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
