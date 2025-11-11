"use client";

import React from 'react';
import { Card } from 'components/index';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useProductPerformanceContext } from '../../context';

import { Pie } from '@/lib/chartSetup';
ChartJS.register(ArcElement, Tooltip, Legend);

interface PriceBandData {
  name: string;
  count: number;
  revenue: number;
}

interface PriceBandDistributionProps {
  data: PriceBandData[];
  loading?: boolean;
}

export function PriceBandDistribution({ data = [], loading = false }: PriceBandDistributionProps) {
  const context = useProductPerformanceContext();
  const selectionManager = context?.selectionManager;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading price bands...</div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No price band data available
        </div>
      </Card>
    );
  }

  const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        data: data.map(d => d.revenue),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(c => c + '40'),
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && event.native?.shiftKey && selectionManager) {
        const index = elements[0].index;
        const item = data[index];
        const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
        const percentage = ((item.revenue / totalRevenue) * 100).toFixed(1);
        selectionManager.addPoint({
          label: `${item.name} Price Band`,
          value: `Revenue: $${item.revenue.toLocaleString()}, Products: ${item.count.toLocaleString()}, Share: ${percentage}%`,
          source: 'Price Band Distribution'
        }, true);
      }
    },
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#9ca3af',
          padding: 15,
          generateLabels: (chart: any) => {
            const data = chart.data;
            return data.labels.map((label: string, i: number) => ({
              text: `${label}: $${(data.datasets[0].data[i] / 1000).toFixed(0)}k`,
              fillStyle: data.datasets[0].backgroundColor[i],
              hidden: false,
              index: i
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const item = data[index];
            return [
              `Revenue: $${context.parsed.toLocaleString()}`,
              `Products: ${item.count.toLocaleString()}`,
              `Percentage: ${((context.parsed / data.reduce((sum, d) => sum + d.revenue, 0)) * 100).toFixed(1)}%`
            ];
          }
        }
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Price Band Distribution</h3>
      </div>
      <div style={{ height: '300px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </Card>
  );
}
