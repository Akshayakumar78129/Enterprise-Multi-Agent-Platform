"use client";

import React from 'react';
import { ChartCard, getShiftClickManager } from 'components/index';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AgingBucket {
  range: string;
  amount: number;
  npvAdjustedAmount: number;
  count: number;
  percentOfTotal: number;
  valueErosion: number;
  color: string;
}

interface NPVSummary {
  totalValueErosion: number;
  dailyErosionRate: number;
  waccUsed: number;
  totalArBookValue: number;
  totalArNpvAdjusted: number;
  erosionPercentage: number;
}

interface NPVPortfolioChartProps {
  data: AgingBucket[];
  npvSummary?: NPVSummary;
  loading?: boolean;
}

export function NPVPortfolioChart({ data, npvSummary, loading }: NPVPortfolioChartProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading || !data || data.length === 0) {
    return (
      <ChartCard loading={loading}>
        <div className="h-96 flex items-center justify-center text-muted">
          No data available
        </div>
      </ChartCard>
    );
  }

  const chartData = {
    labels: data.map(bucket => bucket.range),
    datasets: [
      {
        label: 'Book Value',
        data: data.map(bucket => bucket.amount),
        backgroundColor: data.map(bucket => bucket.color),
        borderColor: data.map(bucket => bucket.color),
        borderWidth: 2,
      },
      {
        label: 'NPV Adjusted',
        data: data.map(bucket => bucket.npvAdjustedAmount),
        backgroundColor: data.map(bucket => bucket.color + '80'), // Add transparency
        borderColor: data.map(bucket => bucket.color),
        borderWidth: 1,
        borderDash: [5, 5],
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && event?.native?.shiftKey) {
        const index = elements[0].index;
        const bucket = data[index];
        shiftClickManager.addPoint({
          label: `${bucket.range} AR Bucket`,
          value: `Book Value: $${bucket.amount.toLocaleString()}, NPV: $${bucket.npvAdjustedAmount.toLocaleString()}, Erosion: $${bucket.valueErosion.toLocaleString()}`,
          source: 'AR Aging - NPV Portfolio Chart'
        }, event.native);
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#6b46c1',
          font: { size: 12 }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#6b46c1',
        bodyColor: '#4a5568',
        borderColor: '#b794f4',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const bucket = data[context.dataIndex];
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return [
              `${label}: $${value.toLocaleString()}`,
              `Invoice Count: ${bucket.count}`,
              `% of Total: ${bucket.percentOfTotal.toFixed(1)}%`,
              `Value Erosion: $${bucket.valueErosion.toLocaleString()}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(183, 148, 244, 0.1)'
        },
        ticks: {
          color: '#6b46c1',
          font: { size: 11 }
        }
      },
      y: {
        grid: {
          color: 'rgba(183, 148, 244, 0.1)'
        },
        ticks: {
          color: '#6b46c1',
          font: { size: 11 },
          callback: function(value) {
            return '$' + (Number(value) / 1000000).toFixed(1) + 'M';
          }
        }
      }
    }
  };

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "NPV-Adjusted AR Portfolio",
          value: `Total Erosion: $${npvSummary?.totalValueErosion.toLocaleString() || 'N/A'}`,
          source: 'AR Aging - NPV Portfolio Chart'
        }, event.nativeEvent);
      }}
    >
      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>

      {npvSummary && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Total Erosion</p>
            <p className="text-lg font-semibold text-primary">
              ${(npvSummary.totalValueErosion / 1000).toLocaleString()}k
            </p>
            <p className="text-xs text-muted">{npvSummary.erosionPercentage.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Daily Erosion Rate</p>
            <p className="text-lg font-semibold text-accent">
              ${(npvSummary.dailyErosionRate / 1000).toLocaleString()}k
            </p>
            <p className="text-xs text-muted">per day</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">WACC Used</p>
            <p className="text-lg font-semibold text-foreground">
              {npvSummary.waccUsed.toFixed(1)}%
            </p>
            <p className="text-xs text-muted">discount rate</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">NPV vs Book</p>
            <p className="text-lg font-semibold text-foreground">
              ${((npvSummary.totalArBookValue - npvSummary.totalArNpvAdjusted) / 1000).toLocaleString()}k
            </p>
            <p className="text-xs text-muted">difference</p>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
