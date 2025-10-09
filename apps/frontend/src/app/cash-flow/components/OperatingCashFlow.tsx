"use client";

import React from 'react';
import { Card, EmptyState, Skeleton, getShiftClickManager } from 'components/index';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface OperatingCashFlowProps {
  data: Array<{ category: string; inflow: number; outflow: number; net: number }>;
  loading?: boolean;
}

export function OperatingCashFlow({ data, loading }: OperatingCashFlowProps) {
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
        <EmptyState message="No operating cash flow data" />
      </Card>
    );
  }

  const chartData = {
    labels: data.map(d => d.category),
    datasets: [
      { label: 'Inflow', data: data.map(d => d.inflow), backgroundColor: 'rgba(16, 185, 129, 0.6)', borderColor: '#10b981', borderWidth: 1 },
      { label: 'Outflow', data: data.map(d => Math.abs(d.outflow)), backgroundColor: 'rgba(239, 68, 68, 0.6)', borderColor: '#ef4444', borderWidth: 1 },
      { label: 'Net', data: data.map(d => d.net), backgroundColor: 'rgba(59, 130, 246, 0.6)', borderColor: '#3b82f6', borderWidth: 1 }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any) => {
      if (!event.native || !event.native.shiftKey) return;

      if (elements && elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const dataPoint = data[index];
        const dataset = chartData.datasets[datasetIndex];

        if (dataPoint && dataset) {
          shiftClickManager.addPoint({
            label: `Category: ${dataPoint.category}`,
            value: `${dataset.label}: $${dataset.data[index].toLocaleString()}`,
            source: 'Operating Cash Flow',
            chartType: 'bar'
          }, event.native);
        }
      }
    },
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#9ca3af', font: { size: 11 } } },
      tooltip: { backgroundColor: '#1f2937', titleColor: '#f3f4f6', bodyColor: '#e5e7eb' }
    },
    scales: {
      x: { grid: { color: '#374151', drawBorder: false }, ticks: { color: '#9ca3af', font: { size: 10 } } },
      y: { grid: { color: '#374151', drawBorder: false }, ticks: { color: '#9ca3af', font: { size: 10 }, callback: (v: any) => `$${(v/1000).toFixed(0)}K` } }
    }
  };

  return (
    <Card className="p-6">
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}
