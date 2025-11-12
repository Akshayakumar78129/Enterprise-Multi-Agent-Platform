"use client";

import React from 'react';
import { Card } from 'components/index';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useProductPerformanceContext } from '../../context';

import { Line } from '@/lib/chartSetup';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProductPerformanceOverviewProps {
  data: {
    revenue?: number[];
    units?: number[];
    margin?: number[];
    labels?: string[];
  };
  loading?: boolean;
}

export function ProductPerformanceOverview({ data = {}, loading = false }: ProductPerformanceOverviewProps) {
  const context = useProductPerformanceContext();
  const selectionManager = context?.selectionManager;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading overview...</div>
        </div>
      </Card>
    );
  }

  const { revenue = [], units = [], margin = [], labels = [] } = data;

  if (revenue.length === 0 && units.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No overview data available
        </div>
      </Card>
    );
  }

  const chartData = {
    labels: labels.length > 0 ? labels : revenue.map((_, i) => `Period ${i + 1}`),
    datasets: [
      {
        label: 'Revenue ($)',
        data: revenue,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Units Sold',
        data: units,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      },
      {
        label: 'Margin (%)',
        data: margin,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y2'
      }
    ].filter(dataset => dataset.data.length > 0)
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && event.native?.shiftKey && selectionManager) {
        const index = elements[0].index;
        const label = chartData.labels[index];
        const revenueValue = revenue[index] || 0;
        const unitsValue = units[index] || 0;
        const marginValue = margin[index] || 0;
        selectionManager.addPoint({
          label: `Performance at ${label}`,
          value: `Revenue: $${revenueValue.toLocaleString()}, Units: ${unitsValue.toLocaleString()}, Margin: ${marginValue.toFixed(1)}%`,
          source: 'Product Performance Overview'
        }, true);
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue ($)',
          color: '#8b5cf6'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Units',
          color: '#10b981'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value.toLocaleString();
          }
        }
      },
      y2: {
        type: 'linear' as const,
        display: false,
        position: 'right' as const
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Performance Trends</h3>
      </div>
      <div style={{ height: '350px' }}>
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}
