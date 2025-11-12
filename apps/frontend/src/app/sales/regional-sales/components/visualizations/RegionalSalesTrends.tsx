"use client";

import React, { useMemo } from 'react';
import { Line, ChartOptions } from '@/lib/chartSetup';
import { Skeleton } from 'components/index';

interface TimeSeriesData {
  period: string;
  country: string;
  state: string;
  totalSales: number;
  netSales: number;
  totalQuantity: number;
  grossProfit: number;
  customerCount: number;
  transactionCount: number;
}

interface RegionalSalesTrendsProps {
  data: TimeSeriesData[];
  loading?: boolean;
}

export function RegionalSalesTrends({ data, loading }: RegionalSalesTrendsProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Group by period and aggregate
    const periodMap = new Map<string, number>();

    data.forEach(item => {
      const current = periodMap.get(item.period) || 0;
      periodMap.set(item.period, current + item.totalSales);
    });

    // Sort periods chronologically
    const periods = Array.from(periodMap.keys()).sort();
    const sales = periods.map(p => periodMap.get(p) || 0);

    return {
      labels: periods,
      datasets: [
        {
          label: 'Total Sales',
          data: sales,
          borderColor: 'rgb(56, 189, 248)',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
  }, [data]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend to avoid the blue box
      },
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
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Period',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Total Sales ($)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10
          },
          callback: function(value) {
            return '$' + (Number(value) / 1000).toFixed(0) + 'K';
          }
        }
      }
    }
  };

  if (loading) {
    return <Skeleton height={400} className="animate-pulse" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">No time series data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div style={{ height: '400px', position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
