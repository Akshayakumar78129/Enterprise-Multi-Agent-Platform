"use client";

import React from 'react';
import { Card, getShiftClickManager } from 'components/index';
import { Line } from '@/lib/chartSetup';
interface LtvTrendsProps {
  data: any;
  loading?: boolean;
}

export function LtvTrends({ data = {}, loading = false }: LtvTrendsProps) {
  const shiftClickManager = getShiftClickManager();

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
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3
      },
      {
        label: 'New Customer LTV',
        data: isArray
          ? data.map(d => d.newCustomerLtv || 0)
          : (data.newCustomerLtv || []),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        borderDash: [5, 5],
        borderWidth: 2
      },
      {
        label: 'Existing Customer LTV',
        data: isArray
          ? data.map(d => d.existingCustomerLtv || 0)
          : (data.existingCustomerLtv || []),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true,
        borderDash: [2, 2],
        borderWidth: 2
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
        display: false
      },
      tooltip: {
        backgroundColor: 'rgb(31, 41, 55)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
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
        title: {
          display: true,
          text: 'Time Period',
          color: '#a3a3a3'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a3a3a3'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Lifetime Value ($)',
          color: '#a3a3a3'
        },
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

  const hasData = isArray ? (data && data.length > 0) : (data && data.labels && data.labels.length > 0);

  if (!hasData) {
    return (
      <Card className="p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p className="text-sm">No LTV trend data available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-6"
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "LTV Trends",
          value: `LTV trends over time`,
          source: 'LTV Dashboard - Trends'
        }, event.nativeEvent);
      }}
    >
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}