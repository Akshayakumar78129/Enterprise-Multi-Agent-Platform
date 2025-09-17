"use client";
import React from "react";
import { RiskPyramid, ProbabilityHistogram, Skeleton } from "components/index";

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
      <div className="glass-card card-padding card-hover">
        <RiskPyramid
          data={riskPyramidData}
          title="Risk Distribution Pyramid"
          onSegmentClick={(level) => onRiskLevelClick(level.level)}
        />
      </div>
      <div className="glass-card card-padding card-hover">
        <ProbabilityHistogram
          data={probabilityData}
          title="Churn Probability Distribution"
          bins={30}
          color="#8ba6ff"
        />
      </div>
    </>
  );
}