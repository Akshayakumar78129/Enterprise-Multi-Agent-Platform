"use client";

import React from "react";
import { Card, LineChart, Skeleton, RiskPyramid, getShiftClickManager } from "components/index";
import { useBehaviorContext } from "../context";
import { Bar } from "react-chartjs-2";

interface EngagementMetricsProps {
  data: any;
  loading: boolean;
}

export function EngagementMetrics({ data, loading }: EngagementMetricsProps) {
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
                No engagement channel data available
              </div>
            )}
          </div>
          </Card>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Engagement Quadrants</h3>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Engagement Quadrants",
                value: `Customer engagement distribution`,
                source: 'Behavior Dashboard - Engagement Quadrants'
              }, event.nativeEvent);
            }}>
          <div className="h-80 p-4">
            {engagementQuadrants.length > 0 ? (
            <div className="h-full flex flex-col gap-3">
              {engagementQuadrants.map((quadrant, index) => {
                const heightPercentage = 100 / engagementQuadrants.length;
                const widthPercentage = 60 + (index * 10); // Pyramid shape

                return (
                  <div
                    key={index}
                    className="relative flex-1 flex items-center justify-center cursor-pointer transition-all hover:opacity-90"
                    style={{
                      background: quadrant.color,
                      width: `${widthPercentage}%`,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      borderRadius: '8px',
                      minHeight: '60px'
                    }}
                    onClick={(event) => {
                      selectionManager.addPoint({
                        label: `Engagement: ${quadrant.level}`,
                        value: `${quadrant.count} customers`,
                        source: 'Engagement Quadrants',
                        metadata: quadrant
                      }, event.shiftKey);
                    }}
                  >
                    <div className="text-center text-white px-4">
                      <div className="font-semibold text-base">{quadrant.level}</div>
                      <div className="text-sm mt-1">
                        {quadrant.count} ({quadrant.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No engagement quadrant data available
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