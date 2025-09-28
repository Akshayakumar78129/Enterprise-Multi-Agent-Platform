// Retention Planner KPIs Component - Following churn pattern
import React from "react";
import { KPITiles, type KPITile } from "components";

interface RetentionPlannerKPIsProps {
  data: any;
  loading: boolean;
}

export function RetentionPlannerKPIs({ data, loading }: RetentionPlannerKPIsProps) {

  const formatKPIValue = (value: number, type: string): string => {
    if (type.includes("Rate") || type.includes("percentage") || type.includes("Quality")) {
      return `${value.toFixed(1)}%`;
    }
    if (type.includes("LTV") || type.includes("Value") || type.includes("Savings")) {
      return `$${value.toLocaleString()}`;
    }
    if (type.includes("Days")) {
      return `${value.toFixed(0)} days`;
    }
    return value.toLocaleString();
  };

  const getTrend = (type: string): "up" | "down" | undefined => {
    // Mock trend logic - would be calculated from historical data
    if (type.includes("Growth") || type.includes("Trend")) return "up";
    if (type.includes("atRisk")) return "down";
    return undefined;
  };

  const getFormat = (type: string): "number" | "currency" | "percentage" => {
    if (type.includes("Rate") || type.includes("percentage") || type.includes("Quality")) {
      return "percentage";
    }
    if (type.includes("LTV") || type.includes("Value") || type.includes("Savings")) {
      return "currency";
    }
    return "number";
  };

  const kpiTiles: KPITile[] = [
    {
        title: "Retention Rate",
        value: formatKPIValue(data?.kpiMetrics?.retentionRate || 0, "retentionRate"),
        trend: getTrend("retentionRate"),
        format: getFormat("retentionRate")
      }, {
        title: "At Risk Value",
        value: formatKPIValue(data?.kpiMetrics?.atRiskValue || 0, "atRiskValue"),
        trend: getTrend("atRiskValue"),
        format: getFormat("atRiskValue")
      }, {
        title: "Intervention Success",
        value: formatKPIValue(data?.kpiMetrics?.interventionSuccess || 0, "interventionSuccess"),
        trend: getTrend("interventionSuccess"),
        format: getFormat("interventionSuccess")
      }, {
        title: "Cost Savings",
        value: formatKPIValue(data?.kpiMetrics?.costSavings || 0, "costSavings"),
        trend: getTrend("costSavings"),
        format: getFormat("costSavings")
      }
  ];

  return <KPITiles tiles={kpiTiles} loading={loading} />;
}
