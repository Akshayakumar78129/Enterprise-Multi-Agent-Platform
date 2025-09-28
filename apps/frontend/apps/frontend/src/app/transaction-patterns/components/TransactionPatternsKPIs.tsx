// Transaction Patterns KPIs Component - Following churn pattern
import React from "react";
import { KPITiles, type KPITile } from "components";

interface TransactionPatternsKPIsProps {
  data: any;
  loading: boolean;
}

export function TransactionPatternsKPIs({ data, loading }: TransactionPatternsKPIsProps) {

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
        title: "Unique Patterns",
        value: formatKPIValue(data?.kpiMetrics?.uniquePatterns || 0, "uniquePatterns"),
        trend: getTrend("uniquePatterns"),
        format: getFormat("uniquePatterns")
      }, {
        title: "Anomaly Rate",
        value: formatKPIValue(data?.kpiMetrics?.anomalyRate || 0, "anomalyRate"),
        trend: getTrend("anomalyRate"),
        format: getFormat("anomalyRate")
      }, {
        title: "Pattern Stability",
        value: formatKPIValue(data?.kpiMetrics?.patternStability || 0, "patternStability"),
        trend: getTrend("patternStability"),
        format: getFormat("patternStability")
      }, {
        title: "Avg Transaction Value",
        value: formatKPIValue(data?.kpiMetrics?.avgTransactionValue || 0, "avgTransactionValue"),
        trend: getTrend("avgTransactionValue"),
        format: getFormat("avgTransactionValue")
      }
  ];

  return <KPITiles tiles={kpiTiles} loading={loading} />;
}
