"use client";

import React from 'react';
import { Card, Skeleton } from 'components/index';
import { useAnomalyContext } from '../context';
import { Bar } from 'react-chartjs-2';

interface FeatureContributionProps {
  data: any;
  loading: boolean;
}

export function FeatureContribution({ data, loading }: FeatureContributionProps) {
  const { selectionManager } = useAnomalyContext();

  if (loading) {
    return (
      <Card title="Feature Contribution Analysis" description="Individual feature contributions to anomaly scores">
        <Skeleton className="h-80" />
      </Card>
    );
  }

  // Use mock data if no real data available
  const contributionData = data && data.length > 0 ? data : [
    { feature: 'Transaction Amount', positive: 35, negative: -15 },
    { feature: 'Purchase Frequency', positive: 28, negative: -8 },
    { feature: 'Time Since Last', positive: 22, negative: -12 },
    { feature: 'Product Category', positive: 18, negative: -20 },
    { feature: 'Location Change', positive: 15, negative: -10 },
    { feature: 'Payment Method', positive: 12, negative: -5 }
  ];

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
      title="Feature Contribution Analysis"
      description="Individual feature contributions to anomaly scores"
    >
      <div className="h-80 p-4">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}