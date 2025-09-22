"use client";
import React from "react";
import {
  AIFeatureImportance,
  SegmentComparisonMatrix,
  Skeleton,
  ChartCard
} from "components/index";
import { useChurnContext } from "../context";

interface FeatureImportanceData {
  name: string;
  importance: number;
  impact: number;
  icon?: string;
  color?: string;
}

interface SegmentComparisonData {
  segment: string;
  riskLevel: string;
  count: number;
  percentage?: number;
}

interface ChurnAIInsightsProps {
  featureImportance: FeatureImportanceData[];
  segmentComparison: SegmentComparisonData[];
  loading: boolean;
  onFeatureClick?: (feature: any) => void;
  onCellClick?: (segment: string, riskLevel: string, data: any) => void;
}

export function ChurnAIInsights({
  featureImportance,
  segmentComparison,
  loading,
  onFeatureClick,
  onCellClick,
}: ChurnAIInsightsProps) {
  const { selectionManager } = useChurnContext();
  if (loading) {
    return (
      <>
        <Skeleton height={400} className="glass-card animate-pulse" />
        <Skeleton height={400} className="glass-card animate-pulse" />
      </>
    );
  }

  // Extract unique segments from the data
  const uniqueSegments = Array.from(new Set(segmentComparison.map(item => item.segment))).filter(Boolean);
  const segments = uniqueSegments.length > 0 ? uniqueSegments : ["Enterprise", "Mid-Market", "Small Business", "Startup"];

  return (
    <>
      <ChartCard
        title="AI Feature Importance"
        className="glass-card card-hover"
      >
        <AIFeatureImportance
          data={featureImportance}
          onFeatureClick={(feature, event) => {
            if (event?.shiftKey) {
              // Shift+click: Add to selection
              selectionManager.addPoint({
                label: feature.name,
                value: `${feature.importance}%`,
                source: "Feature Importance"
              }, true);
            } else if (onFeatureClick) {
              onFeatureClick(feature);
            }
          }}
        />
      </ChartCard>
      <ChartCard
        title="Segment Comparison Matrix"
        className="glass-card card-hover"
      >
        <SegmentComparisonMatrix
          data={segmentComparison}
          segments={segments}
          onCellClick={(segment, riskLevel, data, event) => {
            if (event?.shiftKey) {
              // Shift+click: Add to selection
              selectionManager.addPoint({
                label: `${segment} - ${riskLevel}`,
                value: data.count || 0,
                source: "Segment Matrix"
              }, true);
            } else if (onCellClick) {
              onCellClick(segment, riskLevel, data);
            }
          }}
        />
      </ChartCard>
    </>
  );
}