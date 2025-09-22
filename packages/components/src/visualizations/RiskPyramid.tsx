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
  const counts = safeData.map(d => (typeof d.count === "number" ? d.count : 0));
  const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;
  const segmentHeight = safeData.length > 0 ? height / safeData.length : height;

  const getSegmentWidth = (count: number) => {
    // Smart sizing algorithm that ensures all segments are visible
    const minWidth = 15; // Minimum width percentage to ensure visibility
    const maxWidth = 85; // Maximum width percentage to leave some padding

    if (count === 0) {
      // For zero values, show a minimal but visible segment
      return 8;
    }

    if (maxCount === 0) {
      // If all counts are zero, show equal minimal segments
      return minWidth;
    }

    // Calculate logarithmic scale for better distribution
    // This compresses the range while maintaining relative differences
    const logScale = Math.log(count + 1) / Math.log(maxCount + 1);

    // Apply the scale with minimum and maximum bounds
    const scaledWidth = minWidth + (logScale * (maxWidth - minWidth));

    return Math.max(minWidth, Math.min(maxWidth, scaledWidth));
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 400 ${height}`} preserveAspectRatio="xMidYMid meet">
          {safeData.map((level, index) => {
            const width = getSegmentWidth(level.count || 0) * 3.5; // Scale for viewBox
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
                      value: `${level.percentage.toFixed(1)}%`,
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
                    {level.count === 0 ? "0" : `${level.count} (${level.percentage.toFixed(1)}%)`}
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