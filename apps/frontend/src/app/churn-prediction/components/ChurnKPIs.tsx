"use client";
import React, { useMemo } from "react";
import { KPIRow, MetricsRow, Skeleton } from "components/index";

interface ChurnKPIsProps {
  data: any;
  loading: boolean;
}

export function ChurnKPIs({ data, loading }: ChurnKPIsProps) {
  const kpis = useMemo(() => {
    // Calculate KPIs from actual data
    if (!data || !data.segmentRisk || data.segmentRisk.length === 0) {
      // Return empty/zero KPIs when no data
      return [
        {
          id: "overall-churn-risk",
          title: "Overall Churn Risk",
          value: 0,
          format: "percentage" as const,
          color: "#38bdf8",
        },
        {
          id: "critical-risk-customers",
          title: "Critical Risk Customers",
          value: 0,
          format: "number" as const,
          color: "#38bdf8",
        },
        {
          id: "ai-model-accuracy",
          title: "AI Model Accuracy",
          value: 0,
          format: "percentage" as const,
          color: "#38bdf8",
        },
        {
          id: "primary-risk-factor",
          title: "Primary Risk Factor",
          value: "N/A",
          format: "text" as const,
          color: "#38bdf8",
        },
        {
          id: "risk-transitions",
          title: "Risk Transitions (24h)",
          value: "0",
          format: "text" as const,
          color: "#38bdf8",
        },
      ];
    }

    // Calculate totals from segmentRisk data
    let totalCustomers = 0;
    let atRiskCount = 0;  // Medium + High + Very High (all at-risk customers)
    let veryHighRiskCount = 0;

    data.segmentRisk.forEach((segment: any) => {
      const low = Number(segment.low || 0);
      const medium = Number(segment.medium || 0);
      const high = Number(segment.high || 0);
      const veryHigh = Number(segment.very_high || 0);

      const segmentTotal = low + medium + high + veryHigh;
      totalCustomers += segmentTotal;
      // Include Medium, High, and Very High as "at risk"
      atRiskCount += medium + high + veryHigh;
      veryHighRiskCount += veryHigh;
    });

    const overallRisk = totalCustomers > 0
      ? (atRiskCount / totalCustomers) * 100
      : 0;

    // Get primary risk factor from feature importance
    const primaryFactor = data.featureImportance && data.featureImportance.length > 0
      ? data.featureImportance[0].name
      : "N/A";

    return [
      {
        id: "overall-churn-risk",
        title: "Overall Churn Risk",
        value: overallRisk,
        format: "percentage" as const,
        color: "#38bdf8",
      },
      {
        id: "critical-risk-customers",
        title: "At Risk Customers",
        value: atRiskCount,
        format: "number" as const,
        color: "#ef4444",
      },
      {
        id: "ai-model-accuracy",
        title: "AI Model Accuracy",
        value: 85.0,  // This would come from model metrics
        format: "percentage" as const,
        color: "#38bdf8",
      },
      {
        id: "primary-risk-factor",
        title: "Primary Risk Factor",
        value: primaryFactor,
        format: "text" as const,
        color: "#38bdf8",
      },
      {
        id: "risk-transitions",
        title: "Risk Transitions (24h)",
        value: "0",  // This would need historical comparison
        format: "text" as const,
        color: "#38bdf8",
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <MetricsRow>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={120} className="animate-pulse" />
        ))}
      </MetricsRow>
    );
  }

  return <KPIRow kpis={kpis} columns={5} animationDelay={50} />;
}