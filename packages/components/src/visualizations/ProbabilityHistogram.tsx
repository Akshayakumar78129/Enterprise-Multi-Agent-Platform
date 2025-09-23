"use client";

import React, { useState, useMemo } from "react";
import { ChartTooltip, useChartTooltip, TooltipItem } from "../ui/ChartTooltip";

export interface HistogramBin {
  range: [number, number];
  count: number;
  percentage: number;
  label: string;
}

export interface ProbabilityHistogramProps {
  data: number[];
  bins?: number;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  onBarClick?: (bin: HistogramBin, event: React.MouseEvent) => void;
  height?: number;
  className?: string;
}

export const ProbabilityHistogram: React.FC<ProbabilityHistogramProps> = ({
  data,
  bins = 10,
  xLabel = "Probability",
  yLabel = "Count",
  color = "#8ba6ff",
  onBarClick,
  height = 300,
  className = "",
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // Handle empty data case
  if (safeData.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p className="text-sm">No probability distribution data available</p>
          <p className="text-xs mt-1">Try adjusting your filters or time range</p>
        </div>
      </div>
    );
  }

  const histogram = useMemo(() => {
    const values = safeData.filter(v => Number.isFinite(v));
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const safeBins = Math.max(1, Math.floor(bins));
    const span = max - min;
    const binWidth = span > 0 ? span / safeBins : 1;

    const histogramBins: HistogramBin[] = [];

    for (let i = 0; i < safeBins; i++) {
      const rangeStart = min + i * binWidth;
      const rangeEnd = min + (i + 1) * binWidth;
      const binData = values.filter((value) =>
        i === safeBins - 1
          ? value >= rangeStart && value <= rangeEnd
          : value >= rangeStart && value < rangeEnd
      );

      histogramBins.push({
        range: [rangeStart, rangeEnd],
        count: binData.length,
        percentage: (binData.length / values.length) * 100,
        label: `${rangeStart.toFixed(2)}-${rangeEnd.toFixed(2)}`,
      });
    }

    return histogramBins;
  }, [safeData, bins]);

  const maxCount = Math.max(1, ...histogram.map((bin) => bin.count));
  const safeBins = Math.max(1, Math.floor(bins));
  const barWidth = 100 / safeBins;

  // Handle case where histogram is empty after processing
  if (histogram.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <p className="text-sm">No probability distribution data available</p>
          <p className="text-xs mt-1">Try adjusting your filters or time range</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
        <svg width="100%" height={height} viewBox={`0 0 420 ${height}`}>
          {/* Y-axis */}
          <line
            x1="55"
            y1="15"
            x2="55"
            y2={height - 40}
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* X-axis */}
          <line
            x1="55"
            y1={height - 40}
            x2="405"
            y2={height - 40}
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = height - 40 - (tick * (height - 60));
            const value = Math.round(maxCount * tick);
            return (
              <g key={tick}>
                <line
                  x1="50"
                  y1={y}
                  x2="55"
                  y2={y}
                  stroke="#64748b"
                  strokeWidth="1"
                />
                <text
                  x="45"
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {histogram.map((bin, index) => {
            const barHeight = (bin.count / maxCount) * (height - 60);
            const x = 60 + (index * 350) / safeBins;
            const y = height - 40 - barHeight;
            const width = (350 / safeBins) - 6;
            const isHovered = hoveredBar === index;

            return (
              <g
                key={index}
                onClick={(e) => onBarClick?.(bin, e)}
                onMouseEnter={() => setHoveredBar(index)}
                onMouseMove={(e) => {
                  const tooltipItems: TooltipItem[] = [
                    {
                      label: "Range",
                      value: bin.label,
                      color: color,
                    },
                    {
                      label: "Count",
                      value: bin.count,
                    },
                    {
                      label: "Percentage",
                      value: `${bin.percentage.toFixed(1)}%`,
                    },
                  ];
                  showTooltip(
                    e.clientX,
                    e.clientY,
                    "Probability Distribution",
                    tooltipItems
                  );
                }}
                onMouseLeave={() => {
                  setHoveredBar(null);
                  hideTooltip();
                }}
                style={{ cursor: onBarClick ? "pointer" : "default" }}
              >
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={barHeight}
                  fill={color}
                  fillOpacity={isHovered ? 0.9 : 0.7}
                  rx={2}
                  className="transition-all duration-200"
                />


                {/* X-axis label */}
                {index % Math.ceil(bins / 5) === 0 && (
                  <text
                    x={x + width / 2}
                    y={height - 25}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    transform={`rotate(-45 ${x + width / 2} ${height - 25})`}
                  >
                    {bin.range[0].toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x="210"
            y={height - 3}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
          >
            {xLabel}
          </text>
          <text
            x="20"
            y={height / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="12"
            transform={`rotate(-90 20 ${height / 2})`}
          >
            {yLabel}
          </text>
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