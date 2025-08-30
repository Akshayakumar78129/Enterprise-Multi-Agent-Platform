import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const EngagementKPITiles = ({ kpis, isLoading = false, onTileClick }) => {
  if (!kpis) {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "16px",
        marginBottom: "24px",
      }}>
        {[...Array(5)].map((_, index) => (
          <KpiTile key={index} isLoading={true} />
        ))}
      </div>
    );
  }

  const tiles = [
    {
      label: "Total Customers",
      value: kpis.total_customers || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: `${kpis.engagement_distribution?.high || 0} High / ${kpis.engagement_distribution?.medium || 0} Medium / ${kpis.engagement_distribution?.low || 0} Low`,
      variant: "default",
      icon: "👥",
      onClick: () => onTileClick && onTileClick('total_customers'),
      trend: {
        value: 5.2,
        direction: "up",
        period: "vs last month"
      }
    },
    {
      label: "Avg Engagement Score",
      value: kpis.avg_engagement_score || 0,
      formatter: (val) => `${val}/10`,
      subtitle: "RFM-based score",
      variant: kpis.avg_engagement_score > 7 ? "success" : kpis.avg_engagement_score > 5 ? "warning" : "danger",
      icon: "📊",
      onClick: () => onTileClick && onTileClick('avg_engagement_score'),
      gauge: {
        value: (kpis.avg_engagement_score / 10) * 100,
        max: 100,
        color: kpis.avg_engagement_score > 7 ? "#00e0ff" : kpis.avg_engagement_score > 5 ? "#ffa726" : "#e930ff"
      }
    },
    {
      label: "Days Since Activity",
      value: kpis.avg_days_since_activity || 0,
      formatter: (val) => `${val} days`,
      subtitle: "Average across all customers",
      variant: kpis.avg_days_since_activity < 30 ? "success" : kpis.avg_days_since_activity < 90 ? "warning" : "danger",
      icon: "⏱️",
      onClick: () => onTileClick && onTileClick('avg_days_since_activity'),
      gauge: {
        segments: [
          { threshold: 30, color: "#00e0ff", label: "Recent" },
          { threshold: 90, color: "#ffa726", label: "Moderate" },
          { threshold: 365, color: "#e930ff", label: "Inactive" }
        ],
        value: kpis.avg_days_since_activity
      }
    },
    {
      label: "Engagement Trend",
      value: kpis.engagement_trend || "Stable",
      formatter: (val) => val,
      subtitle: "30-day direction",
      variant: kpis.engagement_trend === "Improving" ? "success" : kpis.engagement_trend === "Declining" ? "danger" : "warning",
      icon: kpis.engagement_trend === "Improving" ? "📈" : kpis.engagement_trend === "Declining" ? "📉" : "➡️",
      onClick: () => onTileClick && onTileClick('engagement_trend'),
      sparkline: {
        data: [65, 68, 72, 70, 74, 78, 75, 80], // Mock trend data
        color: kpis.engagement_trend === "Improving" ? "#00e0ff" : "#e930ff"
      }
    },
    {
      label: "Re-engagement Opportunities",
      value: kpis.reengagement_opportunities || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: "High-value inactive customers",
      variant: kpis.reengagement_opportunities > 50 ? "warning" : "default",
      icon: "🎯",
      onClick: () => onTileClick && onTileClick('reengagement_opportunities'),
      alert: kpis.reengagement_opportunities > 100 ? {
        message: "High priority opportunities available",
        pulse: true
      } : null
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
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

export default EngagementKPITiles; 