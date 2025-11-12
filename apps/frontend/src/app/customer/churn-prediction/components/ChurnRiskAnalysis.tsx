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
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Risk Distribution Pyramid</h3>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Risk Distribution Pyramid",
              value: `Customer risk distribution visualization`,
              source: 'Churn Dashboard - Risk Pyramid'
            }, event.nativeEvent);
          }}
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
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Churn Probability Distribution</h3>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Churn Probability Distribution",
              value: `Churn probability histogram`,
              source: 'Churn Dashboard - Probability'
            }, event.nativeEvent);
          }}
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
      </div>
    </>
  );
}