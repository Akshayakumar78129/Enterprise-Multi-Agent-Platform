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
  Legend
} from 'chart.js';
import { useProductPerformanceContext } from '../../context';

import { Line } from '@/lib/chartSetup';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TrendData {
  date: string;
  [key: string]: string | number;
}

interface ProductTrendsTimeSeriesProps {
  data: TrendData[];
  loading?: boolean;
}

export function ProductTrendsTimeSeries({ data = [], loading = false }: ProductTrendsTimeSeriesProps) {
  const context = useProductPerformanceContext();
  const selectionManager = context?.selectionManager;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading trends...</div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No trend data available
        </div>
      </Card>
    );
  }

  // Extract metric keys (excluding 'date')
  const metricKeys = Object.keys(data[0] || {}).filter(key => key !== 'date');
  const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  const chartData = {
    labels: data.map(d => d.date),
    datasets: metricKeys.slice(0, 5).map((key, index) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      data: data.map(d => d[key] as number),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      tension: 0.4,
      fill: true
    }))
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
        const dataPoint = data[index];
        const metricsStr = metricKeys
          .map(key => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${dataPoint[key]}`)
          .join(', ');
        selectionManager.addPoint({
          label: `Trends on ${dataPoint.date}`,
          value: metricsStr,
          source: 'Product Trends Time Series'
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
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Product Performance Trends</h3>
      </div>
      <div style={{ height: '350px' }}>
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}
