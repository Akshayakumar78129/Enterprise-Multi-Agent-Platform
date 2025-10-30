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

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface PredictionAccuracyProps {
  data: any[];
  loading?: boolean;
  onPointClick?: (customer: any) => void;
}

export function PredictionAccuracy({ data = [], loading = false, onPointClick }: PredictionAccuracyProps) {
  const chartData = {
    datasets: [
      {
        label: 'Accurate (<10% error)',
        data: data.filter(d => d.error_category === 'accurate').map(d => ({
          x: d.actual_ltv || 0,
          y: d.predicted_ltv || 0,
          customer: d
        })),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        pointRadius: 4
      },
      {
        label: 'Moderate (10-25% error)',
        data: data.filter(d => d.error_category === 'moderate').map(d => ({
          x: d.actual_ltv || 0,
          y: d.predicted_ltv || 0,
          customer: d
        })),
        backgroundColor: 'rgba(251, 191, 36, 0.6)',
        borderColor: 'rgb(251, 191, 36)',
        pointRadius: 4
      },
      {
        label: 'High (>25% error)',
        data: data.filter(d => d.error_category === 'high').map(d => ({
          x: d.actual_ltv || 0,
          y: d.predicted_ltv || 0,
          customer: d
        })),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        pointRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#a3a3a3',
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgb(31, 41, 55)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const point = context.raw as any;
            return [
              `Customer: ${point.customer?.customer_id || 'N/A'}`,
              `Actual: $${point.x?.toLocaleString() || 0}`,
              `Predicted: $${point.y?.toLocaleString() || 0}`,
              `Error: ${point.customer?.percentage_error?.toFixed(1) || 0}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'Actual LTV',
          color: '#a3a3a3'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a3a3a3',
          callback: function(value: any) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        }
      },
      y: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Predicted LTV',
          color: '#a3a3a3'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a3a3a3',
          callback: function(value: any) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        }
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onPointClick) {
        const datasetIndex = elements[0].datasetIndex;
        const dataIndex = elements[0].index;
        const customer = (chartData.datasets[datasetIndex].data[dataIndex] as any).customer;
        onPointClick(customer);
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="h-80">
        <Scatter data={chartData} options={options} />
      </div>
    </Card>
  );
}