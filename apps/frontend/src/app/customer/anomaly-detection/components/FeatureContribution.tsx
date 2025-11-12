"use client";

import React from 'react';
import { Card, Skeleton, getShiftClickManager } from 'components/index';
import { useAnomalyContext } from '../context';
import { Bar } from 'react-chartjs-2';

interface FeatureContributionProps {
  data: any;
  loading: boolean;
}

export function FeatureContribution({ data, loading }: FeatureContributionProps) {
  const { selectionManager } = useAnomalyContext();
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <Card>
        <Skeleton className="h-80" />
      </Card>
    );
  }

  // Only use real data from API
  const contributionData = data && data.length > 0 ? data : [];

  // Show no data message if empty
  if (contributionData.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No feature contribution data available
        </div>
      </Card>
    );
  }

  const chartData = {
    labels: contributionData.map((d: any) => d.feature),
    datasets: [
      {
        label: 'Positive Contribution',
        data: contributionData.map((d: any) => d.positive || 0),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: '#8b5cf6',
        borderWidth: 1
      },
      {
        label: 'Negative Contribution',
        data: contributionData.map((d: any) => d.negative || 0),
        backgroundColor: 'rgba(232, 212, 230, 0.8)',
        borderColor: '#e8d4e6',
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
        position: 'top' as const,
        labels: { color: '#8b5cf6' }
      },
      tooltip: {
        backgroundColor: 'rgba(139, 92, 246, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e8d4e6',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.x;
            return `${label}: ${Math.abs(value)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(232, 212, 230, 0.1)' },
        ticks: {
          color: '#8b5cf6',
          callback: function(value: any) {
            return Math.abs(value) + '%';
          }
        }
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#8b5cf6' }
      }
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const element = elements[0];
        const feature = contributionData[element.index];

        selectionManager.addPoint({
          label: `Feature: ${feature.feature}`,
          value: `+${feature.positive}% / ${feature.negative}%`,
          source: 'Feature Contribution',
          metadata: feature
        }, event?.native?.shiftKey || false);
      }
    }
  };

  return (
    <Card
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Feature Contribution Analysis",
          value: `Individual feature contributions to anomaly scores`,
          source: 'Anomaly Dashboard - Feature Contribution'
        }, event.nativeEvent);
      }}
    >
      <div className="h-80 p-4">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}