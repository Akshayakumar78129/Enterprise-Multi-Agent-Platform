"use client";

import React from 'react';
import { Card, EmptyState, Skeleton, getShiftClickManager } from 'components/index';
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
} from 'chart.js';

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

interface CashFlowTrendsProps {
  data: Array<{
    date: string;
    operating: number;
    investing: number;
    financing: number;
    net: number;
  }>;
  loading?: boolean;
}

export function CashFlowTrends({ data, loading }: CashFlowTrendsProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton height={300} />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState message="No cash flow trend data available" />
      </Card>
    );
  }

  const chartData = {
    labels: data.map((item) => item.date),
    datasets: [
      {
        label: 'Operating CF',
        data: data.map((item) => item.operating),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Investing CF',
        data: data.map((item) => item.investing),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Financing CF',
        data: data.map((item) => item.financing),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Net CF',
        data: data.map((item) => item.net),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any, chart: any) => {
      // Chart.js native event is in event.native
      if (!event.native || !event.native.shiftKey) return;

      if (elements && elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const dataPoint = data[index];
        const dataset = chartData.datasets[datasetIndex];

        if (dataPoint && dataset) {
          const valueKey = dataset.label === 'Operating CF' ? 'operating' :
                          dataset.label === 'Investing CF' ? 'investing' :
                          dataset.label === 'Financing CF' ? 'financing' : 'net';
          shiftClickManager.addPoint({
            label: `Date: ${dataPoint.date}`,
            value: `${dataset.label}: $${dataPoint[valueKey].toLocaleString()}`,
            source: 'Cash Flow Trends',
            chartType: 'line'
          }, event.native);
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          font: { size: 11 }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#e5e7eb',
      },
    },
    scales: {
      x: {
        grid: { color: '#374151', drawBorder: false },
        ticks: { color: '#9ca3af', font: { size: 10 } }
      },
      y: {
        grid: { color: '#374151', drawBorder: false },
        ticks: {
          color: '#9ca3af',
          font: { size: 10 },
          callback: (value: any) => `$${(value / 1000).toFixed(0)}K`
        }
      },
    },
  };

  return (
    <Card className="p-6">
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}
