"use client";

import React from 'react';
import { DashboardSection, getShiftClickManager } from 'components/index';
import { Line, ChartOptions } from '@/lib/chartSetup';
interface Movement {
  period: string;
  inbound: number;
  outbound: number;
  netMovement: number;
  turnoverRate: number;
}

interface InventoryMovementChartProps {
  data: Movement[];
  loading?: boolean;
}

export function InventoryMovementChart({ data = [], loading = false }: InventoryMovementChartProps) {
  const shiftClickManager = getShiftClickManager();

  const chartData = {
    labels: data.map(d => new Date(d.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Inbound',
        data: data.map(d => d.inbound),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Outbound',
        data: data.map(d => d.outbound),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Net Movement',
        data: data.map(d => d.netMovement),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderDash: [5, 5],
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && event?.native?.shiftKey) {
        const index = elements[0].index;
        const movement = data[index];
        shiftClickManager.addPoint({
          label: `Inventory Movement - ${new Date(movement.period).toLocaleDateString()}`,
          value: `Inbound: ${movement.inbound.toLocaleString()}, Outbound: ${movement.outbound.toLocaleString()}, Net: ${movement.netMovement.toLocaleString()}`,
          source: 'Inventory Movement Chart'
        }, event.native);
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US').format(context.parsed.y) + ' units';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          display: true
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          display: true
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US').format(value);
          }
        },
        title: {
          display: true,
          text: 'Units',
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <DashboardSection title="Inventory Movement Trends">
        <div className="h-96 animate-pulse bg-muted rounded"></div>
      </DashboardSection>
    );
  }

  if (!data || data.length === 0) {
    return (
      <DashboardSection title="Inventory Movement Trends">
        <div className="h-96 flex items-center justify-center text-muted">
          No movement data available
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection title="Inventory Movement Trends">
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="text-center">
          <p className="text-sm text-muted mb-1">Total Inbound</p>
          <p className="text-2xl font-bold text-success">
            {data.reduce((sum, d) => sum + d.inbound, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted mb-1">Total Outbound</p>
          <p className="text-2xl font-bold text-error">
            {data.reduce((sum, d) => sum + d.outbound, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted mb-1">Net Change</p>
          <p className={`text-2xl font-bold ${
            data.reduce((sum, d) => sum + d.netMovement, 0) >= 0 ? 'text-primary' : 'text-warning'
          }`}>
            {data.reduce((sum, d) => sum + d.netMovement, 0) >= 0 ? '+' : ''}
            {data.reduce((sum, d) => sum + d.netMovement, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </DashboardSection>
  );
}

export default InventoryMovementChart;
