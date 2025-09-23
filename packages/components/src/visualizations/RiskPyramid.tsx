"use client";

import React, { useState } from "react";
import { ChartTooltip, useChartTooltip, TooltipItem } from "../ui/ChartTooltip";

export interface RiskLevel {
  level: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RiskPyramidProps {
  data: RiskLevel[];
  onSegmentClick?: (level: RiskLevel, event: React.MouseEvent) => void;
  height?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
  className?: string;
}

export const RiskPyramid: React.FC<RiskPyramidProps> = ({
  data,
  onSegmentClick,
  height = 300,
  showLabels = true,
  showPercentages = true,
  className = "",
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  const safeData = Array.isArray(data) ? data : [];

  // Handle empty data case
  if (safeData.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No risk data available</p>
          <p className="text-xs mt-1">Try adjusting your filters or time range</p>
        </div>
      </div>
    );
  }

  const counts = safeData.map(d => (typeof d.count === "number" ? d.count : 0));
  const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;
  const segmentHeight = safeData.length > 0 ? height / safeData.length : height;

  const getSegmentWidth = (count: number, index: number) => {
    // Pyramid-style relative sizing - top segments are narrower, bottom wider
    const levelMultiplier = 1 - (index * 0.15); // Each level gets 15% narrower
    const baseWidth = 60; // Base width percentage

    if (count === 0) {
      // For zero values, still show a visible segment with pyramid shape
      return baseWidth * levelMultiplier * 0.6; // 60% of normal width for zero values
    }

    if (maxCount === 0) {
      // If all counts are zero, show pyramid shape with equal relative segments
      return baseWidth * levelMultiplier;
    }

    // Calculate relative scale based on data
    const dataScale = (count / maxCount);

    // Combine pyramid shape with data scaling
    // Minimum 50% of base width to ensure visibility
    const scaledWidth = baseWidth * levelMultiplier * Math.max(0.5, dataScale);

    return Math.min(85, scaledWidth); // Cap at 85% max width
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 400 ${height}`} preserveAspectRatio="xMidYMid meet">
          {safeData.map((level, index) => {
            const width = getSegmentWidth(level.count || 0, index) * 3.5; // Scale for viewBox with pyramid shape
            const x = (400 - width) / 2;
            const y = index * segmentHeight;
            const isHovered = hoveredSegment === level.level;

            return (
              <g
                key={level.level}
                onClick={(e) => onSegmentClick?.(level, e)}
                onMouseEnter={(e) => {
                  setHoveredSegment(level.level);
                }}
                onMouseMove={(e) => {
                  const tooltipItems: TooltipItem[] = [
                    {
                      label: "Count",
                      value: level.count,
                      color: level.color,
                    },
                    {
                      label: "Percentage",
                      value: `${(level.percentage || 0).toFixed(1)}%`,
                    },
                  ];
                  // Use mouse cursor position
                  showTooltip(
                    e.clientX,
                    e.clientY,
                    level.level,
                    tooltipItems
                  );
                }}
                onMouseLeave={() => {
                  setHoveredSegment(null);
                  hideTooltip();
                }}
                style={{ cursor: onSegmentClick ? "pointer" : "default" }}
              >
                {/* Segment */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={segmentHeight - 2}
                  fill={level.count === 0 ? "none" : level.color}
                  fillOpacity={isHovered ? 0.9 : 0.8}
                  stroke={level.count === 0 ? level.color : (isHovered ? "#fff" : "transparent")}
                  strokeWidth={level.count === 0 ? 2 : (isHovered ? 2 : 0)}
                  strokeDasharray={level.count === 0 ? "5,5" : "none"}
                  rx={4}
                  className="transition-all duration-200"
                />

                {/* Label - Always visible with adaptive sizing */}
                {showLabels && (
                  <text
                    x={200}
                    y={y + segmentHeight / 2 - (showPercentages ? 8 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={level.count === 0 ? level.color : "#fff"}
                    fontSize={Math.max(11, Math.min(15, segmentHeight / 3))}
                    fontWeight="600"
                  >
                    {level.level}
                  </text>
                )}

                {/* Count and Percentage - Always show for small segments */}
                {showPercentages && (
                  <text
                    x={200}
                    y={y + segmentHeight / 2 + (showLabels ? 12 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={level.count === 0 ? level.color : "#fff"}
                    fontSize={Math.max(9, Math.min(12, segmentHeight / 4))}
                    opacity={0.95}
                  >
                    {level.count === 0 ? "0" : `${level.count} (${(level.percentage || 0).toFixed(1)}%)`}
                  </text>
                )}

              </g>
            );
          })}
      </svg>

      {/* Unified Chart Tooltip */}
      <ChartTooltip
        {...tooltipData}
        variant="dark"
        size="sm"
        showArrow={false}
      />
    </div>
  );
};