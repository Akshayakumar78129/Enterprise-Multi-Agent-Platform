"use client";
import React from "react";
import {
  AIFeatureImportance,
  SegmentComparisonMatrix,
  Skeleton
} from "components/index";

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
      <div className="glass-card card-padding card-hover">
        <AIFeatureImportance
          data={featureImportance}
          title="AI Feature Importance"
          onFeatureClick={onFeatureClick || ((feature) => console.log("Feature clicked:", feature))}
        />
      </div>
      <div className="glass-card card-padding card-hover">
        <SegmentComparisonMatrix
          data={segmentComparison}
          segments={segments}
          title="Segment Comparison Matrix"
          onCellClick={onCellClick || ((segment, riskLevel, data) =>
            console.log("Cell clicked:", { segment, riskLevel, data })
          )}
        />
      </div>
    </>
  );
}