import React from "react";
import { KPICard, KPICardProps } from "./KPICard";

export interface KPIData extends Omit<KPICardProps, "delay"> {
  id: string;
}

export interface KPIRowProps {
  kpis: KPIData[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  animationDelay?: number;
  onKPIClick?: (kpi: KPIData, event: React.MouseEvent) => void;
  className?: string;
}

export const KPIRow: React.FC<KPIRowProps> = ({
  kpis = [],
  columns = 4,
  animationDelay = 100,
  onKPIClick,
  className = "",
}) => {
  // Use CSS grid with auto-fit to allow wrapping when cards get too narrow
  // Maintains minimum readable width and allows wrapping to preserve content quality
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  };

  return (
    <div style={gridStyle} className={className}>
      {(kpis || []).map((kpi, index) => (
        <div
          key={kpi.id}
          className="animate-slide-up"
          style={{ animationDelay: `${index * animationDelay}ms` }}
        >
          <KPICard
            {...kpi}
            delay={index * animationDelay}
            onClick={onKPIClick ? (e) => onKPIClick(kpi, e) : kpi.onClick}
          />
        </div>
      ))}
    </div>
  );
};

export interface AnimatedKPITileProps extends KPICardProps {
  sparklineData?: number[];
  gauge?: {
    value: number;
    max: number;
    thresholds?: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

export const AnimatedKPITile: React.FC<AnimatedKPITileProps> = ({
  sparklineData,
  gauge,
  ...cardProps
}) => {
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length === 0) return null;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const width = 100;
    const height = 30;

    const points = sparklineData
      .map((value, index) => {
        const x = (index / (sparklineData.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="mt-2">
        <polyline
          points={points}
          fill="none"
          stroke={cardProps.color || "#38bdf8"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const renderGauge = () => {
    if (!gauge) return null;

    const percentage = (gauge.value / gauge.max) * 100;
    const rotation = (percentage / 100) * 180 - 90;

    const getGaugeColor = () => {
      if (!gauge.thresholds) return cardProps.color || "#38bdf8";

      if (gauge.value <= gauge.thresholds.low) return "#10b981"; // success
      if (gauge.value <= gauge.thresholds.medium) return "#f59e0b"; // warning
      if (gauge.value <= gauge.thresholds.high) return "#ef4444"; // error
      return "#ef4444"; // error
    };

    return (
      <div className="relative w-20 h-10 mt-2">
        <svg width="80" height="40" viewBox="0 0 80 40">
          {/* Background arc */}
          <path
            d="M 10 35 A 25 25 0 0 1 70 35"
            fill="none"
            stroke="#334155"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 35 A 25 25 0 0 1 70 35"
            fill="none"
            stroke={getGaugeColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 94.2} 94.2`}
          />
          {/* Needle */}
          <line
            x1="40"
            y1="35"
            x2="40"
            y2="15"
            stroke={getGaugeColor()}
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${rotation} 40 35)`}
          />
          {/* Center dot */}
          <circle cx="40" cy="35" r="3" fill={getGaugeColor()} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center mt-1">
          <span className="text-xs font-semibold">{gauge.value}</span>
        </div>
      </div>
    );
  };

  return (
    <KPICard {...cardProps}>
      {sparklineData && renderSparkline()}
      {gauge && renderGauge()}
    </KPICard>
  );
};