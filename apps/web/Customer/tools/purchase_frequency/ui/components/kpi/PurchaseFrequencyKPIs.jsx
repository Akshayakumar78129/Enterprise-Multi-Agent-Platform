import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const PurchaseFrequencyKPIs = ({ kpis, isLoading = false, onKPIClick = null }) => {
  if (!kpis) return null;

  const tiles = [
    {
      id: "total-customers",
      label: "Total Customers",
      value: kpis.totalCustomers || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: "Active customer base",
      variant: "default",
      icon: "👥",
      trend: null, // Can be enhanced with historical data
      onClick: () => onKPIClick && onKPIClick("total-customers")
    },
    {
      id: "avg-frequency",
      label: "Avg Purchase Frequency",
      value: kpis.avgPurchaseFrequency || 0,
      formatter: (val) => val.toFixed(2),
      subtitle: "Purchases per customer",
      variant: "frequency",
      icon: "🔄",
      miniVis: "sparkline", // Can be implemented with 6-month trend data
      alert: kpis.avgPurchaseFrequency && kpis.avgPurchaseFrequency < 2 ? "warning" : null,
      onClick: () => onKPIClick && onKPIClick("frequency")
    },
    {
      id: "avg-days-between",
      label: "Avg Days Between",
      value: kpis.avgDaysBetween || 0,
      formatter: (val) => val.toFixed(1) + " days",
      subtitle: "Purchase intervals",
      variant: "interval",
      icon: "📅",
      progress: kpis.avgDaysBetween ? Math.min((365 - kpis.avgDaysBetween) / 365 * 100, 100) : 0,
      alert: kpis.avgDaysBetween && kpis.avgDaysBetween > 180 ? "warning" : null,
      onClick: () => onKPIClick && onKPIClick("intervals")
    },
    {
      id: "active-customers",
      label: "Active Customers (90d)",
      value: kpis.activeCustomerPercentage || 0,
      formatter: (val) => val.toFixed(1) + "%",
      subtitle: "Recent activity",
      variant: "percentage",
      icon: "⚡",
      gauge: {
        value: kpis.activeCustomerPercentage || 0,
        max: 100,
        color: kpis.activeCustomerPercentage && kpis.activeCustomerPercentage < 25 ? "#e930ff" : "#00e0ff"
      },
      alert: kpis.activeCustomerPercentage && kpis.activeCustomerPercentage < 25 ? "critical" : null,
      onClick: () => onKPIClick && onKPIClick("active")
    },
    {
      id: "high-value",
      label: "High Value Customers",
      value: kpis.highValuePercentage || 0,
      formatter: (val) => val.toFixed(1) + "%",
      subtitle: "Premium segment",
      variant: "value",
      icon: "💎",
      animation: "count-up",
      miniBar: {
        current: kpis.highValuePercentage || 0,
        previous: 0 // Can be enhanced with comparison data
      },
      onClick: () => onKPIClick && onKPIClick("high-value")
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
        padding: "0 4px"
      }}
    >
      {tiles.map((tile) => (
        <KpiTile 
          key={tile.id} 
          {...tile} 
          isLoading={isLoading}
          style={{
            cursor: onKPIClick ? "pointer" : "default",
            transition: "all 0.2s ease",
            ...(onKPIClick && {
              ":hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
              }
            })
          }}
        />
      ))}
    </div>
  );
};

export default PurchaseFrequencyKPIs; 