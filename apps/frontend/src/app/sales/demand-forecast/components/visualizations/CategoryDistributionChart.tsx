"use client";

import React, { useMemo } from 'react';
import { BarChart } from 'components';

interface DistributionDataPoint {
  category: string;
  quantity: number;
  value: number;
  item_count: number;
  transaction_count: number;
}

interface CategoryDistributionChartProps {
  data: DistributionDataPoint[];
  loading?: boolean;
}

export function CategoryDistributionChart({ data, loading }: CategoryDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Extract labels - replace 'Unknown' with 'Uncategorized'
    const labels = data.map(d => {
      const category = d.category || 'Unknown';
      return category === 'Unknown' ? 'Uncategorized' : category;
    });

    // Create datasets
    const datasets = [
      {
        label: 'Quantity',
        data: data.map(d => d.quantity || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Value ($K)',
        data: data.map(d => (d.value || 0) / 1000), // Convert to thousands
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      }
    ];

    return { labels, datasets };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-muted-foreground">Loading distribution data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-muted-foreground">No distribution data available</div>
      </div>
    );
  }

  return (
    <BarChart
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
              text: 'Category',
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
                  if (label.includes('$K')) {
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
