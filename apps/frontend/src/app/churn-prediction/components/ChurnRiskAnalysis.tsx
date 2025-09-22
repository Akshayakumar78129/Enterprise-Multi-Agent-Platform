"use client";
import React from "react";
import { RiskPyramid, ProbabilityHistogram, Skeleton, ChartCard } from "components/index";
import { useChurnContext } from "../context";

interface ChurnRiskAnalysisProps {
  riskPyramidData: Array<{
    level: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  probabilityData: number[];
  loading: boolean;
  onRiskLevelClick: (level: string) => void;
}

export function ChurnRiskAnalysis({
  riskPyramidData,
  probabilityData,
  loading,
  onRiskLevelClick,
}: ChurnRiskAnalysisProps) {
  const { selectionManager } = useChurnContext();
  if (loading) {
    return (
      <>
        <Skeleton height={350} className="glass-card animate-pulse" />
        <Skeleton height={350} className="glass-card animate-pulse" />
      </>
    );
  }

  return (
    <>
      <ChartCard
        title="Risk Distribution Pyramid"
        className="glass-card card-hover"
      >
        <RiskPyramid
          data={riskPyramidData}
          onSegmentClick={(level, event) => {
            if (event?.shiftKey) {
              // Shift+click: Add to selection
              selectionManager.addPoint({
                label: `${level.level} Risk`,
                value: `${level.count}`,
                source: "Risk Pyramid"
              }, true);
            } else {
              // Regular click: Filter
              onRiskLevelClick(level.level);
            }
          }}
        />
      </ChartCard>
      <ChartCard
        title="Churn Probability Distribution"
        className="glass-card card-hover"
      >
        <ProbabilityHistogram
          data={probabilityData}
          bins={30}
          color="#8ba6ff"
          onBarClick={(bin, event) => {
            if (event?.shiftKey && bin) {
              // Shift+click: Add to selection
              selectionManager.addPoint({
                label: bin.label || `${bin.range[0]}-${bin.range[1]}%`,
                value: `${bin.count} customers`,
                source: "Probability Histogram"
              }, true);
            }
          }}
        />
      </ChartCard>
    </>
  );
}