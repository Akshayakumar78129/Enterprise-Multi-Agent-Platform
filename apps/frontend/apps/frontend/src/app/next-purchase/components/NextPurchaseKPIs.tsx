// Next Purchase Predictor KPIs Component - Following churn pattern
import React from "react";
import { KPITiles, type KPITile } from "components";

interface NextPurchaseKPIsProps {
  data: any;
  loading: boolean;
}

export function NextPurchaseKPIs({ data, loading }: NextPurchaseKPIsProps) {

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
        title: "Avg Days To Next",
        value: formatKPIValue(data?.kpiMetrics?.avgDaysToNext || 0, "avgDaysToNext"),
        trend: getTrend("avgDaysToNext"),
        format: getFormat("avgDaysToNext")
      }, {
        title: "Accuracy Rate",
        value: formatKPIValue(data?.kpiMetrics?.accuracyRate || 0, "accuracyRate"),
        trend: getTrend("accuracyRate"),
        format: getFormat("accuracyRate")
      }, {
        title: "Conversion Probability",
        value: formatKPIValue(data?.kpiMetrics?.conversionProbability || 0, "conversionProbability"),
        trend: getTrend("conversionProbability"),
        format: getFormat("conversionProbability")
      }, {
        title: "Recommendation Score",
        value: formatKPIValue(data?.kpiMetrics?.recommendationScore || 0, "recommendationScore"),
        trend: getTrend("recommendationScore"),
        format: getFormat("recommendationScore")
      }
  ];

  return <KPITiles tiles={kpiTiles} loading={loading} />;
}
