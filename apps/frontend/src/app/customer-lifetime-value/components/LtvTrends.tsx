"use client";

import React from 'react';
import { Card } from 'components/index';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LtvTrendsProps {
  data: any;
  loading?: boolean;
}

export function LtvTrends({ data = {}, loading = false }: LtvTrendsProps) {
  // Handle both array and object formats
  const isArray = Array.isArray(data);

  const chartData = {
    labels: isArray
      ? data.map(d => d.date || d.month || d.label)
      : (data.labels || []),
    datasets: [
      {
        label: 'Average LTV',
        data: isArray
          ? data.map(d => d.avgLtv || d.value || 0)
          : (data.avgLtv || []),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'New Customer LTV',
        data: isArray
          ? data.map(d => d.newCustomerLtv || 0)
          : (data.newCustomerLtv || []),
        borderColor: '#e8d4e6',
        backgroundColor: 'rgba(232, 212, 230, 0.1)',
        tension: 0.4,
        fill: true,
        borderDash: [5, 5]
      },
      {
        label: 'Existing Customer LTV',
        data: isArray
          ? data.map(d => d.existingCustomerLtv || 0)
          : (data.existingCustomerLtv || []),
        borderColor: '#c084fc',
        backgroundColor: 'rgba(192, 132, 252, 0.1)',
        tension: 0.4,
        fill: true,
        borderDash: [2, 2]
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
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'LTV Trends Over Time',
        color: '#e5e5e5',
        font: {
          size: 14,
          weight: 500 as const
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a3a3a3'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a3a3a3',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}