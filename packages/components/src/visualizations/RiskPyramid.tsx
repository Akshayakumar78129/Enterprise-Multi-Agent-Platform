"use client";

import React, { useState } from "react";

export interface RiskLevel {
  level: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RiskPyramidProps {
  data: RiskLevel[];
  title?: string;
  onSegmentClick?: (level: RiskLevel, event: React.MouseEvent) => void;
  height?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
  className?: string;
}

export const RiskPyramid: React.FC<RiskPyramidProps> = ({
  data,
  title = "Risk Distribution",
  onSegmentClick,
  height = 300,
  showLabels = true,
  showPercentages = true,
  className = "",
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const safeData = Array.isArray(data) ? data : [];
  const counts = safeData.map(d => (typeof d.count === "number" ? d.count : 0));
  const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;
  const segmentHeight = safeData.length > 0 ? height / safeData.length : height;

  const getSegmentWidth = (count: number) => {
    // Width relative to the count - higher count = wider segment
    return (count / maxCount) * 100;
  };

  return (
    <div className={`p-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}

      <div className="relative" style={{ height }}>
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
                onMouseEnter={() => setHoveredSegment(level.level)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{ cursor: onSegmentClick ? "pointer" : "default" }}
              >
                {/* Segment */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={segmentHeight - 2}
                  fill={level.color}
                  fillOpacity={isHovered ? 0.9 : 0.8}
                  stroke={isHovered ? "#fff" : "transparent"}
                  strokeWidth={2}
                  rx={4}
                  className="transition-all duration-200"
                />

                {/* Label */}
                {showLabels && (
                  <text
                    x={200}
                    y={y + segmentHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={Math.max(12, Math.min(16, segmentHeight / 3))}
                    fontWeight="600"
                  >
                    {level.level}
                  </text>
                )}

                {/* Count and Percentage */}
                {(showPercentages || isHovered) && (
                  <text
                    x={200}
                    y={y + segmentHeight / 2 + Math.min(18, segmentHeight / 2)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={Math.max(10, Math.min(14, segmentHeight / 4))}
                    opacity={0.9}
                  >
                    {level.count} ({level.percentage.toFixed(1)}%)
                  </text>
                )}

                {/* Hover Tooltip */}
                {isHovered && (
                  <g style={{ zIndex: 1000 }}>
                    <rect
                      x={x - 10}
                      y={y - 40}
                      width={width + 20}
                      height={30}
                      fill="rgba(0, 0, 0, 0.95)"
                      rx={6}
                      stroke="#fff"
                      strokeWidth={2}
                      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
                    />
                    <text
                      x={200}
                      y={y - 25}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {level.level}: {level.count} customers ({level.percentage.toFixed(1)}%)
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

      </div>
    </div>
  );
};