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
import { getShiftClickManager } from '../selection/ShiftClickSelectionManager';

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
  onBarClick?: (datasetLabel: string, label: string, value: number, event: any) => void;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  height = 300,
  showLegend = true,
  horizontal = false,
  stacked = false,
  className = "",
  onBarClick
}) => {
  const shiftClickManager = getShiftClickManager();
  // Provide fallback data if none is provided
  const defaultData = {
    labels: [],
    datasets: []
  };
  const options: ChartOptions<'bar'> = {
    onClick: (event, elements) => {
      if (elements.length > 0 && data) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const dataset = data.datasets?.[datasetIndex];
        const label = data.labels?.[index];
        const value = dataset?.data?.[index];

        if (dataset && label && value !== undefined) {
          // Check for shift key
          const nativeEvent = (event as any).native;
          if (nativeEvent?.shiftKey) {
            shiftClickManager.addPoint({
              label: `${dataset.label || 'Value'}: ${label}`,
              value: value.toString(),
              source: title || 'Bar Chart'
            }, nativeEvent);
          } else if (onBarClick) {
            onBarClick(dataset.label || '', label, value, event);
          }
        }
      }
    },
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
      <div style={{ height, width: '100%', position: 'relative' }}>
        <Bar options={options} data={chartData} />
      </div>
    </Card>
  );
};