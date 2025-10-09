"use client";

import React from 'react';
import { Card } from 'components/index';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useProductPerformanceContext } from '../../context';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CategoryData {
  category: string;
  revenue: number;
  productCount: number;
  unitsSold: number;
  avgPrice: number;
}

interface CategoryPerformanceChartProps {
  data: CategoryData[];
  loading?: boolean;
}

export function CategoryPerformanceChart({ data = [], loading = false }: CategoryPerformanceChartProps) {
  const context = useProductPerformanceContext();
  const selectionManager = context?.selectionManager;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading categories...</div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No category data available
        </div>
      </Card>
    );
  }

  // Sort by revenue and take top 10
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const chartData = {
    labels: sortedData.map(d => d.category),
    datasets: [
      {
        label: 'Revenue ($)',
        data: sortedData.map(d => d.revenue),
        backgroundColor: '#8b5cf6',
        borderRadius: 4,
        yAxisID: 'y'
      },
      {
        label: 'Units Sold',
        data: sortedData.map(d => d.unitsSold),
        backgroundColor: '#10b981',
        borderRadius: 4,
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && event.native?.shiftKey && selectionManager) {
        const index = elements[0].index;
        const category = sortedData[index];
        selectionManager.addPoint({
          label: `Category: ${category.category}`,
          value: `Revenue: $${category.revenue.toLocaleString()}, Units: ${category.unitsSold.toLocaleString()}, Products: ${category.productCount}`,
          source: 'Category Performance Chart'
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label === 'Revenue ($)') {
                label += '$' + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y.toLocaleString();
              }
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
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue ($)',
          color: '#8b5cf6'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Units',
          color: '#10b981'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Category Performance</h3>
      </div>
      <div style={{ height: '350px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}
