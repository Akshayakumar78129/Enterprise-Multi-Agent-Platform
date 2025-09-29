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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface LtvDistributionProps {
  data: any[];
  loading?: boolean;
}

export function LtvDistribution({ data = [], loading = false }: LtvDistributionProps) {
  const chartData = {
    labels: data.map(d => d.range || d.label),
    datasets: [
      {
        label: 'Customer Count',
        data: data.map(d => d.count || d.value || 0),
        backgroundColor: '#8b5cf6',
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'LTV Distribution',
        color: '#e5e5e5',
        font: {
          size: 14,
          weight: 500 as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Customers: ${context.parsed.y}`;
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
          color: '#a3a3a3'
        }
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
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}