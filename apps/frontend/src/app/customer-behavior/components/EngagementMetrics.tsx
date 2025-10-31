"use client";

import React from "react";
import { Card, LineChart, Skeleton, RiskPyramid, getShiftClickManager, BarChart } from "components/index";
import { useBehaviorContext } from "../context";
import { Bar } from "react-chartjs-2";

interface EngagementMetricsProps {
  data: any;
  loading: boolean;
  purchasePatternsData?: any;
}

export function EngagementMetrics({ data, loading, purchasePatternsData }: EngagementMetricsProps) {
  const { selectionManager } = useBehaviorContext();
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <Card>
        <Skeleton className="h-80" />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          No engagement data available
        </div>
      </Card>
    );
  }

  const engagementScores = data?.engagement_scores || {};

  // Only use real engagement data
  const hasEngagementData = Object.values(engagementScores).some(v => v && v > 0);

  // Get frequency distribution data from purchase patterns
  const frequencyData = purchasePatternsData?.frequency_distribution ? {
    labels: Object.keys(purchasePatternsData.frequency_distribution),
    datasets: [
      {
        label: 'Customer Count',
        data: Object.values(purchasePatternsData.frequency_distribution),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1
      }
    ]
  } : null;

  const radarData = hasEngagementData ? {
    labels: ['Email', 'Web', 'Mobile', 'Social', 'Support', 'Loyalty'],
    datasets: [
      {
        label: 'Engagement Level',
        data: [
          (engagementScores.email || 0) * 100,
          (engagementScores.web || 0) * 100,
          (engagementScores.mobile || 0) * 100,
          (engagementScores.social || 0) * 100,
          (engagementScores.support || 0) * 100,
          (engagementScores.loyalty || 0) * 100
        ],
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: '#8b5cf6',
        borderWidth: 2
      }
    ]
  } : null;

  // Prepare engagement quadrant data for RiskPyramid - only real data, no mocks
  const engagementQuadrants = data?.engagement_segments && Object.keys(data.engagement_segments).length > 0 ?
    Object.entries(data.engagement_segments)
      .sort((a: any, b: any) => b[1].score - a[1].score)
      .slice(0, 4)
      .map(([segment, details]: [string, any]) => ({
        level: segment.charAt(0).toUpperCase() + segment.slice(1),
        count: details.customer_count || 0,
        percentage: ((details.customer_count || 0) / (data.totalCustomers || 1)) * 100,
        color: details.score > 0.7 ? '#10b981' :
               details.score > 0.4 ? '#f59e0b' : '#ef4444'
      })) : [];

  const trendData = data.engagement_trend ? {
    labels: data.engagement_trend.map((t: any) => t.period),
    datasets: [
      {
        label: 'Overall Engagement',
        data: data.engagement_trend.map((t: any) => t.score * 100),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Active Users %',
        data: data.engagement_trend.map((t: any) => t.active_users_pct),
        borderColor: '#e8d4e6',
        backgroundColor: 'rgba(232, 212, 230, 0.1)',
        tension: 0.4
      }
    ]
  } : null;

  const handleRadarClick = (elements: any, event: any) => {
    if (elements.length > 0) {
      const element = elements[0];
      const label = radarData.labels[element.index];
      const value = radarData.datasets[0].data[element.index];

      selectionManager.addPoint({
        label: `${label} Engagement`,
        value: `${value.toFixed(1)}%`,
        source: 'Engagement Metrics',
        metadata: {
          type: 'engagement',
          channel: label,
          score: value
        }
      }, event?.native?.shiftKey || false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Engagement Channels</h3>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Engagement Channels",
                value: `Multi-channel engagement analysis`,
                source: 'Behavior Dashboard - Engagement'
              }, event.nativeEvent);
            }}>
          <div className="h-80 p-4">
            {radarData ? (
              <Bar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                onClick: handleRadarClick,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        return `${context.label}: ${context.parsed.y.toFixed(1)}%`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(232, 212, 230, 0.1)' },
                    ticks: {
                      color: '#8b5cf6',
                      callback: (value: any) => `${value}%`
                    }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#8b5cf6' }
                  }
                }
              }}
            />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm font-medium">Multi-channel tracking not configured</p>
                  <p className="text-xs mt-1 text-muted-foreground">System currently tracks loyalty channel only</p>
                </div>
              </div>
            )}
          </div>
          </Card>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Purchase Frequency Distribution</h3>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Purchase Frequency Distribution",
                value: `Customer distribution by purchase frequency`,
                source: 'Behavior Dashboard - Frequency'
              }, event.nativeEvent);
            }}>
          <div className="h-80 p-4">
            {frequencyData ? (
              <BarChart
                data={frequencyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: { display: false },
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(232, 212, 230, 0.1)' },
                      ticks: { color: '#3b82f6' }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: '#3b82f6' },
                      title: {
                        display: true,
                        text: 'Purchase Frequency Category',
                        color: '#3b82f6'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm font-medium">No frequency data available</p>
                  <p className="text-xs mt-1 text-muted-foreground">Customer purchase frequency will appear here</p>
                </div>
              </div>
            )}
          </div>
          </Card>
        </div>
      </div>

      {trendData && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Engagement Trend</h3>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Engagement Trend",
                value: `Engagement metrics over time`,
                source: 'Behavior Dashboard - Engagement Trend'
              }, event.nativeEvent);
            }}>
          <div className="h-80">
            <LineChart
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index' as const,
                  intersect: false
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: { color: '#8b5cf6' }
                  },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value.toFixed(1)}%`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { color: 'rgba(232, 212, 230, 0.1)' },
                    ticks: { color: '#8b5cf6' }
                  },
                  y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(232, 212, 230, 0.1)' },
                    ticks: {
                      color: '#8b5cf6',
                      callback: (value: any) => `${value}%`
                    }
                  }
                }
              }}
            />
          </div>
          </Card>
        </div>
      )}
    </div>
  );
}