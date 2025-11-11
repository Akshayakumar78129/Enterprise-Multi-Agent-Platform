"use client";

import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { DashboardSection, getShiftClickManager } from 'components/index';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StockLevel {
  itemName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  stockValue: number;
  status: string;
  daysOnHand: number;
}

interface StockStatusChartProps {
  data: StockLevel[];
  loading?: boolean;
}

export function StockStatusChart({ data = [], loading = false }: StockStatusChartProps) {
  const shiftClickManager = getShiftClickManager();

  const statusData = useMemo(() => {
    const stats = {
      low: { count: 0, value: 0, items: [] as string[] },
      normal: { count: 0, value: 0, items: [] as string[] },
      excess: { count: 0, value: 0, items: [] as string[] }
    };

    data.forEach(item => {
      const status = item.status.toLowerCase() as 'low' | 'normal' | 'excess';
      if (stats[status]) {
        stats[status].count++;
        stats[status].value += item.stockValue;
        stats[status].items.push(item.itemName);
      }
    });

    return stats;
  }, [data]);

  const chartData = {
    labels: ['Low Stock', 'Normal Stock', 'Excess Stock'],
    datasets: [
      {
        label: 'Items Count',
        data: [statusData.low.count, statusData.normal.count, statusData.excess.count],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Red for low
          'rgba(16, 185, 129, 0.8)',   // Green for normal
          'rgba(245, 158, 11, 0.8)',   // Orange for excess
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && event?.native?.shiftKey) {
        const index = elements[0].index;
        const labels = ['low', 'normal', 'excess'];
        const status = labels[index];
        const statusInfo = statusData[status as keyof typeof statusData];

        shiftClickManager.addPoint({
          label: `${chartData.labels[index]} Status`,
          value: `Count: ${statusInfo.count} items, Total Value: $${statusInfo.value.toLocaleString()}`,
          source: 'Stock Status Distribution Chart'
        }, event.native);
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          padding: 20,
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
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const labels = ['low', 'normal', 'excess'];
            const status = labels[index];
            const statusInfo = statusData[status as keyof typeof statusData];

            const percentage = data.length > 0
              ? ((statusInfo.count / data.length) * 100).toFixed(1)
              : '0.0';

            return [
              `Count: ${statusInfo.count} items (${percentage}%)`,
              `Value: $${statusInfo.value.toLocaleString()}`,
              `Avg Value: $${statusInfo.count > 0 ? (statusInfo.value / statusInfo.count).toLocaleString() : '0'}`
            ];
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <DashboardSection title="Stock Status Distribution">
        <div className="h-96 animate-pulse bg-muted rounded"></div>
      </DashboardSection>
    );
  }

  if (!data || data.length === 0) {
    return (
      <DashboardSection title="Stock Status Distribution">
        <div className="h-96 flex items-center justify-center text-muted">
          No stock data available
        </div>
      </DashboardSection>
    );
  }

  const totalValue = statusData.low.value + statusData.normal.value + statusData.excess.value;

  return (
    <DashboardSection title="Stock Status Distribution">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="h-80 flex items-center justify-center">
          <Doughnut data={chartData} options={options} />
        </div>

        {/* Stats */}
        <div className="flex flex-col justify-center space-y-4">
          {/* Low Stock */}
          <div className="glass-card p-4 border border-error/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-error font-semibold">Low Stock</h4>
              <span className="text-2xl font-bold text-error">{statusData.low.count}</span>
            </div>
            <div className="text-sm text-muted">
              <p>Total Value: <span className="font-semibold text-foreground">${statusData.low.value.toLocaleString()}</span></p>
              <p>Percentage: <span className="font-semibold text-foreground">
                {data.length > 0 ? ((statusData.low.count / data.length) * 100).toFixed(1) : '0.0'}%
              </span></p>
            </div>
          </div>

          {/* Normal Stock */}
          <div className="glass-card p-4 border border-success/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-success font-semibold">Normal Stock</h4>
              <span className="text-2xl font-bold text-success">{statusData.normal.count}</span>
            </div>
            <div className="text-sm text-muted">
              <p>Total Value: <span className="font-semibold text-foreground">${statusData.normal.value.toLocaleString()}</span></p>
              <p>Percentage: <span className="font-semibold text-foreground">
                {data.length > 0 ? ((statusData.normal.count / data.length) * 100).toFixed(1) : '0.0'}%
              </span></p>
            </div>
          </div>

          {/* Excess Stock */}
          <div className="glass-card p-4 border border-warning/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-warning font-semibold">Excess Stock</h4>
              <span className="text-2xl font-bold text-warning">{statusData.excess.count}</span>
            </div>
            <div className="text-sm text-muted">
              <p>Total Value: <span className="font-semibold text-foreground">${statusData.excess.value.toLocaleString()}</span></p>
              <p>Percentage: <span className="font-semibold text-foreground">
                {data.length > 0 ? ((statusData.excess.count / data.length) * 100).toFixed(1) : '0.0'}%
              </span></p>
            </div>
          </div>
        </div>
      </div>
    </DashboardSection>
  );
}

export default StockStatusChart;
