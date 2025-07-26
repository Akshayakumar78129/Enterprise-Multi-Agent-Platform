import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const RetentionKPITiles = ({ kpis, isLoading = false }) => {
  if (!kpis) return null;

  const tiles = [
    {
      label: "Total Customers",
      value: kpis.totalCustomers || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: "In analysis",
      variant: "default",
      icon: "👥",
      background: "#232a36",
      color: "#f7f9fb"
    },
    {
      label: "High Risk Count",
      value: kpis.highRiskCount || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: `${kpis.highRiskPercentage || 0}% of total`,
      variant: kpis.highRiskPercentage > 30 ? "alert" : "default",
      icon: "⚠️",
      background: "#232a36",
      color: kpis.highRiskPercentage > 30 ? "#e930ff" : "#f7f9fb",
      showProgress: true,
      progressValue: kpis.highRiskPercentage || 0,
      progressMax: 100,
      progressColor: "#e930ff"
    },
    {
      label: "Avg Churn Risk",
      value: kpis.avgChurnRisk || 0,
      formatter: (val) => val.toFixed(2),
      subtitle: "Risk score (0.0-1.0)",
      variant: kpis.avgChurnRisk > 0.5 ? "warning" : "default", 
      icon: "📊",
      background: "#232a36",
      color: "#f7f9fb",
      showProgress: true,
      progressValue: (kpis.avgChurnRisk || 0) * 100,
      progressMax: 100,
      progressColor: kpis.avgChurnRisk > 0.5 ? "#e930ff" : "#00e0ff"
    },
    {
      label: "Action Count",
      value: kpis.actionCount || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: "Recommended Actions",
      variant: "default",
      icon: "🎯",
      background: "#232a36",
      color: "#f7f9fb"
    },
    {
      label: "Expected Effectiveness",
      value: kpis.expectedEffectiveness || 0,
      formatter: (val) => `${val}%`,
      subtitle: "Overall success rate",
      variant: kpis.expectedEffectiveness < 50 ? "warning" : "success",
      icon: "🎯",
      background: "#232a36",
      color: "#f7f9fb",
      showProgress: true,
      progressValue: kpis.expectedEffectiveness || 0,
      progressMax: 100,
      progressColor: kpis.expectedEffectiveness < 50 ? "#e930ff" : "#00e0ff"
    },
    {
      label: "Total ROI",
      value: kpis.totalROI || 0,
      formatter: (val) => `${val > 0 ? '+' : ''}${val}%`,
      subtitle: "Return on investment",
      variant: kpis.totalROI < 0 ? "alert" : "success",
      icon: kpis.totalROI > 0 ? "📈" : "📉",
      background: "#232a36",
      color: kpis.totalROI < 0 ? "#e930ff" : "#00e0ff"
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {tiles.map((tile, index) => (
        <KpiTile 
          key={index} 
          {...tile} 
          isLoading={isLoading}
          style={{
            backgroundColor: tile.background,
            color: tile.color,
            border: "1px solid #3a4459",
            borderRadius: "20px",
            padding: "20px",
            height: "120px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        />
      ))}
    </div>
  );
};

export default RetentionKPITiles; 