// Customer Segmentation KPIs Component - Following churn pattern
import React from "react";
import { KPITiles, type KPITile } from "components";

interface CustomerSegmentationKPIsProps {
  data: any;
  loading: boolean;
}

export function CustomerSegmentationKPIs({ data, loading }: CustomerSegmentationKPIsProps) {

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
        title: "Total Segments",
        value: formatKPIValue(data?.kpiMetrics?.totalSegments || 0, "totalSegments"),
        trend: getTrend("totalSegments"),
        format: getFormat("totalSegments")
      }, {
        title: "Largest Segment Size",
        value: formatKPIValue(data?.kpiMetrics?.largestSegmentSize || 0, "largestSegmentSize"),
        trend: getTrend("largestSegmentSize"),
        format: getFormat("largestSegmentSize")
      }, {
        title: "Avg Segment Value",
        value: formatKPIValue(data?.kpiMetrics?.avgSegmentValue || 0, "avgSegmentValue"),
        trend: getTrend("avgSegmentValue"),
        format: getFormat("avgSegmentValue")
      }, {
        title: "Segmentation Quality",
        value: formatKPIValue(data?.kpiMetrics?.segmentationQuality || 0, "segmentationQuality"),
        trend: getTrend("segmentationQuality"),
        format: getFormat("segmentationQuality")
      }
  ];

  return <KPITiles tiles={kpiTiles} loading={loading} />;
}
