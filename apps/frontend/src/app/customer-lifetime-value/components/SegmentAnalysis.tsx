"use client";

import React from 'react';
import { Card, getShiftClickManager } from 'components/index';
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
  const shiftClickManager = getShiftClickManager();

  const chartData = {
    labels: data.map(d => d.segment || d.name || d.label),
    datasets: [
      {
        data: data.map(d => d.value || d.avgLtv || d.ltv || 0),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // Emerald - Low Value
          'rgba(59, 130, 246, 0.8)',  // Blue - Medium Value
          'rgba(245, 158, 11, 0.8)',  // Amber - High Value
          'rgba(236, 72, 153, 0.8)',  // Pink - Premium
          'rgba(139, 92, 246, 0.8)',  // Purple
          'rgba(239, 68, 68, 0.8)',   // Red
          'rgba(6, 182, 212, 0.8)',   // Cyan
          'rgba(168, 85, 247, 0.8)'   // Violet
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(236, 72, 153)',
          'rgb(139, 92, 246)',
          'rgb(239, 68, 68)',
          'rgb(6, 182, 212)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[]) => {
      if (event.native?.shiftKey && elements.length > 0) {
        const index = elements[0].index;
        const segment = data[index]?.segment || data[index]?.name || data[index]?.label || '';
        const value = data[index]?.value || data[index]?.avgLtv || data[index]?.ltv || 0;
        const count = data[index]?.count || 0;
        shiftClickManager.addPoint({
          label: `Segment: ${segment}`,
          value: `Avg LTV: $${value.toLocaleString()}${count ? ` (${count} customers)` : ''}`,
          source: 'Segment Analysis'
        }, event.native);
      }
    },
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
        display: false
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
    <Card
      className="p-6"
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Segment Analysis",
          value: `Customer segment LTV analysis`,
          source: 'LTV Dashboard - Segment Analysis'
        }, event.nativeEvent);
      }}
    >
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </Card>
  );
}