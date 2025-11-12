"use client";
import React, { useMemo } from "react";
import { KPIRow, MetricsRow, Skeleton, getShiftClickManager } from "components/index";

interface ChurnKPIsProps {
  data: any;
  loading: boolean;
}

// Helper function to calculate risk transitions from monthly data
function calculateRiskTransitions(data: any): string {
  if (!data?.monthlyRisk || data.monthlyRisk.length < 2) {
    return "0 ↑ 0 ↓";
  }

  // Compare first and last month in the period
  const firstMonth = data.monthlyRisk[data.monthlyRisk.length - 1];  // Oldest
  const lastMonth = data.monthlyRisk[0];  // Most recent

  const firstHighRisk = (firstMonth.high_risk || 0) + (firstMonth.very_high_risk || 0);
  const lastHighRisk = (lastMonth.high_risk || 0) + (lastMonth.very_high_risk || 0);

  const increased = Math.max(0, lastHighRisk - firstHighRisk);
  const decreased = Math.max(0, firstHighRisk - lastHighRisk);

  return `${increased} ↑ ${decreased} ↓`;
}

// Helper function to calculate revenue at risk from customer stats
function calculateRevenueAtRisk(data: any): number {
  if (!data?.customerStats || data.customerStats.length === 0) {
    return 0;
  }

  // Sum lifetime_sales for all high-risk customers (High or Very High)
  return data.customerStats.reduce((sum: number, customer: any) => {
    const riskLevel = customer.riskLevel || customer.risk_level || 'Low';
    const ltv = customer.lifetime_sales || customer.clv || 0;

    if (riskLevel === 'High' || riskLevel === 'Very High') {
      return sum + ltv;
    }
    return sum;
  }, 0);
}

export function ChurnKPIs({ data, loading }: ChurnKPIsProps) {
  const shiftClickManager = getShiftClickManager();

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
          title: "At Risk Customers",
          value: 0,
          format: "number" as const,
          color: "#ef4444",
        },
        {
          id: "revenue-at-risk",
          title: "Revenue at Risk",
          value: 0,
          format: "currency" as const,
          color: "#f59e0b",
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
          title: "Risk Transitions (Period)",
          value: "0 ↑ 0 ↓",
          format: "text" as const,
          color: "#38bdf8",
        },
      ];
    }

    // Calculate totals from segmentRisk data
    let totalCustomers = 0;
    let atRiskCount = 0;  // Medium + High + Very High (all at-risk customers)

    data.segmentRisk.forEach((segment: any) => {
      const low = Number(segment.low || 0);
      const medium = Number(segment.medium || 0);
      const high = Number(segment.high || 0);
      const veryHigh = Number(segment.very_high || 0);

      const segmentTotal = low + medium + high + veryHigh;
      totalCustomers += segmentTotal;
      // Include Medium, High, and Very High as "at risk"
      atRiskCount += medium + high + veryHigh;
    });

    const overallRisk = totalCustomers > 0
      ? (atRiskCount / totalCustomers) * 100
      : 0;

    // Calculate revenue at risk from customer stats
    const revenueAtRisk = calculateRevenueAtRisk(data);

    // Get primary risk factor from feature importance
    const primaryFactor = data.featureImportance && data.featureImportance.length > 0
      ? data.featureImportance[0].name
      : "N/A";

    // Calculate risk transitions from monthly data
    const riskTransitions = calculateRiskTransitions(data);

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
        id: "revenue-at-risk",
        title: "Revenue at Risk",
        value: revenueAtRisk,
        format: "currency" as const,
        color: "#f59e0b",
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
        title: "Risk Transitions (Period)",
        value: riskTransitions,
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

  return (
    <KPIRow
      kpis={kpis}
      columns={5}
      animationDelay={50}
      onKPIShiftClick={(kpi, event) => {
        shiftClickManager.addPoint({
          label: kpi.title,
          value: typeof kpi.value === 'number' ? kpi.value.toString() : kpi.value.toString(),
          source: 'Churn KPIs'
        }, event.nativeEvent);
      }}
    />
  );
}