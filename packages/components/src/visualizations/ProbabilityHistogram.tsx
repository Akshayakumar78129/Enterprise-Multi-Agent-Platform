"use client";

import React, { useState, useMemo } from "react";

export interface HistogramBin {
  range: [number, number];
  count: number;
  percentage: number;
  label: string;
}

export interface ProbabilityHistogramProps {
  data: number[];
  bins?: number;
  title?: string;
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
  title = "Probability Distribution",
  xLabel = "Probability",
  yLabel = "Count",
  color = "#8ba6ff",
  onBarClick,
  height = 300,
  className = "",
}) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const histogram = useMemo(() => {
    const values = Array.isArray(data) ? data.filter(v => Number.isFinite(v)) : [];
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
  }, [data, bins]);

  const maxCount = Math.max(1, ...histogram.map((bin) => bin.count));
  const safeBins = Math.max(1, Math.floor(bins));
  const barWidth = 100 / safeBins;

  return (
    <div className={`${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}

      <div className="relative" style={{ height }}>
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
                onMouseLeave={() => setHoveredBar(null)}
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

                {/* Value label on hover */}
                {isHovered && (
                  <text
                    x={x + width / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {bin.count}
                  </text>
                )}

                {/* X-axis label */}
                {index % Math.ceil(bins / 5) === 0 && (
                  <text
                    x={x + width / 2}
                    y={height - 18}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    transform={`rotate(-45 ${x + width / 2} ${height - 18})`}
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
            y={height - 6}
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

        {/* Tooltip */}
        {hoveredBar !== null && (
          <div
            className="absolute bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 pointer-events-none shadow-lg"
            style={{
              left: `${45 + (hoveredBar * 85) / bins}%`,
              top: "10px",
              zIndex: 1000,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-xs text-foreground">
              <div className="font-semibold mb-1">
                Range: {histogram[hoveredBar].label}
              </div>
              <div>Count: {histogram[hoveredBar].count}</div>
              <div>Percentage: {histogram[hoveredBar].percentage.toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};