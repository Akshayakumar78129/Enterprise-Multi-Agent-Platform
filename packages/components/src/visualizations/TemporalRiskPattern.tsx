"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Dot,
} from "recharts";
import { format } from "date-fns";

export interface TemporalDataPoint {
  date: string;
  veryHigh: number;
  high: number;
  medium: number;
  low: number;
  total?: number;
}

export interface TemporalRiskPatternProps {
  data: TemporalDataPoint[];
  height?: number;
  onDataPointClick?: (point: any, event: React.MouseEvent) => void;
  showTrend?: boolean;
  showArea?: boolean;
  className?: string;
}

const RISK_COLORS = {
  veryHigh: "#ff1f4f",
  high: "#ff6b35",
  medium: "#ffb800",
  low: "#39ff14"
};

export const TemporalRiskPattern: React.FC<TemporalRiskPatternProps> = ({
  data,
  height = 400,
  onDataPointClick,
  showTrend = true,
  showArea = false,
  className = "",
}) => {
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayDate: format(new Date(item.date), "MMM dd"),
      total: item.veryHigh + item.high + item.medium + item.low
    }));
  }, [data]);

  const ChartComponent = showArea ? AreaChart : LineChart;
  const DataComponent = showArea ? Area : Line;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize">{entry.dataKey.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
          {payload[0]?.payload?.total && (
            <div className="mt-2 pt-2 border-t border-border text-xs">
              <span>Total: </span>
              <span className="font-medium">{payload[0].payload.total}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any, index: number, event: React.MouseEvent) => {
    if (onDataPointClick) {
      onDataPointClick({
        ...data,
        riskLevel: "all",
        value: data.total || 0
      }, event);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={formattedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {showArea && Object.entries(RISK_COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`gradient${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

          <XAxis
            dataKey="displayDate"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "#374151" }}
          />

          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "#374151" }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm capitalize">
                {value.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            )}
          />

          <DataComponent
            type="monotone"
            dataKey="veryHigh"
            stroke={RISK_COLORS.veryHigh}
            fill={showArea ? `url(#gradientveryHigh)` : undefined}
            strokeWidth={2}
            dot={{ r: showTrend ? 0 : 3 }}
            activeDot={{ r: 6, onClick: handleClick }}
            name="Very High"
          />

          <DataComponent
            type="monotone"
            dataKey="high"
            stroke={RISK_COLORS.high}
            fill={showArea ? `url(#gradienthigh)` : undefined}
            strokeWidth={2}
            dot={{ r: showTrend ? 0 : 3 }}
            activeDot={{ r: 6, onClick: handleClick }}
            name="High"
          />

          <DataComponent
            type="monotone"
            dataKey="medium"
            stroke={RISK_COLORS.medium}
            fill={showArea ? `url(#gradientmedium)` : undefined}
            strokeWidth={2}
            dot={{ r: showTrend ? 0 : 3 }}
            activeDot={{ r: 6, onClick: handleClick }}
            name="Medium"
          />

          <DataComponent
            type="monotone"
            dataKey="low"
            stroke={RISK_COLORS.low}
            fill={showArea ? `url(#gradientlow)` : undefined}
            strokeWidth={2}
            dot={{ r: showTrend ? 0 : 3 }}
            activeDot={{ r: 6, onClick: handleClick }}
            name="Low"
          />
        </ChartComponent>
      </ResponsiveContainer>

      {showTrend && data.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          {Object.entries(RISK_COLORS).map(([key, color]) => {
            const latestValue = (data[data.length - 1] as any)[key] || 0;
            const previousValue = data.length > 1 ? (data[data.length - 2] as any)[key] || 0 : latestValue;
            const trend = latestValue - previousValue;
            const trendPercent = previousValue > 0 ? ((trend / previousValue) * 100).toFixed(1) : "0";

            return (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">{latestValue}</div>
                  <div className={`text-xs ${trend > 0 ? 'text-destructive' : trend < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(Number(trendPercent))}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};