"use client";

import React, { useState } from "react";
import { ChartTooltip, useChartTooltip, TooltipItem } from "../ui/ChartTooltip";

export interface TrendDataPoint {
  date: string;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
}

export interface RiskTrendsOverTimeProps {
  data: TrendDataPoint[];
  timeRange?: "7d" | "30d" | "90d";
  onTimeRangeChange?: (range: "7d" | "30d" | "90d") => void;
  onDataPointClick?: (dataPoint: TrendDataPoint, event: React.MouseEvent) => void;
  className?: string;
}

export const RiskTrendsOverTime: React.FC<RiskTrendsOverTimeProps> = ({
  data,
  timeRange = "30d",
  onTimeRangeChange,
  onDataPointClick,
  className = "",
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  const timeRanges: Array<{value: "7d" | "30d" | "90d", label: string}> = [
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
  ];

  // Compute visible window based on selected range
  const windowSize = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
  const visibleData = data.slice(-Math.min(windowSize, data.length));

  // Calculate totals for each risk level (visible window)
  const totals = visibleData.reduce((acc, point) => ({
    low: acc.low + point.low,
    medium: acc.medium + point.medium,
    high: acc.high + point.high,
    veryHigh: acc.veryHigh + point.veryHigh,
  }), { low: 0, medium: 0, high: 0, veryHigh: 0 });

  const totalCustomers = totals.low + totals.medium + totals.high + totals.veryHigh;

  // Calculate percentage change per risk between first and last visible points
  const first = visibleData[0];
  const last = visibleData[visibleData.length - 1];
  const pct = (a: number, b: number) => {
    const base = a === 0 ? 1 : a;
    return ((b - a) / base) * 100;
  };
  const changes = first && last ? {
    low: Number(pct(first.low, last.low).toFixed(1)),
    medium: Number(pct(first.medium, last.medium).toFixed(1)),
    high: Number(pct(first.high, last.high).toFixed(1)),
    veryHigh: Number(pct(first.veryHigh, last.veryHigh).toFixed(1)),
  } : { low: 0, medium: 0, high: 0, veryHigh: 0 };

  const riskColors = {
    low: "#4ade80",       // muted green
    medium: "#facc15",    // muted yellow
    high: "#fb923c",      // muted orange
    veryHigh: "#f87171",  // muted red
  };

  const riskLabels = {
    low: "Low",
    medium: "Medium", 
    high: "High",
    veryHigh: "Very High",
  };

  return (
    <div className={`${className}`}>
      <div className="flex justify-end items-center mb-4">
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => onTimeRangeChange?.(range.value)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${timeRange === range.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted hover:text-foreground'
                }
              `}
              suppressHydrationWarning
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stacked Area Chart */}
      <div className="mb-6">
        <div className="h-56 bg-background rounded-lg p-4 pb-16 relative" style={{ overflow: 'visible' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 200" className="absolute inset-0" style={{ overflow: 'visible' }}>
            {/* Y-axis labels */}
            <text x="10" y="20" fill="#64748b" fontSize="12" textAnchor="start">2500</text>
            <text x="10" y="60" fill="#64748b" fontSize="12" textAnchor="start">2000</text>
            <text x="10" y="100" fill="#64748b" fontSize="12" textAnchor="start">1500</text>
            <text x="10" y="140" fill="#64748b" fontSize="12" textAnchor="start">1000</text>
            <text x="10" y="180" fill="#64748b" fontSize="12" textAnchor="start">500</text>
            <text x="10" y="200" fill="#64748b" fontSize="12" textAnchor="start">0</text>

            {/* X-axis labels */}
            {visibleData.map((point, index) => {
              if (index % Math.ceil(data.length / 8) === 0) {
                const x = 50 + (index / (visibleData.length - 1 || 1)) * 700;
                return (
                  <text
                    key={index}
                    x={x}
                    y="208"
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                );
              }
              return null;
            })}

            {/* Stacked areas */}
            {Object.entries(riskColors).map(([riskLevel, color], levelIndex) => {
              const points = visibleData.map((point, index) => {
                const x = 50 + (index / (visibleData.length - 1 || 1)) * 700;
                let y = 200;
                
                // Calculate cumulative height
                for (let i = 0; i <= levelIndex; i++) {
                  const level = Object.keys(riskColors)[i] as keyof typeof riskColors;
                  y -= (point[level] / 2500) * 200;
                }
                
                return `${x},${y}`;
              });

              const bottomPoints = visibleData.map((point, index) => {
                const x = 50 + (index / (visibleData.length - 1 || 1)) * 700;
                let y = 200;
                
                // Calculate cumulative height for bottom
                for (let i = 0; i < levelIndex; i++) {
                  const level = Object.keys(riskColors)[i] as keyof typeof riskColors;
                  y -= (point[level] / 2500) * 200;
                }
                
                return `${x},${y}`;
              });

              const pathData = `M ${points.join(' L ')} L ${bottomPoints.reverse().join(' L ')} Z`;

              return (
                <path
                  key={riskLevel}
                  d={pathData}
                  fill={color}
                  fillOpacity={0.7}
                  stroke={color}
                  strokeWidth={1}
                />
              );
            })}

            {/* Invisible hover areas for tooltips */}
            {visibleData.map((point, index) => {
              const x = 50 + (index / (visibleData.length - 1 || 1)) * 700;
              const width = 700 / (visibleData.length || 1);

              return (
                <rect
                  key={index}
                  x={x - width/2}
                  y={0}
                  width={width}
                  height={200}
                  fill="transparent"
                  onMouseEnter={(e) => {
                    setHoveredPoint(point);
                    const tooltipItems: TooltipItem[] = [
                      {
                        label: "Low",
                        value: point.low,
                        color: riskColors.low,
                      },
                      {
                        label: "Medium",
                        value: point.medium,
                        color: riskColors.medium,
                      },
                      {
                        label: "High",
                        value: point.high,
                        color: riskColors.high,
                      },
                      {
                        label: "Very High",
                        value: point.veryHigh,
                        color: riskColors.veryHigh,
                      },
                    ];
                    const rect = e.currentTarget.getBoundingClientRect();
                    showTooltip(
                      rect.left + rect.width / 2,
                      rect.top,
                      new Date(point.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }),
                      tooltipItems
                    );
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                    hideTooltip();
                  }}
                  onMouseMove={(e) => {
                    const tooltipItems: TooltipItem[] = [
                      {
                        label: "Low",
                        value: point.low,
                        color: riskColors.low,
                      },
                      {
                        label: "Medium",
                        value: point.medium,
                        color: riskColors.medium,
                      },
                      {
                        label: "High",
                        value: point.high,
                        color: riskColors.high,
                      },
                      {
                        label: "Very High",
                        value: point.veryHigh,
                        color: riskColors.veryHigh,
                      },
                    ];
                    showTooltip(
                      e.clientX,
                      e.clientY,
                      new Date(point.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }),
                      tooltipItems
                    );
                  }}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => onDataPointClick?.(point, e)}
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          {Object.entries(riskColors).map(([riskLevel, color]) => (
            <div key={riskLevel} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-muted">{riskLabels[riskLevel as keyof typeof riskLabels]} Risk</span>
            </div>
          ))}
        </div>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {Object.entries(riskLabels).map(([riskLevel, label]) => {
          const count = totals[riskLevel as keyof typeof totals];
          const change = changes[riskLevel as keyof typeof changes];
          const color = riskColors[riskLevel as keyof typeof riskColors];
          
          return (
            <div key={riskLevel} className="bg-background rounded-lg p-4 border border-border">
              <div className="mb-2">
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">{count}</div>
              <div className={`text-sm ${change > 0 ? 'text-red-500' : change < 0 ? 'text-green-500' : 'text-muted'}`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      {/* Footer note removed */}

      {/* Chart Tooltip */}
      <ChartTooltip
        {...tooltipData}
        variant="dark"
        size="sm"
        showArrow={false}
        footer={hoveredPoint ? `Total: ${(hoveredPoint.low + hoveredPoint.medium + hoveredPoint.high + hoveredPoint.veryHigh).toLocaleString()}` : undefined}
      />
    </div>
  );
};
