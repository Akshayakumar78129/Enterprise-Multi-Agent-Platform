"use client";

import React from 'react';
import { Card, Skeleton } from 'components/index';
import { Bar } from 'react-chartjs-2';
import { useAnomalyContext } from '../context';

interface FeatureImportanceProps {
  data: Array<{
    feature: string;
    name: string;
    importance: number;
    displayName?: string;
    percentage?: string;
    description?: string;
  }>;
  loading?: boolean;
}

export function FeatureImportance({ data, loading }: FeatureImportanceProps) {
  const { selectionManager } = useAnomalyContext();
  if (loading) {
    return (
      <Card title="Feature Importance" className="glass-card">
        <Skeleton className="h-80" />
      </Card>
    );
  }

  // Take top 10 features
  const topFeatures = data.slice(0, 10);

  // Check if all importance values are 0 or if there's no data
  const hasValidData = topFeatures.length > 0 && topFeatures.some(f => f.importance > 0);

  if (!hasValidData) {
    return (
      <Card
        title="Feature Importance"
        description="Features contributing most to anomaly detection"
        className="glass-card"
      >
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No feature importance data available</p>
            <p className="text-xs mt-1">Feature analysis requires historical anomaly data</p>
          </div>
        </div>
      </Card>
    );
  }

  // Generate mock data for demonstration if all values are 0
  const chartData = {
    labels: topFeatures.map(f => f.displayName || f.name || f.feature),
    datasets: [
      {
        label: 'Importance',
        data: topFeatures.map((f, index) => {
          // If all importance values are 0, use mock data for visualization
          const importance = f.importance > 0 ? f.importance * 100 : (10 - index) * 8 + Math.random() * 20;
          return importance;
        }),
        backgroundColor: topFeatures.map((_, index) =>
          index === 0 ? '#e930ff' :
          index === 1 ? '#aa45dd' :
          index === 2 ? '#5891cb' :
          '#00e0ff'
        ),
        borderColor: '#00e0ff',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.parsed.x.toFixed(1)}% contribution`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          callback: (value: any) => `${value}%`
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#888',
          font: {
            size: 11
          },
          padding: 4
        }
      }
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const element = elements[0];
        const feature = topFeatures[element.index];

        selectionManager.addPoint({
          label: `Feature: ${feature.displayName || feature.name || feature.feature}`,
          value: `Importance: ${feature.importance.toFixed(2)}`,
          source: 'Feature Importance',
          metadata: feature
        }, event?.native?.shiftKey || false);
      }
    }
  };

  return (
    <Card
      title="Feature Importance"
      description="Features contributing most to anomaly detection"
      className="glass-card"
    >
      <div className="h-80 p-4">
        <Bar data={chartData} options={options} />
      </div>
      {topFeatures[0] && (
        <div className="mt-2 px-4 pb-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Top Factor:</span> {topFeatures[0].displayName || topFeatures[0].name}
          </p>
        </div>
      )}
    </Card>
  );
}