"use client";

import React from 'react';
import { Card, EmptyState, Skeleton, getShiftClickManager } from 'components/index';
import { Bar } from '@/lib/chartSetup';
interface FinancingCashFlowProps {
  data: Array<{ category: string; amount: number; type: string }>;
  loading?: boolean;
}

export function FinancingCashFlow({ data, loading }: FinancingCashFlowProps) {
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
        <EmptyState message="No financing data" />
      </Card>
    );
  }

  const chartData = {
    labels: data.map(d => d.category),
    datasets: [{
      label: 'Amount',
      data: data.map(d => Math.abs(d.amount)),
      backgroundColor: data.map(d => d.type === 'inflow' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'),
      borderColor: data.map(d => d.type === 'inflow' ? '#10b981' : '#ef4444'),
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any) => {
      if (!event.native || !event.native.shiftKey) return;

      if (elements && elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const dataPoint = data[index];

        if (dataPoint) {
          shiftClickManager.addPoint({
            label: `Category: ${dataPoint.category}`,
            value: `Amount: $${Math.abs(dataPoint.amount).toLocaleString()} | Type: ${dataPoint.type}`,
            source: 'Financing Cash Flow',
            chartType: 'bar'
          }, event.native);
        }
      }
    },
    plugins: {
      legend: { display: false },
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
