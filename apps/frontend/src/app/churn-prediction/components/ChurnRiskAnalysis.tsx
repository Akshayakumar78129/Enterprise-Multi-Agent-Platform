"use client";
import React from "react";
import { RiskPyramid, ProbabilityHistogram, Skeleton, ChartCard, getShiftClickManager } from "components/index";
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
  const shiftClickManager = getShiftClickManager();
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
          onShiftClick={(level, event) => {
            // Shift+click: Add to global shift+click selection
            shiftClickManager.addPoint({
              label: `Risk: ${level.level}`,
              value: `${level.count} customers (${level.percentage.toFixed(1)}%)`,
              source: 'Churn Risk Pyramid'
            }, event.nativeEvent);
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
              // Shift+click: Add to global shift+click selection
              shiftClickManager.addPoint({
                label: `Probability: ${bin.label || `${bin.range[0]}-${bin.range[1]}%`}`,
                value: `${bin.count} customers`,
                source: "Churn Probability Histogram"
              }, event.nativeEvent);
            }
          }}
        />
      </ChartCard>
    </>
  );
}