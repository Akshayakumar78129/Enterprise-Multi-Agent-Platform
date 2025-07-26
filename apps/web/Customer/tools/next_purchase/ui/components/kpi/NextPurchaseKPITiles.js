import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const NextPurchaseKPITiles = ({ kpis, isLoading = false }) => {
  if (!kpis) return null;

  const tiles = [
    {
      label: "Model Accuracy",
      value: kpis.modelAccuracy || 0,
      formatter: (val) => `${val.toFixed(1)}%`,
      subtitle: "Prediction Accuracy",
      variant: kpis.modelAccuracy > 80 ? "success" : kpis.modelAccuracy > 60 ? "warning" : "danger",
      icon: "🎯",
    },
    {
      label: "Top Recommendation",
      value: kpis.topRecommendation || "N/A",
      formatter: (val) => val,
      subtitle: "Most Likely Purchase",
      variant: "info",
      icon: "⭐",
    },
    {
      label: "Purchase Window",
      value: kpis.avgPurchaseWindow || 0,
      formatter: (val) => `${val} days`,
      subtitle: "Avg. Time to Purchase",
      variant: kpis.avgPurchaseWindow < 20 ? "success" : kpis.avgPurchaseWindow < 40 ? "warning" : "info",
      icon: "⏰",
    },
    {
      label: "Prediction Coverage",
      value: kpis.predictionCoverage || 0,
      formatter: (val) => `${val.toFixed(1)}%`,
      subtitle: "Customers with Predictions",
      variant: kpis.predictionCoverage > 90 ? "success" : kpis.predictionCoverage > 70 ? "warning" : "danger",
      icon: "📊",
    },
    {
      label: "Active Customers",
      value: kpis.activeCustomers || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: "Prediction Candidates",
      variant: "default",
      icon: "👥",
    },
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
        <KpiTile key={index} {...tile} isLoading={isLoading} />
      ))}
    </div>
  );
};

export default NextPurchaseKPITiles; 