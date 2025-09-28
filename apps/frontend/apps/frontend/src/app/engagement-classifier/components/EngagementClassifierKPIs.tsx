// Engagement Classifier KPIs Component - Following churn pattern
import React from "react";
import { KPITiles, type KPITile } from "components";

interface EngagementClassifierKPIsProps {
  data: any;
  loading: boolean;
}

export function EngagementClassifierKPIs({ data, loading }: EngagementClassifierKPIsProps) {

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
        title: "Highly Engaged",
        value: formatKPIValue(data?.kpiMetrics?.highlyEngaged || 0, "highlyEngaged"),
        trend: getTrend("highlyEngaged"),
        format: getFormat("highlyEngaged")
      }, {
        title: "At Risk Count",
        value: formatKPIValue(data?.kpiMetrics?.atRiskCount || 0, "atRiskCount"),
        trend: getTrend("atRiskCount"),
        format: getFormat("atRiskCount")
      }, {
        title: "Avg Engagement Score",
        value: formatKPIValue(data?.kpiMetrics?.avgEngagementScore || 0, "avgEngagementScore"),
        trend: getTrend("avgEngagementScore"),
        format: getFormat("avgEngagementScore")
      }, {
        title: "Engagement Trend",
        value: formatKPIValue(data?.kpiMetrics?.engagementTrend || 0, "engagementTrend"),
        trend: getTrend("engagementTrend"),
        format: getFormat("engagementTrend")
      }
  ];

  return <KPITiles tiles={kpiTiles} loading={loading} />;
}
