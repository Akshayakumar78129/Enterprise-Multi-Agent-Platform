"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { getShiftClickManager } from '../selection/ShiftClickSelectionManager';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      borderWidth?: number;
      fill?: boolean;
    }>;
  };
  title?: string;
  height?: number;
  showLegend?: boolean;
  className?: string;
  onPointClick?: (datasetLabel: string, label: string, value: number, event: any) => void;
  options?: ChartOptions<'line'>;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  height = 300,
  showLegend = true,
  className = "",
  onPointClick,
  options: externalOptions
}) => {
  const shiftClickManager = getShiftClickManager();
  const defaultOptions: ChartOptions<'line'> = {
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const dataset = data.datasets[datasetIndex];
        const label = data.labels[index];
        const value = dataset.data[index];

        // Check for shift key
        const nativeEvent = (event as any).native;
        if (nativeEvent?.shiftKey) {
          shiftClickManager.addPoint({
            label: `${dataset.label}: ${label}`,
            value: value.toString(),
            source: title || 'Line Chart'
          }, nativeEvent);
        } else if (onPointClick) {
          onPointClick(dataset.label, label, value, event);
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
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

  // Apply default colors if not provided
  // Handle empty or invalid data gracefully
  const chartData = {
    labels: data?.labels || [],
    datasets: (data?.datasets || []).map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || `hsl(var(--primary) / ${1 - index * 0.2})`,
      backgroundColor: dataset.backgroundColor || `hsl(var(--primary) / ${0.1})`,
      borderWidth: dataset.borderWidth || 2,
      fill: dataset.fill !== undefined ? dataset.fill : false
    }))
  };

  // Merge external options with default options, preserving onClick handler
  const mergedOptions = externalOptions ? {
    ...externalOptions,
    onClick: defaultOptions.onClick
  } : defaultOptions;

  return (
    <div className={className}>
      <div style={{ height }}>
        <Line options={mergedOptions} data={chartData} />
      </div>
    </div>
  );
};