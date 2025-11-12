"use client";

import React from 'react';
import { Card } from 'components/index';
import { Bar } from '@/lib/chartSetup';
interface ValueContributionAnalysisProps {
  data: any[];
  loading?: boolean;
}

export function ValueContributionAnalysis({ data = [], loading = false }: ValueContributionAnalysisProps) {
  const chartData = {
    labels: data.map(d => d.percentile || d.label || `Top ${d.percentage || 0}%`),
    datasets: [
      {
        label: 'Revenue Contribution',
        data: data.map(d => d.contribution || d.value || 0),
        backgroundColor: '#8b5cf6',
        borderRadius: 4
      },
      {
        label: 'Customer Count',
        data: data.map(d => d.customerPercentage || d.customers || 0),
        backgroundColor: '#e8d4e6',
        borderRadius: 4
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
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Value Contribution Analysis',
        color: '#e5e5e5',
        font: {
          size: 14,
          weight: 500 as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
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
            return value + '%';
          }
        },
        max: 100
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