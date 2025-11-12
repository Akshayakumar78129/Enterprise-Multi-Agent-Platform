"use client";

import React from 'react';
import { ChartCard, getShiftClickManager } from 'components/index';
import { Bar } from '@/lib/chartSetup';
interface CohortRetentionChartProps {
  data: any[];
  loading?: boolean;
}

export function CohortRetentionChart({ data, loading }: CohortRetentionChartProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <ChartCard loading={loading}>
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ChartCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ChartCard>
        <div className="h-96 flex items-center justify-center text-muted">
          No cohort retention data available
        </div>
      </ChartCard>
    );
  }

  // Group by cohort and aggregate
  const cohortGroups: Record<string, any[]> = {};
  data.forEach(item => {
    const cohort = item.cohort_month;
    if (!cohortGroups[cohort]) {
      cohortGroups[cohort] = [];
    }
    cohortGroups[cohort].push(item);
  });

  // Get first 5 cohorts for visualization
  const topCohorts = Object.keys(cohortGroups).slice(0, 5);

  const chartData = {
    labels: ['Month 0', 'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
    datasets: topCohorts.map((cohort, idx) => {
      const cohortData = cohortGroups[cohort]
        .sort((a, b) => a.months_since_cohort - b.months_since_cohort)
        .slice(0, 7);

      const colors = ['#00e0ff', '#5fd4d6', '#43cad0', '#e930ff', '#aa45dd'];

      return {
        label: cohort,
        data: cohortData.map(d => d.retention_rate || 0),
        backgroundColor: colors[idx % colors.length],
      };
    })
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Cohort Revenue Retention",
          value: `Tracking ${topCohorts.length} cohorts over time`,
          source: 'Revenue Forecast - Cohort Retention'
        }, event.nativeEvent);
      }}
    >
      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>
    </ChartCard>
  );
}
