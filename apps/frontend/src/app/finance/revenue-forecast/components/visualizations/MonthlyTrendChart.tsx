"use client";

import React from 'react';
import { ChartCard, getShiftClickManager } from 'components/index';
import { Line } from '@/lib/chartSetup';
interface MonthlyTrendChartProps {
  data: any[];
  loading?: boolean;
}

export function MonthlyTrendChart({ data, loading }: MonthlyTrendChartProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <ChartCard loading={loading}>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ChartCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ChartCard>
        <div className="h-96 flex items-center justify-center text-muted">
          No monthly trend data available
        </div>
      </ChartCard>
    );
  }

  const chartData = {
    labels: data.map(d => d.month || ''),
    datasets: [
      {
        label: 'Total Revenue',
        data: data.map(d => d.total_revenue || 0),
        borderColor: '#00e0ff',
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Product Revenue',
        data: data.map(d => d.product_revenue || 0),
        borderColor: '#5fd4d6',
        backgroundColor: 'rgba(95, 212, 214, 0.1)',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Service Revenue',
        data: data.map(d => d.service_revenue || 0),
        borderColor: '#43cad0',
        backgroundColor: 'rgba(67, 202, 208, 0.1)',
        fill: false,
        tension: 0.4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(context.parsed.y);
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value);
          }
        }
      }
    }
  };

  // Calculate summary metrics for shift+click
  const totalRevenue = data.reduce((sum, d) => sum + (d.total_revenue || 0), 0);
  const avgRevenue = totalRevenue / data.length;
  const latestMonth = data[data.length - 1];

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Monthly Revenue Trend",
          value: `Latest: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(latestMonth?.total_revenue || 0)} | Avg: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(avgRevenue)}`,
          source: 'Revenue Forecast - Monthly Trend'
        }, event.nativeEvent);
      }}
    >
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
