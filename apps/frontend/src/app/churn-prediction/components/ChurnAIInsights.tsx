"use client";
import React from "react";
import {
  AIFeatureImportance,
  SegmentComparisonMatrix,
  Skeleton,
  ChartCard,
  getShiftClickManager
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
  const shiftClickManager = getShiftClickManager();

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
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">AI Feature Importance</h3>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "AI Feature Importance",
              value: `Feature importance analysis`,
              source: 'Churn Dashboard - AI Insights'
            }, event.nativeEvent);
          }}
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
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Segment Comparison Matrix</h3>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Segment Comparison Matrix",
              value: `Customer segment risk comparison`,
              source: 'Churn Dashboard - Segment Matrix'
            }, event.nativeEvent);
          }}
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
      </div>
    </>
  );
}