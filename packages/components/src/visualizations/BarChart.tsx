"use client";

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Card } from '../ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data?: {
    labels?: string[];
    datasets?: Array<{
      label?: string;
      data?: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  title?: string;
  height?: number;
  showLegend?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 300,
  showLegend = true,
  horizontal = false,
  stacked = false,
  className = ""
}) => {
  // Provide fallback data if none is provided
  const defaultData = {
    labels: [],
    datasets: []
  };
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        color: 'hsl(var(--foreground))',
        font: {
          size: 14,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        stacked: stacked,
        grid: {
          color: 'hsl(var(--border) / 0.3)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 11
          }
        }
      },
      y: {
        stacked: stacked,
        grid: {
          color: 'hsl(var(--border) / 0.3)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Apply default colors if not provided, with proper null/undefined checks
  const safeData = data || defaultData;
  const chartData = {
    labels: safeData.labels || [],
    datasets: (safeData.datasets || []).map((dataset, index) => ({
      label: dataset?.label || `Dataset ${index + 1}`,
      data: dataset?.data || [],
      backgroundColor: dataset?.backgroundColor || `hsl(var(--primary) / ${0.8 - index * 0.1})`,
      borderColor: dataset?.borderColor || `hsl(var(--primary))`,
      borderWidth: dataset?.borderWidth || 1
    }))
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div style={{ height }}>
        <Bar options={options} data={chartData} />
      </div>
    </Card>
  );
};