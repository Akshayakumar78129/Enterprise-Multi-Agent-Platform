"use client";

import React from 'react';
import { ChartCard, getShiftClickManager } from 'components/index';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

interface CustomerInsight {
  customerId: string;
  customerName: string;
  outstandingAmount: number;
  daysPastDue: number;
  riskScore: number;
  clv: number;
  segment: string;
  region: string;
}

interface CustomerMatrixProps {
  data: CustomerInsight[];
  loading?: boolean;
}

export function CustomerMatrix({ data, loading }: CustomerMatrixProps) {
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

  // Segment colors
  const segmentColors: Record<string, string> = {
    'Strategic Partners': '#10b981', // green
    'Growth Opportunities': '#f59e0b', // amber
    'Efficiency Targets': '#3b82f6', // blue
    'Value Destroyers': '#ef4444' // red
  };

  // Group data by segment
  const segmentedData = data.reduce((acc, customer) => {
    const segment = customer.segment || 'Unknown';
    if (!acc[segment]) acc[segment] = [];
    acc[segment].push(customer);
    return acc;
  }, {} as Record<string, CustomerInsight[]>);

  const datasets = Object.entries(segmentedData).map(([segment, customers]) => ({
    label: segment,
    data: customers.map(c => ({
      x: c.clv,
      y: 100 - c.riskScore, // Invert so higher is better
      r: Math.sqrt(c.outstandingAmount) / 50, // Bubble size
      customerId: c.customerId,
      customerName: c.customerName,
      outstandingAmount: c.outstandingAmount,
      riskScore: c.riskScore
    })),
    backgroundColor: segmentColors[segment] || '#8b5cf6',
    borderColor: segmentColors[segment] || '#8b5cf6',
    borderWidth: 2
  }));

  const chartData = { datasets };

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && event?.native?.shiftKey) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const point = datasets[datasetIndex].data[index] as any;
        shiftClickManager.addPoint({
          label: point.customerName,
          value: `CLV: $${point.x.toLocaleString()}, Risk: ${(100 - point.y).toFixed(1)}, Outstanding: $${point.outstandingAmount.toLocaleString()}`,
          source: 'AR Aging - Customer Portfolio Matrix'
        }, event.native);
      }
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
          label: function(context: any) {
            const point = context.raw;
            return [
              `Customer: ${point.customerName}`,
              `CLV: $${point.x.toLocaleString()}`,
              `Risk Score: ${(100 - point.y).toFixed(1)}`,
              `Outstanding: $${point.outstandingAmount.toLocaleString()}`,
              `Segment: ${context.dataset.label}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Customer Lifetime Value ($)',
          color: '#6b46c1',
          font: { size: 12, weight: 'bold' }
        },
        grid: {
          color: 'rgba(183, 148, 244, 0.1)'
        },
        ticks: {
          color: '#6b46c1',
          font: { size: 10 },
          callback: function(value) {
            return '$' + (Number(value) / 1000).toFixed(0) + 'k';
          }
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Payment Reliability (100 - Risk Score)',
          color: '#6b46c1',
          font: { size: 12, weight: 'bold' }
        },
        grid: {
          color: 'rgba(183, 148, 244, 0.1)'
        },
        ticks: {
          color: '#6b46c1',
          font: { size: 10 }
        }
      }
    }
  };

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Customer Portfolio Matrix",
          value: `${data.length} customers across ${Object.keys(segmentedData).length} segments`,
          source: 'AR Aging - Customer Matrix'
        }, event.nativeEvent);
      }}
    >
      <div className="h-96 relative">
        <Scatter data={chartData} options={options} />

        {/* Quadrant Labels Overlay */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 p-4">
          <div className="flex items-start justify-start p-2">
            <div className="text-xs text-muted bg-surface/90 px-2 py-1 rounded border border-border">
              <div className="font-semibold text-blue-500">Efficiency Targets</div>
              <div className="text-[10px]">Low CLV, High Reliability</div>
            </div>
          </div>
          <div className="flex items-start justify-end p-2">
            <div className="text-xs text-muted bg-surface/90 px-2 py-1 rounded border border-border">
              <div className="font-semibold text-green-500">Strategic Partners</div>
              <div className="text-[10px]">High CLV, High Reliability</div>
            </div>
          </div>
          <div className="flex items-end justify-start p-2">
            <div className="text-xs text-muted bg-surface/90 px-2 py-1 rounded border border-border">
              <div className="font-semibold text-red-500">Value Destroyers</div>
              <div className="text-[10px]">Low CLV, High Risk</div>
            </div>
          </div>
          <div className="flex items-end justify-end p-2">
            <div className="text-xs text-muted bg-surface/90 px-2 py-1 rounded border border-border">
              <div className="font-semibold text-amber-500">Growth Opportunities</div>
              <div className="text-[10px]">High CLV, High Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border h-[88px]">
        {Object.entries(segmentedData).map(([segment, customers]) => (
          <div key={segment} className="text-center">
            <p className="text-xs text-foreground-muted">{segment}</p>
            <p className="text-lg font-semibold text-foreground">{customers.length}</p>
            <p className="text-xs text-muted">
              ${(customers.reduce((sum, c) => sum + c.outstandingAmount, 0) / 1000).toFixed(0)}k AR
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
