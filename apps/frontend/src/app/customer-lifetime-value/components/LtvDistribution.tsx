"use client";

import React, { useRef } from 'react';
import { Card, getShiftClickManager } from 'components/index';
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
  const shiftClickManager = getShiftClickManager();
  const chartRef = useRef<any>(null);

  const chartData = {
    labels: data.map(d => d.range || d.label),
    datasets: [
      {
        label: 'Customer Count',
        data: data.map(d => d.count || d.value || 0),
        backgroundColor: data.map((_, index) => {
          const colors = [
            'rgba(16, 185, 129, 0.8)',  // Emerald
            'rgba(59, 130, 246, 0.8)',  // Blue
            'rgba(245, 158, 11, 0.8)',  // Amber
            'rgba(236, 72, 153, 0.8)',  // Pink
            'rgba(139, 92, 246, 0.8)',  // Purple
            'rgba(239, 68, 68, 0.8)',   // Red
            'rgba(6, 182, 212, 0.8)',   // Cyan
            'rgba(168, 85, 247, 0.8)',  // Violet
            'rgba(234, 179, 8, 0.8)',   // Yellow
            'rgba(99, 102, 241, 0.8)'   // Indigo
          ];
          return colors[index % colors.length];
        }),
        borderColor: data.map((_, index) => {
          const colors = [
            'rgb(16, 185, 129)',
            'rgb(59, 130, 246)',
            'rgb(245, 158, 11)',
            'rgb(236, 72, 153)',
            'rgb(139, 92, 246)',
            'rgb(239, 68, 68)',
            'rgb(6, 182, 212)',
            'rgb(168, 85, 247)',
            'rgb(234, 179, 8)',
            'rgb(99, 102, 241)'
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[]) => {
      if (event.native?.shiftKey && elements.length > 0) {
        const index = elements[0].index;
        const range = data[index]?.range || data[index]?.label || '';
        const count = data[index]?.count || data[index]?.value || 0;
        shiftClickManager.addPoint({
          label: `LTV Range: ${range}`,
          value: `${count} customers`,
          source: 'LTV Distribution'
        }, event.native);
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false
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
    <Card
      className="p-6"
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "LTV Distribution",
          value: `Customer lifetime value distribution chart`,
          source: 'LTV Dashboard - Distribution'
        }, event.nativeEvent);
      }}
    >
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}