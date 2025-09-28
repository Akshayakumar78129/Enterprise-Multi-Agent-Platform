// Customer Lifetime Value KPIs Component - Following churn pattern
import React from "react";
import { KPITiles, type KPITile } from "components";

interface CustomerLtvKPIsProps {
  data: any;
  loading: boolean;
}

export function CustomerLtvKPIs({ data, loading }: CustomerLtvKPIsProps) {

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
        title: "Avg L T V",
        value: formatKPIValue(data?.kpiMetrics?.avgLTV || 0, "avgLTV"),
        trend: getTrend("avgLTV"),
        format: getFormat("avgLTV")
      }, {
        title: "Total L T V",
        value: formatKPIValue(data?.kpiMetrics?.totalLTV || 0, "totalLTV"),
        trend: getTrend("totalLTV"),
        format: getFormat("totalLTV")
      }, {
        title: "High Value Count",
        value: formatKPIValue(data?.kpiMetrics?.highValueCount || 0, "highValueCount"),
        trend: getTrend("highValueCount"),
        format: getFormat("highValueCount")
      }, {
        title: "Ltv Growth",
        value: formatKPIValue(data?.kpiMetrics?.ltvGrowth || 0, "ltvGrowth"),
        trend: getTrend("ltvGrowth"),
        format: getFormat("ltvGrowth")
      }
  ];

  return <KPITiles tiles={kpiTiles} loading={loading} />;
}
