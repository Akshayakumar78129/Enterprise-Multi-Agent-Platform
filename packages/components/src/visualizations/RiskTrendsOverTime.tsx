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
  onDataPointClick?: (dataPoint: TrendDataPoint, event: React.MouseEvent) => void;
  className?: string;
}

export const RiskTrendsOverTime: React.FC<RiskTrendsOverTimeProps> = ({
  data,
  onDataPointClick,
  className = "",
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  // Show all available data
  const visibleData = data;

  // Calculate totals for each risk level
  const totals = visibleData.reduce((acc, point) => ({
    low: acc.low + point.low,
    medium: acc.medium + point.medium,
    high: acc.high + point.high,
    veryHigh: acc.veryHigh + point.veryHigh,
  }), { low: 0, medium: 0, high: 0, veryHigh: 0 });

  const totalCustomers = totals.low + totals.medium + totals.high + totals.veryHigh;

  // Calculate dynamic max value for Y-axis (with 10% padding)
  const maxValue = Math.max(...visibleData.map(d => d.low + d.medium + d.high + d.veryHigh)) * 1.1;
  const roundedMax = Math.ceil(maxValue / 500) * 500; // Round up to nearest 500

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
      {/* Stacked Area Chart */}
      <div className="mb-6">
        <div className="h-56 bg-background rounded-lg p-4 pb-16 relative" style={{ overflow: 'visible' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 200" className="absolute inset-0" style={{ overflow: 'visible' }}>
            {/* Y-axis labels */}
            <text x="10" y="20" fill="#64748b" fontSize="12" textAnchor="start">{roundedMax}</text>
            <text x="10" y="60" fill="#64748b" fontSize="12" textAnchor="start">{Math.round(roundedMax * 0.8)}</text>
            <text x="10" y="100" fill="#64748b" fontSize="12" textAnchor="start">{Math.round(roundedMax * 0.6)}</text>
            <text x="10" y="140" fill="#64748b" fontSize="12" textAnchor="start">{Math.round(roundedMax * 0.4)}</text>
            <text x="10" y="180" fill="#64748b" fontSize="12" textAnchor="start">{Math.round(roundedMax * 0.2)}</text>
            <text x="10" y="200" fill="#64748b" fontSize="12" textAnchor="start">0</text>

            {/* Y-axis label */}
            <text
              x="-100"
              y="5"
              fill="#64748b"
              fontSize="12"
              textAnchor="middle"
              transform="rotate(-90)"
            >
              Number of Customers
            </text>

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

            {/* X-axis label */}
            <text
              x="400"
              y="230"
              fill="#64748b"
              fontSize="12"
              textAnchor="middle"
            >
              Date
            </text>

            {/* Stacked areas */}
            {Object.entries(riskColors).map(([riskLevel, color], levelIndex) => {
              const points = visibleData.map((point, index) => {
                const x = 50 + (index / (visibleData.length - 1 || 1)) * 700;
                let y = 200;
                
                // Calculate cumulative height
                for (let i = 0; i <= levelIndex; i++) {
                  const level = Object.keys(riskColors)[i] as keyof typeof riskColors;
                  y -= (point[level] / roundedMax) * 200;
                }
                
                return `${x},${y}`;
              });

              const bottomPoints = visibleData.map((point, index) => {
                const x = 50 + (index / (visibleData.length - 1 || 1)) * 700;
                let y = 200;
                
                // Calculate cumulative height for bottom
                for (let i = 0; i < levelIndex; i++) {
                  const level = Object.keys(riskColors)[i] as keyof typeof riskColors;
                  y -= (point[level] / roundedMax) * 200;
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

        {/* Legend - positioned below date label */}
        <div className="flex justify-center gap-6 mt-10">
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
