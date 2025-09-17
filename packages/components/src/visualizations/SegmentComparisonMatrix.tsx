"use client";

import React, { useState } from "react";

export interface SegmentData {
  segment: string;
  riskLevel: string;
  count: number;
  percentage?: number;
}

export interface SegmentComparisonMatrixProps {
  data: SegmentData[];
  title?: string;
  segments?: string[];
  riskLevels?: string[];
  onCellClick?: (segment: string, riskLevel: string, data: SegmentData, event: React.MouseEvent) => void;
  className?: string;
}

export const SegmentComparisonMatrix: React.FC<SegmentComparisonMatrixProps> = ({
  data,
  title = "Segment Comparison Matrix",
  segments = ["Enterprise", "Mid-Market", "SMB", "Consumer"],
  riskLevels = ["Very High", "High", "Medium", "Low"],
  onCellClick,
  className = "",
}) => {
  const [hoveredCell, setHoveredCell] = useState<{segment: string, riskLevel: string} | null>(null);

  // Create matrix data
  const matrixData = segments.map(segment => 
    riskLevels.map(riskLevel => {
      const cellData = data.find(d => d.segment === segment && d.riskLevel === riskLevel);
      return {
        segment,
        riskLevel,
        count: cellData?.count || 0,
        percentage: cellData?.percentage || 0,
      };
    })
  );

  const maxCount = Math.max(...data.map(d => d.count));
  const minCount = Math.min(...data.map(d => d.count));

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

  return (
    <div className={`${className}`}>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">{title}</h3>

      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-[500px] px-2 sm:px-0">
          {/* Header */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-3">
            <div className="text-xs sm:text-sm font-medium text-muted"></div>
            {segments.map(segment => (
              <div key={segment} className="text-xs sm:text-sm font-medium text-foreground text-center truncate px-1">
                {segment}
              </div>
            ))}
          </div>

          {/* Matrix */}
          {riskLevels.map((riskLevel, rowIndex) => (
            <div key={riskLevel} className="grid grid-cols-5 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="text-xs sm:text-sm font-medium text-foreground flex items-center justify-end pr-2">
                {riskLevel}
              </div>
              {segments.map((segment, colIndex) => {
                const cellData = matrixData[colIndex][rowIndex];
                const isHovered = hoveredCell?.segment === segment && hoveredCell?.riskLevel === riskLevel;

                return (
                  <div
                    key={`${segment}-${riskLevel}`}
                    className={`
                      relative h-10 sm:h-12 rounded-lg flex items-center justify-center cursor-pointer
                      transition-all duration-200 border-2 shadow-sm
                      ${isHovered ? 'border-accent/50 scale-105 shadow-neo z-10' : 'border-transparent'}
                      hover:shadow-md
                    `}
                    style={{
                      backgroundColor: getCellColor(cellData.count),
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={(e) => onCellClick?.(segment, riskLevel, cellData, e)}
                    onMouseEnter={() => setHoveredCell({segment, riskLevel})}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <span
                      className="text-xs sm:text-sm font-bold"
                      style={{ color: getTextColor(cellData.count) }}
                    >
                      {cellData.count}
                    </span>

                    {/* Tooltip */}
                    {isHovered && (
                      <div
                        className="absolute -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                        style={{
                          background: 'rgba(10, 18, 36, 0.95)',
                          border: '1px solid #00e0ff',
                          borderRadius: 12,
                          padding: '10px 12px',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
                          color: '#f7f9fb',
                          fontSize: 12,
                          zIndex: 10000,
                          pointerEvents: 'none'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#00e0ff', marginBottom: 2 }}>{segment}</div>
                        <div style={{ opacity: 0.9 }}>{riskLevel}: {cellData.count} customers</div>
                        {cellData.percentage > 0 && (
                          <div style={{ color: '#00e0ff', fontWeight: 600 }}>{cellData.percentage.toFixed(1)}%</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-muted font-medium">Customer Count</div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="text-xs text-muted">0</div>
          <div className="flex h-3 sm:h-4 flex-1 sm:w-32 bg-gradient-to-r from-surface to-accent rounded-full shadow-inner"></div>
          <div className="text-xs text-muted font-semibold">{maxCount}</div>
        </div>
      </div>
    </div>
  );
};
