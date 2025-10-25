"use client";

import React, { useRef, useEffect } from "react";
import { Card, Skeleton, getShiftClickManager } from "components/index";
import { useBehaviorContext } from "../context";
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

interface ChannelUsageProps {
  data: any;
  loading: boolean;
}

export function ChannelUsage({ data, loading }: ChannelUsageProps) {
  const { selectionManager } = useBehaviorContext();
  const shiftClickManager = getShiftClickManager();
  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const hasData = !loading && data && data.channel_distribution;

  // Check if we only have one channel with 100% (boring data)
  const channelKeys = hasData ? Object.keys(data.channel_distribution) : [];
  const isSingleChannel = channelKeys.length === 1 && channelKeys[0] === 'Item';

  // Only use real data, no mock data
  const channelData = hasData && !isSingleChannel ? {
    labels: Object.keys(data.channel_distribution),
    datasets: [
      {
        data: Object.values(data.channel_distribution),
        backgroundColor: [
          '#8b5cf6',
          '#d8b4fe',
          '#c084fc',
          '#e8d4e6',
          '#f3e8ff',
          '#a78bfa'
        ],
        borderColor: '#fff',
        borderWidth: 3
      }
    ]
  } : null;

  // Render doughnut chart - must be called unconditionally
  useEffect(() => {
    if (!doughnutChartRef.current || !data?.channel_distribution || !channelData) return;

    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = doughnutChartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: channelData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#8b5cf6',
              padding: 20,
              font: {
                size: 13,
                weight: '500'
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(139, 92, 246, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#e8d4e6',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${percentage}%`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: false
        },
        onClick: (event: any, elements: any) => {
          if (elements.length > 0) {
            const element = elements[0];
            const label = channelData.labels[element.index];
            const value = channelData.datasets[0].data[element.index];

            selectionManager.addPoint({
              label: `Channel: ${label}`,
              value: `${value}%`,
              source: 'Channel Usage',
              metadata: {
                type: 'channel',
                channel: label,
                usage: value
              }
            }, event?.native?.shiftKey || false);
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data, channelData, selectionManager]);

  // Only use real channel performance data
  const channelPerformance = data?.channel_performance && data.channel_performance.length > 0 ? {
    labels: data.channel_performance.map((c: any) => c.channel),
    datasets: [
      {
        label: 'Conversion Rate',
        data: data.channel_performance.map((c: any) => c.conversion_rate * 100),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: '#8b5cf6',
        borderWidth: 1
      },
      {
        label: 'Avg Order Value',
        data: data.channel_performance.map((c: any) => c.avg_order_value / 10),
        backgroundColor: 'rgba(232, 212, 230, 0.8)',
        borderColor: '#e8d4e6',
        borderWidth: 1
      }
    ]
  } : null;

  const handleChannelClick = (elements: any, event: any) => {
    if (elements.length > 0 && channelData) {
      const element = elements[0];
      const label = channelData.labels[element.index];
      const value = channelData.datasets[0].data[element.index];

      selectionManager.addPoint({
        label: `Channel: ${label}`,
        value: `${value}%`,
        source: 'Channel Usage',
        metadata: {
          type: 'channel',
          channel: label,
          usage: value
        }
      }, event?.native?.shiftKey || false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Skeleton className="h-80" />
      </Card>
    );
  }

  if (!data || !data.channel_distribution) {
    return (
      <Card>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          No channel usage data available
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Channel Distribution</h3>
          <p className="text-sm text-muted-foreground mb-4">Customer channel preferences</p>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Channel Distribution",
                value: `Customer channel preferences`,
                source: 'Behavior Dashboard - Channel Distribution'
              }, event.nativeEvent);
            }}>
          <div className="h-80 flex items-center justify-center">
            {channelData ? (
              <div className="w-64 h-64">
                <canvas ref={doughnutChartRef} />
              </div>
            ) : (
              <div className="text-muted-foreground">
                No channel distribution data available
              </div>
            )}
          </div>
          </Card>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Channel Performance</h3>
          <p className="text-sm text-muted-foreground mb-4">Conversion and value metrics by channel</p>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Channel Performance",
                value: `Conversion and value metrics by channel`,
                source: 'Behavior Dashboard - Channel Performance'
              }, event.nativeEvent);
            }}>
          <div className="h-80 p-4">
            {channelPerformance ? (
            <Bar
              data={channelPerformance}
              options={{
                responsive: true,
                maintainAspectRatio: false,
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
                        return label.includes('Conversion')
                          ? `${label}: ${value.toFixed(1)}%`
                          : `${label}: $${(value * 10).toFixed(2)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(232, 212, 230, 0.1)' },
                    ticks: { color: '#8b5cf6' }
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
                No channel performance data available
              </div>
            )}
          </div>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Cross-Channel Journey</h3>
        <p className="text-sm text-muted-foreground mb-4">Customer journey across channels</p>
        <Card
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Cross-Channel Journey",
              value: `Customer journey across channels`,
              source: 'Behavior Dashboard - Cross-Channel'
            }, event.nativeEvent);
          }}>
        <div className="space-y-4">
          {data?.cross_channel_journey && data.cross_channel_journey.length > 0 ? (
            data.cross_channel_journey.map((journey: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center space-x-4 p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors cursor-pointer"
                onClick={(e) => {
                  selectionManager.addPoint({
                    label: `Journey: ${journey.path}`,
                    value: `${journey.customer_count} customers`,
                    source: 'Cross-Channel Journey',
                    metadata: journey
                  }, e.shiftKey);
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {journey.path.split(' → ').map((channel: string, i: number) => (
                      <React.Fragment key={i}>
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                          {channel}
                        </span>
                        {i < journey.path.split(' → ').length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{journey.customer_count}</div>
                  <div className="text-xs text-muted-foreground">customers</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-400">
                    ${journey.avg_value?.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">avg value</div>
                </div>
              </div>
          ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No cross-channel journey data available
            </div>
          )}
        </div>
        </Card>
      </div>
    </div>
  );
}