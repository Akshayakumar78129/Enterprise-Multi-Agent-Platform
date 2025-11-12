"use client";

import React, { useMemo } from 'react';
import { Card, Skeleton, getShiftClickManager } from 'components/index';

interface FCFBridgeData {
  component: string;
  value: number;
  impact_type: string;
  sequence_order: number;
}

interface FCFValueBridgeProps {
  data: FCFBridgeData[];
  loading?: boolean;
}

export function FCFValueBridge({ data, loading }: FCFValueBridgeProps) {
  const shiftClickManager = getShiftClickManager();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Sort by sequence order
    const sorted = [...data].sort((a, b) => a.sequence_order - b.sequence_order);

    // Calculate cumulative values for waterfall
    let cumulative = 0;
    const processedData = sorted.map((item, index) => {
      const start = cumulative;
      const value = item.value || 0;
      const end = cumulative + value;
      cumulative = end;

      return {
        component: item.component,
        value: value,
        start: start,
        end: end,
        impact_type: item.impact_type,
        isPositive: value >= 0,
      };
    });

    // Find max and min for scaling
    const allValues = processedData.flatMap(d => [d.start, d.end]);
    const maxValue = Math.max(...allValues, 0);
    const minValue = Math.min(...allValues, 0);
    const range = maxValue - minValue || 1; // Prevent division by zero

    return { processedData, maxValue, minValue, range };
  }, [data]);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton height={400} className="animate-pulse" />
      </Card>
    );
  }

  if (!chartData || chartData.processedData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No FCF bridge data available
        </div>
      </Card>
    );
  }

  const { processedData, maxValue, minValue, range } = chartData;
  const chartHeight = 300;
  const chartWidth = 800;
  const barWidth = processedData.length > 0 ? Math.min(100, 600 / processedData.length) : 80;
  const leftMargin = 50;
  const rightMargin = 50;
  const topMargin = 40;
  const bottomMargin = 80;

  // Helper to scale values to chart coordinates
  const scaleY = (value: number) => {
    if (!isFinite(value) || range === 0) return topMargin + chartHeight / 2;
    const scaled = topMargin + chartHeight - ((value - minValue) / range) * chartHeight;
    return isFinite(scaled) ? scaled : topMargin + chartHeight / 2;
  };

  const handleBarClick = (item: any, event: React.MouseEvent) => {
    if (!event.shiftKey) return;

    shiftClickManager.addPoint({
      label: `Component: ${item.component}`,
      value: `Value: $${(item.value / 1000000).toFixed(1)}M | Type: ${item.impact_type}`,
      source: 'FCF Value Bridge',
      chartType: 'waterfall'
    }, event.nativeEvent);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="w-full">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + topMargin + bottomMargin}`}
            className="w-full"
            style={{ height: '420px', overflow: 'visible' }}
          >
          {/* Zero line */}
          <line
            x1={leftMargin}
            y1={scaleY(0)}
            x2={chartWidth - rightMargin}
            y2={scaleY(0)}
            stroke="#666"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />

          {/* Bars */}
          {processedData.map((item, index) => {
            const availableWidth = chartWidth - leftMargin - rightMargin;
            const spacing = availableWidth / processedData.length;
            const xPos = leftMargin + (index * spacing) + (spacing / 2);
            const yStart = scaleY(item.start);
            const yEnd = scaleY(item.end);
            const barHeight = Math.abs(yEnd - yStart) || 1;
            const barY = Math.min(yStart, yEnd);

            // Color coding
            let barColor = '#00e0ff'; // Electric Cyan for baseline
            if (item.impact_type === 'reduction') {
              barColor = '#ff5252'; // Red for value destroying
            } else if (item.impact_type === 'increase') {
              barColor = '#00ff88'; // Green for value creating
            }

            return (
              <g key={index}>
                {/* Connector line from previous bar */}
                {index > 0 && (
                  <line
                    x1={leftMargin + ((index - 1) * spacing) + (spacing / 2)}
                    y1={scaleY(processedData[index - 1].end)}
                    x2={xPos}
                    y2={yStart}
                    stroke="#888"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Bar */}
                <rect
                  x={xPos - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  fill={barColor}
                  opacity="0.85"
                  rx="3"
                  stroke={barColor}
                  strokeWidth="1"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleBarClick(item, e)}
                />

                {/* Value label */}
                {isFinite(xPos) && isFinite(barY) && (
                  <text
                    x={xPos}
                    y={barY - 10}
                    textAnchor="middle"
                    className="fill-foreground font-bold"
                    style={{ fontSize: '14px' }}
                  >
                    ${(item.value / 1000000).toFixed(1)}M
                  </text>
                )}

                {/* Component label */}
                {isFinite(xPos) && (
                  <>
                    <text
                      x={xPos}
                      y={topMargin + chartHeight + 25}
                      textAnchor="middle"
                      className="fill-muted-foreground font-medium"
                      style={{ fontSize: '12px' }}
                    >
                      {item.component.split(' ')[0]}
                    </text>
                    <text
                      x={xPos}
                      y={topMargin + chartHeight + 42}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      style={{ fontSize: '11px' }}
                    >
                      {item.component.split(' ').slice(1).join(' ')}
                    </text>
                  </>
                )}
              </g>
            );
          })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-8 text-sm pt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00e0ff' }}></div>
            <span className="text-muted-foreground font-medium">Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00ff88' }}></div>
            <span className="text-muted-foreground font-medium">Value Creating</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff5252' }}></div>
            <span className="text-muted-foreground font-medium">Value Destroying</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
