"use client";

import React from 'react';
import { ChartCard, getShiftClickManager } from 'components/index';
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
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ForecastPoint {
  date: string;
  predictedAmount: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
}

interface CollectionForecastProps {
  data: ForecastPoint[];
  loading?: boolean;
}

export function CollectionForecast({ data, loading }: CollectionForecastProps) {
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
    labels: data.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Upper Bound (Optimistic)',
        data: data.map(point => point.upperBound),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: '+1',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4
      },
      {
        label: 'Predicted Collection',
        data: data.map(point => point.predictedAmount),
        borderColor: '#b794f4',
        backgroundColor: 'rgba(183, 148, 244, 0.2)',
        borderWidth: 3,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#b794f4',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4
      },
      {
        label: 'Lower Bound (Conservative)',
        data: data.map(point => point.lowerBound),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        fill: '-1',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#6b46c1',
          font: { size: 12 },
          usePointStyle: true,
          padding: 15
        }
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
            const point = data[context.dataIndex];
            const label = context.dataset.label || '';
            const value = context.parsed.y;

            if (label.includes('Predicted')) {
              return [
                `${label}: $${value.toLocaleString()}`,
                `Confidence: ${point.confidence}%`,
                `Range: $${point.lowerBound.toLocaleString()} - $${point.upperBound.toLocaleString()}`
              ];
            }
            return `${label}: $${value.toLocaleString()}`;
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
            return '$' + (Number(value) / 1000).toFixed(0) + 'k';
          }
        }
      }
    }
  };

  // Calculate summary stats
  const totalPredicted = data.reduce((sum, point) => sum + point.predictedAmount, 0);
  const avgConfidence = data.reduce((sum, point) => sum + point.confidence, 0) / data.length;
  const week4Milestone = data[3]?.predictedAmount || 0;
  const week8Milestone = data[7]?.predictedAmount || 0;

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Collection Forecast",
          value: `8-Week Total: $${(totalPredicted / 1000000).toFixed(2)}M, Avg Confidence: ${avgConfidence.toFixed(1)}%`,
          source: 'AR Aging - Collection Forecast'
        }, event.nativeEvent);
      }}
    >
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>

      {/* Forecast Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border h-[88px]">
        <div>
          <p className="text-xs text-foreground-muted">8-Week Total</p>
          <p className="text-lg font-semibold text-primary">
            ${(totalPredicted / 1000000).toFixed(2)}M
          </p>
          <p className="text-xs text-muted">expected collections</p>
        </div>
        <div>
          <p className="text-xs text-foreground-muted">Avg Confidence</p>
          <p className="text-lg font-semibold text-foreground">
            {avgConfidence.toFixed(0)}%
          </p>
          <p className="text-xs text-muted">forecast accuracy</p>
        </div>
        <div>
          <p className="text-xs text-foreground-muted">30-Day Milestone</p>
          <p className="text-lg font-semibold text-accent">
            ${(week4Milestone / 1000).toLocaleString()}k
          </p>
          <p className="text-xs text-muted">week 4 target</p>
        </div>
        <div>
          <p className="text-xs text-foreground-muted">60-Day Milestone</p>
          <p className="text-lg font-semibold text-foreground">
            ${(week8Milestone / 1000).toLocaleString()}k
          </p>
          <p className="text-xs text-muted">week 8 target</p>
        </div>
      </div>
    </ChartCard>
  );
}
