"use client";

import React, { useState } from "react";
import { ChartTooltip, useChartTooltip, TooltipItem } from "../ui/ChartTooltip";

export interface SegmentData {
  segment: string;
  riskLevel: string;
  count: number;
  percentage?: number;
}

export interface SegmentComparisonMatrixProps {
  data: SegmentData[];
  segments?: string[];
  riskLevels?: string[];
  onCellClick?: (segment: string, riskLevel: string, data: SegmentData, event: React.MouseEvent) => void;
  className?: string;
}

export const SegmentComparisonMatrix: React.FC<SegmentComparisonMatrixProps> = ({
  data,
  segments = ["Enterprise", "Mid-Market", "SMB", "Consumer"],
  riskLevels = ["Very High", "High", "Medium", "Low"],
  onCellClick,
  className = "",
}) => {
  const [hoveredCell, setHoveredCell] = useState<{segment: string, riskLevel: string} | null>(null);
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // Handle empty data case
  if (safeData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <p className="text-sm">No segment comparison data available</p>
          <p className="text-xs mt-1">Try adjusting your filters or time range</p>
        </div>
      </div>
    );
  }

  // Create matrix data
  const matrixData = segments.map(segment =>
    riskLevels.map(riskLevel => {
      const cellData = safeData.find(d => d.segment === segment && d.riskLevel === riskLevel);
      return {
        segment,
        riskLevel,
        count: cellData?.count || 0,
        percentage: cellData?.percentage || 0,
      };
    })
  );

  const maxCount = safeData.length > 0 ? Math.max(...safeData.map(d => d.count || 0), 1) : 1;
  const minCount = safeData.length > 0 ? Math.min(...safeData.map(d => d.count || 0)) : 0;

  const getCellColor = (count: number) => {
    if (count === 0) return "#151926"; // dark surface for zero
    const intensity = (count - minCount) / (maxCount - minCount || 1);
    const hue = 200; // blue hue
    const saturation = 50 + (intensity * 50); // 50-100%
    const lightness = 15 + (intensity * 35); // 15-50%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const getTextColor = (count: number) => {
    if (count === 0) return "#6b7280";
    const intensity = (count - minCount) / (maxCount - minCount || 1);
    return intensity > 0.5 ? "#ffffff" : "#e8eaed";
  };

  const gridCols = segments.length + 1; // +1 for row labels
  const colsClass = `grid-cols-${gridCols}`;

  return (
    <div className={`relative ${className}`}>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[500px]">
          {/* Header */}
          <div className="flex gap-[2px] sm:gap-1 lg:gap-2 mb-2">
            <div className="flex-shrink-0 w-14 sm:w-16 md:w-20 lg:w-24"></div>
            {segments.map(segment => (
              <div key={segment} className="flex-1 text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-foreground text-center truncate px-[2px]">
                {segment}
              </div>
            ))}
          </div>

          {/* Matrix */}
          {riskLevels.map((riskLevel, rowIndex) => (
            <div key={riskLevel} className="flex gap-[2px] sm:gap-1 lg:gap-2 mb-[2px] sm:mb-1">
              <div className="flex-shrink-0 w-14 sm:w-16 md:w-20 lg:w-24 text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-foreground flex items-center justify-end pr-[2px] sm:pr-1">
                {riskLevel}
              </div>
              {segments.map((segment, colIndex) => {
                const cellData = matrixData[colIndex][rowIndex];
                const isHovered = hoveredCell?.segment === segment && hoveredCell?.riskLevel === riskLevel;

                return (
                  <div
                    key={`${segment}-${riskLevel}`}
                    className={`
                      flex-1 aspect-square max-w-[80px] lg:max-w-[100px] rounded-md flex items-center justify-center cursor-pointer
                      transition-all duration-200 border shadow-sm
                      ${isHovered ? 'border-accent/50 scale-105 shadow-lg z-20' : 'border-transparent'}
                      hover:shadow-md
                    `}
                    style={{
                      backgroundColor: getCellColor(cellData.count),
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => onCellClick?.(segment, riskLevel, cellData, e)}
                    onMouseEnter={() => setHoveredCell({segment, riskLevel})}
                    onMouseMove={(e) => {
                      const tooltipItems: TooltipItem[] = [
                        {
                          label: "Segment",
                          value: segment,
                        },
                        {
                          label: "Risk Level",
                          value: riskLevel,
                          color: getCellColor(cellData.count),
                        },
                        {
                          label: "Count",
                          value: cellData.count,
                        },
                        {
                          label: "Percentage",
                          value: `${cellData.percentage.toFixed(1)}%`,
                        },
                      ];
                      showTooltip(
                        e.clientX,
                        e.clientY,
                        `${segment} - ${riskLevel}`,
                        tooltipItems
                      );
                    }}
                    onMouseLeave={() => {
                      setHoveredCell(null);
                      hideTooltip();
                    }}
                  >
                    <span
                      className="text-[9px] sm:text-[11px] md:text-xs lg:text-sm font-bold"
                      style={{ color: getTextColor(cellData.count) }}
                    >
                      {cellData.count}
                    </span>

                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

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
