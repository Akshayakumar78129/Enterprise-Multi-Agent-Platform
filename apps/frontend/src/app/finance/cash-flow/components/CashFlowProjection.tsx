"use client";

import React from 'react';
import { Card, EmptyState, Skeleton, getShiftClickManager } from 'components/index';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface CashFlowProjectionProps {
  data: Array<{ month: string; historical?: number | null; projected?: number | null; optimistic?: number | null; pessimistic?: number | null }>;
  loading?: boolean;
}

export function CashFlowProjection({ data, loading }: CashFlowProjectionProps) {
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
        <EmptyState message="No projection data" />
      </Card>
    );
  }

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      { label: 'Historical', data: data.map(d => d.historical), borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', fill: true, tension: 0.4 },
      { label: 'Projected', data: data.map(d => d.projected), borderColor: '#10b981', borderDash: [5, 5], tension: 0.4 },
      { label: 'Optimistic', data: data.map(d => d.optimistic), borderColor: '#22c55e', borderDash: [2, 2], borderWidth: 1, tension: 0.4 },
      { label: 'Pessimistic', data: data.map(d => d.pessimistic), borderColor: '#ef4444', borderDash: [2, 2], borderWidth: 1, tension: 0.4 }
    ]
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
          const value = dataset.data[index];
          shiftClickManager.addPoint({
            label: `Month: ${dataPoint.month}`,
            value: `${dataset.label}: ${value ? `$${value.toLocaleString()}` : 'N/A'}`,
            source: 'Cash Flow Projection',
            chartType: 'line'
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
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}
