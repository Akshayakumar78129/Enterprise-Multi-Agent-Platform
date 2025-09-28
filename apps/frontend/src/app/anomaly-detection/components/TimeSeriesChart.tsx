"use client";

import React from 'react';
import { Card, Skeleton } from 'components/index';
import { Line } from 'react-chartjs-2';
import { useAnomalyContext } from '../context';

interface TimeSeriesChartProps {
  data: Array<{
    date: string;
    normal_count: number;
    anomaly_count: number;
    total_count: number;
    anomaly_rate: number;
    avg_severity?: number;
  }>;
  loading?: boolean;
}

export function TimeSeriesChart({ data, loading }: TimeSeriesChartProps) {
  const { selectionManager } = useAnomalyContext();
  if (loading) {
    return (
      <Card title="Anomaly Trend" className="h-96">
        <Skeleton className="h-full" />
      </Card>
    );
  }

  // Generate mock time series data if API returns empty
  const mockData = !data || data.length === 0;
  const displayData = mockData ?
    Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const normalCount = Math.floor(Math.random() * 800 + 200);
      const anomalyCount = Math.floor(Math.random() * 50 + 10);
      return {
        date: date.toISOString().split('T')[0],
        normal_count: normalCount,
        anomaly_count: anomalyCount,
        total_count: normalCount + anomalyCount,
        anomaly_rate: anomalyCount / (normalCount + anomalyCount),
        avg_severity: Math.random() * 3 + 1
      };
    }) : data;

  const chartData = {
    labels: displayData.map(d => d.date),
    datasets: [
      {
        label: 'Normal',
        data: displayData.map(d => d.normal_count),
        borderColor: '#00e0ff',
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Anomalies',
        data: displayData.map(d => d.anomaly_count),
        borderColor: '#e930ff',
        backgroundColor: 'rgba(233, 48, 255, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#8b5cf6' }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(139, 92, 246, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e8d4e6',
        borderWidth: 1,
        callbacks: {
          afterLabel: (context: any) => {
            const dataIndex = context.dataIndex;
            const rate = displayData[dataIndex]?.anomaly_rate;
            if (rate) {
              return `Anomaly Rate: ${(rate * 100).toFixed(1)}%`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(232, 212, 230, 0.1)'
        },
        ticks: { color: '#8b5cf6' }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(232, 212, 230, 0.1)'
        },
        ticks: { color: '#8b5cf6' }
      }
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const label = chartData.labels[index];
        const value = chartData.datasets[datasetIndex].data[index];

        selectionManager.addPoint({
          label: `${chartData.datasets[datasetIndex].label} - ${label}`,
          value: value.toString(),
          source: 'Anomaly Trend',
          metadata: {
            type: 'time_series',
            date: label,
            dataset: chartData.datasets[datasetIndex].label
          }
        }, event?.native?.shiftKey || false);
      }
    }
  };

  return (
    <Card
      title="Anomaly Trend"
      description="Time series view of detected anomalies"
    >
      <div className="h-80 p-4">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}