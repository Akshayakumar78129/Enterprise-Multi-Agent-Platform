"use client";

import React from "react";
import { Card, BarChart, Skeleton } from "components/index";
import { useBehaviorContext } from "../context";
import { Line } from "react-chartjs-2";

// Radar Chart Component (following pattern from SegmentProfileCards)
function RadarChart({ data, color, size = 200 }: { data: any[], color: string, size?: number }) {
  const center = size / 2;
  const maxRadius = (size / 2) - 20;
  const angleStep = (Math.PI * 2) / data.length;
  const angles = data.map((_, i) => -Math.PI / 2 + i * angleStep);

  // Create path data for the filled area
  const pathPoints = data.map((point, i) => {
    const radius = (point.value / 100) * maxRadius;
    const x = center + Math.cos(angles[i]) * radius;
    const y = center + Math.sin(angles[i]) * radius;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid circles */}
      {[20, 40, 60, 80, 100].map(percentage => (
        <circle
          key={percentage}
          cx={center}
          cy={center}
          r={(percentage / 100) * maxRadius}
          fill="none"
          stroke="#e8d4e6"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}

      {/* Grid lines */}
      {angles.map((angle, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={center + Math.cos(angle) * maxRadius}
          y2={center + Math.sin(angle) * maxRadius}
          stroke="#e8d4e6"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}

      {/* Data area */}
      <path
        d={pathPoints}
        fill={color}
        fillOpacity="0.3"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((point, i) => {
        const radius = (point.value / 100) * maxRadius;
        const x = center + Math.cos(angles[i]) * radius;
        const y = center + Math.sin(angles[i]) * radius;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Labels */}
      {data.map((point, i) => {
        const labelRadius = maxRadius + 15;
        const x = center + Math.cos(angles[i]) * labelRadius;
        const y = center + Math.sin(angles[i]) * labelRadius;
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#8b5cf6"
            fontSize="11"
            fontWeight="500"
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}

interface PurchasePatternsProps {
  data: any;
  loading: boolean;
}

export function PurchasePatterns({ data, loading }: PurchasePatternsProps) {
  const { selectionManager } = useBehaviorContext();

  if (loading) {
    return (
      <Card title="Purchase Patterns" description="Customer buying behavior over time">
        <Skeleton className="h-80" />
      </Card>
    );
  }

  // Only use real time series data
  const timeSeriesData = data?.time_series_data && data.time_series_data.length > 0 ? {
    labels: data.time_series_data.map((d: any) => d.date),
    datasets: [
      {
        label: 'Purchase Count',
        data: data.time_series_data.map((d: any) => d.purchase_count),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Avg Order Value',
        data: data.time_series_data.map((d: any) => d.avg_order_value),
        borderColor: '#e8d4e6',
        backgroundColor: 'rgba(232, 212, 230, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  } : null;

  const frequencyData = data?.frequency_distribution ? {
    labels: Object.keys(data.frequency_distribution),
    datasets: [
      {
        label: 'Customer Count',
        data: Object.values(data.frequency_distribution),
        backgroundColor: 'rgba(0, 224, 255, 0.8)',
        borderColor: '#00e0ff',
        borderWidth: 1
      }
    ]
  } : null;

  const handlePointClick = (elements: any, event: any) => {
    if (elements.length > 0 && timeSeriesData) {
      const element = elements[0];
      const dataset = timeSeriesData.datasets[element.datasetIndex];
      const label = timeSeriesData.labels[element.index];
      const value = dataset.data[element.index];

      selectionManager.addPoint({
        label: `${dataset.label} - ${label}`,
        value: value.toString(),
        source: 'Purchase Patterns',
        metadata: {
          type: 'time_series',
          dataset: dataset.label,
          date: label
        }
      }, event?.native?.shiftKey || false);
    }
  };

  // Prepare radar chart data based on purchase patterns - only if real data exists
  const hasRadarData = data && (
    data.avgDaysBetweenPurchases ||
    data.avgDaysSinceLastPurchase ||
    data.avgOrderValue ||
    data.repeatPurchaseRate ||
    data.purchaseTrend
  );

  const radarData = hasRadarData ? [
    {
      label: 'Frequency',
      value: Math.min(100, ((30 / (data?.avgDaysBetweenPurchases || 30)) * 100))
    },
    {
      label: 'Recency',
      value: Math.max(0, 100 - ((data?.avgDaysSinceLastPurchase || 0) / 365) * 100)
    },
    {
      label: 'Value',
      value: Math.min(100, ((data?.avgOrderValue || 0) / 500) * 100)
    },
    {
      label: 'Loyalty',
      value: Math.min(100, ((data?.repeatPurchaseRate || 0) * 100))
    },
    {
      label: 'Trend',
      value: 50 + ((data?.purchaseTrend || 0) * 50)
    }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Purchase Timeline"
          description="Purchase trends over time">
          <div className="h-80 p-4">
            {timeSeriesData ? (
            <Line
              data={timeSeriesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index' as const,
                  intersect: false
                },
                onClick: handlePointClick,
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
                        return context.datasetIndex === 0
                          ? `${label}: ${value} purchases`
                          : `${label}: $${value.toFixed(2)}`;
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
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    grid: { color: 'rgba(232, 212, 230, 0.1)' },
                    ticks: { color: '#8b5cf6' },
                    title: {
                      display: true,
                      text: 'Purchase Count',
                      color: '#8b5cf6'
                    }
                  },
                  y1: {
                    type: 'linear' as const,
                    display: true,
                    position: 'right' as const,
                    grid: { drawOnChartArea: false },
                    ticks: {
                      color: '#8b5cf6',
                      callback: (value: any) => `$${value}`
                    },
                    title: {
                      display: true,
                      text: 'Order Value',
                      color: '#8b5cf6'
                    }
                  }
                }
              }}
            />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No purchase timeline data available
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Purchase Pattern Analysis"
          description="Multi-dimensional pattern overview">
          <div className="h-80 flex items-center justify-center">
            {radarData.length > 0 ? (
              <RadarChart
                data={radarData}
                color="#8b5cf6"
                size={280}
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No pattern data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {frequencyData && (
        <Card
          title="Purchase Frequency Distribution"
          description="Customer distribution by purchase frequency">
          <div className="h-64">
            <BarChart
              data={frequencyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(232, 212, 230, 0.1)' },
                    ticks: { color: '#8b5cf6' }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#8b5cf6' },
                    title: {
                      display: true,
                      text: 'Days Between Purchases',
                      color: '#8b5cf6'
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}