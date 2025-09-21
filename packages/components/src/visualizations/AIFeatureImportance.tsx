"use client";

import React, { useState } from "react";

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

  // Ensure data is an array before spreading
  const safeData = Array.isArray(data) ? data : [];

  const sortedData = [...safeData].sort((a, b) => {
    if (selectedSort === "importance") {
      return b.importance - a.importance;
    }
    return a.name.localeCompare(b.name);
  });

  const maxImportance = safeData.length > 0
    ? Math.max(...safeData.map(d => d.importance))
    : 1;

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
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
          const width = (feature.importance / maxImportance) * 100;
          const color = feature.color || getFeatureColor(feature.importance, maxImportance);
          
          return (
            <div
              key={feature.name}
              className="group cursor-pointer"
              onClick={(e) => onFeatureClick?.(feature, e)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{feature.name}</span>
                <span className="text-sm text-muted">{feature.importance.toFixed(1)}%</span>
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
            key={feature.name}
            className="bg-background rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-foreground">{feature.name}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {feature.impact.toFixed(1)}%
            </div>
            <div className="text-xs text-muted">impact</div>
          </div>
        ))}
      </div>

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
