// Purchase Frequency KPIs Component - Following churn pattern
import React from "react";
import { KPITiles, type KPITile } from "components";

interface PurchaseFrequencyKPIsProps {
  data: any;
  loading: boolean;
}

export function PurchaseFrequencyKPIs({ data, loading }: PurchaseFrequencyKPIsProps) {

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
        title: "Avg Frequency",
        value: formatKPIValue(data?.kpiMetrics?.avgFrequency || 0, "avgFrequency"),
        trend: getTrend("avgFrequency"),
        format: getFormat("avgFrequency")
      }, {
        title: "High Frequency Customers",
        value: formatKPIValue(data?.kpiMetrics?.highFrequencyCustomers || 0, "highFrequencyCustomers"),
        trend: getTrend("highFrequencyCustomers"),
        format: getFormat("highFrequencyCustomers")
      }, {
        title: "Frequency Trend",
        value: formatKPIValue(data?.kpiMetrics?.frequencyTrend || 0, "frequencyTrend"),
        trend: getTrend("frequencyTrend"),
        format: getFormat("frequencyTrend")
      }, {
        title: "Retention Rate",
        value: formatKPIValue(data?.kpiMetrics?.retentionRate || 0, "retentionRate"),
        trend: getTrend("retentionRate"),
        format: getFormat("retentionRate")
      }
  ];

  return <KPITiles tiles={kpiTiles} loading={loading} />;
}
