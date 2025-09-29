"use client";

import React from 'react';
import { Card } from 'components/index';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface SegmentAnalysisProps {
  data: any[];
  loading?: boolean;
}

export function SegmentAnalysis({ data = [], loading = false }: SegmentAnalysisProps) {
  const chartData = {
    labels: data.map(d => d.segment || d.name || d.label),
    datasets: [
      {
        data: data.map(d => d.value || d.avgLtv || d.ltv || 0),
        backgroundColor: [
          '#8b5cf6',
          '#e8d4e6',
          '#c084fc',
          '#a855f7',
          '#9333ea'
        ],
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#a3a3a3',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Segment Analysis',
        color: '#e5e5e5',
        font: {
          size: 14,
          weight: 500 as const
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: $${value.toLocaleString()}`;
          }
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

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-80 flex items-center justify-center">
          <div className="text-muted-foreground">No segment data available</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </Card>
  );
}