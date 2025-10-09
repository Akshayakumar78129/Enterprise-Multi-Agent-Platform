"use client";

import React from 'react';
import { Card } from 'components/index';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useProductPerformanceContext } from '../../context';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

interface MarginData {
  productName: string;
  category: string;
  revenue: number;
  marginPercent: number;
  unitsSold?: number;
  totalMargin?: number;
}

interface MarginAnalysisScatterProps {
  data: MarginData[];
  loading?: boolean;
}

export function MarginAnalysisScatter({ data = [], loading = false }: MarginAnalysisScatterProps) {
  const context = useProductPerformanceContext();
  const selectionManager = context?.selectionManager;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading margin analysis...</div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No margin data available
        </div>
      </Card>
    );
  }

  // Group by category for color coding
  const categories = Array.from(new Set(data.map(d => d.category)));
  const colors = [
    '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
  ];

  const datasets = categories.map((category, index) => {
    const categoryData = data.filter(d => d.category === category);
    return {
      label: category,
      data: categoryData.map(d => ({
        x: d.revenue,
        y: d.marginPercent,
        productName: d.productName,
        unitsSold: d.unitsSold || 0
      })),
      backgroundColor: colors[index % colors.length] + '80', // Add transparency
      borderColor: colors[index % colors.length],
      pointRadius: 6,
      pointHoverRadius: 8
    };
  });

  const chartData = {
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && event.native?.shiftKey && selectionManager) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const dataset = datasets[datasetIndex];
        const point = dataset.data[index];
        selectionManager.addPoint({
          label: `${point.productName} (${dataset.label})`,
          value: `Revenue: $${point.x.toLocaleString()}, Margin: ${point.y.toFixed(1)}%, Units: ${point.unitsSold.toLocaleString()}`,
          source: 'Margin Analysis Scatter'
        }, true);
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          usePointStyle: true,
          padding: 15
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
            const point = context.raw;
            return [
              `Product: ${point.productName}`,
              `Revenue: $${context.parsed.x.toLocaleString()}`,
              `Margin: ${context.parsed.y.toFixed(1)}%`,
              point.unitsSold ? `Units: ${point.unitsSold.toLocaleString()}` : ''
            ].filter(Boolean);
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Revenue ($)',
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        }
      },
      y: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Margin %',
          color: '#9ca3af',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value.toFixed(0) + '%';
          }
        }
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Margin vs Revenue Analysis</h3>
      </div>
      <div style={{ height: '400px' }}>
        <Scatter data={chartData} options={options} />
      </div>
    </Card>
  );
}
