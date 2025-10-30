"use client";

import React, { useState } from "react";
import { ChartTooltip, useChartTooltip, TooltipItem } from "../ui/ChartTooltip";

export interface FeatureImportance {
  name: string;
  importance: number;
  impact: number;
  icon?: string;
  color?: string;
}

export interface AIFeatureImportanceProps {
  data: FeatureImportance[];
  title?: string;
  sortBy?: "importance" | "name";
  onFeatureClick?: (feature: FeatureImportance, event: React.MouseEvent) => void;
  className?: string;
}

export const AIFeatureImportance: React.FC<AIFeatureImportanceProps> = ({
  data = [],
  title = "AI Feature Importance",
  sortBy = "importance",
  onFeatureClick,
  className = "",
}) => {
  const [selectedSort, setSelectedSort] = useState(sortBy);
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  // Ensure data is an array and fix malformed data
  let safeData = Array.isArray(data) ? data : [];

  // Fix malformed data from agent
  safeData = safeData.map((item, index) => {
    // Fix importance values that might be sent as "905" instead of "90.5"
    let importance = Number(item.importance) || 0;
    if (importance > 100) {
      // Likely missing decimal point - divide by 10
      importance = importance / 10;
    }

    // Get the name from the data - use what agent provides
    let name = item.name || item.label || item.feature || item.factor || "";

    // Only use a generic label if name is completely missing or is just the number value
    if (!name || name === importance.toString() || name === String(importance * 10)) {
      // If we have other fields that might contain the name
      if (item.description) {
        name = item.description;
      } else if (item.metric) {
        name = item.metric;
      } else {
        // Only as last resort, use a generic label
        name = `Feature ${index + 1}`;
      }
    }

    return {
      ...item,
      name,
      importance,
      impact: item.impact || importance
    };
  });

  // Handle empty data case
  if (safeData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No feature importance data available</p>
          <p className="text-xs mt-1">Model needs more data to generate insights</p>
        </div>
      </div>
    );
  }

  const sortedData = [...safeData].sort((a, b) => {
    if (selectedSort === "importance") {
      return (Number(b.importance) || 0) - (Number(a.importance) || 0);
    }
    return (a.name || "").localeCompare(b.name || "");
  });

  const maxImportance = safeData.length > 0
    ? Math.max(...safeData.map(d => Number(d.importance) || 0))
    : 1;

  return (
    <div className={`${className}`}>
      <div className="flex justify-end items-center mb-4">
        <select
          value={selectedSort}
          onChange={(e) => setSelectedSort(e.target.value as "importance" | "name")}
          className="bg-background rounded-lg px-3 py-1 text-sm text-foreground border border-border/0"
        >
          <option value="importance">By Importance</option>
          <option value="name">By Name</option>
        </select>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-4 mb-6">
        {sortedData.map((feature, index) => {
          const width = (Number(feature.importance || 0) / maxImportance) * 100;
          const color = feature.color || getFeatureColor(Number(feature.importance || 0), maxImportance);
          
          return (
            <div
              key={`feature-${index}-${feature.name || 'unknown'}`}
              className="group cursor-pointer"
              onClick={(e) => onFeatureClick?.(feature, e)}
              onMouseEnter={(e) => {
                const tooltipItems: TooltipItem[] = [
                  {
                    label: "Importance",
                    value: `${(Number(feature.importance) || 0).toFixed(1)}%`,
                    color: color,
                  },
                  {
                    label: "Impact",
                    value: `${(Number(feature.impact) || 0).toFixed(1)}%`,
                  },
                ];
                showTooltip(
                  e.clientX,
                  e.clientY,
                  feature.name,
                  tooltipItems
                );
              }}
              onMouseLeave={() => {
                hideTooltip();
              }}
              onMouseMove={(e) => {
                const tooltipItems: TooltipItem[] = [
                  {
                    label: "Importance",
                    value: `${(Number(feature.importance) || 0).toFixed(1)}%`,
                    color: color,
                  },
                  {
                    label: "Impact",
                    value: `${(Number(feature.impact) || 0).toFixed(1)}%`,
                  },
                ];
                showTooltip(
                  e.clientX,
                  e.clientY,
                  feature.name,
                  tooltipItems
                );
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{feature.name}</span>
                <span className="text-sm text-muted">{(Number(feature.importance) || 0).toFixed(1)}%</span>
              </div>
              <div className="relative h-6 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 group-hover:opacity-90"
                  style={{
                    width: `${width}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sortedData.slice(0, 3).map((feature, index) => (
          <div
            key={`metric-${index}-${feature.name || 'unknown'}`}
            className="bg-background rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">{feature.name}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {(feature.impact || 0).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Chart Tooltip */}
      <ChartTooltip
        {...tooltipData}
        variant="dark"
        size="sm"
        showArrow={false}
      />

    </div>
  );
};

function getFeatureColor(importance: number, maxImportance: number): string {
  const ratio = importance / maxImportance;
  if (ratio >= 0.8) return "#ef4444"; // red
  if (ratio >= 0.6) return "#f59e0b"; // orange
  if (ratio >= 0.4) return "#eab308"; // yellow
  return "#10b981"; // green
}

function getFeatureIcon(name: string): string {
  const icons: Record<string, string> = {
    "Recency": "🕐",
    "Frequency": "🔄",
    "Avg Order Value": "💰",
    "RFM": "📊",
    "Diversity": "🎯",
  };
  return icons[name] || "📈";
}
