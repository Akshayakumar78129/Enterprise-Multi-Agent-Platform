import React from "react";

const InventoryKPITiles = ({ kpis, isLoading = false }) => {
  if (!kpis) return null;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toLocaleString()}`;
  };

  const formatPercentage = (num) => `${num.toFixed(1)}%`;

  const tiles = [
    {
      label: "Overall Stock Health",
      value: formatPercentage(kpis.overallStockHealth || 0),
      subtitle: "Inventory Health",
      variant: kpis.overallStockHealth >= 70 ? "good" : kpis.overallStockHealth >= 50 ? "warning" : "critical",
      icon: "📊",
    },
    {
      label: "Items at Risk",
      value: formatNumber(kpis.itemsAtRisk || 0),
      subtitle: "Stockout Risk",
      variant: kpis.itemsAtRisk <= 10 ? "good" : kpis.itemsAtRisk <= 25 ? "warning" : "critical",
      icon: "⚠️",
    },
    {
      label: "Average Days Supply",
      value: `${(kpis.avgDaysSupply || 0).toFixed(1)}`,
      subtitle: "Across All Items",
      variant: kpis.avgDaysSupply >= 14 ? "good" : kpis.avgDaysSupply >= 7 ? "warning" : "critical",
      icon: "📅",
    },
    {
      label: "Value at Risk",
      value: formatCurrency(kpis.valueAtRisk || 0),
      subtitle: "Critical Items",
      variant: kpis.valueAtRisk <= 100000 ? "good" : kpis.valueAtRisk <= 500000 ? "warning" : "critical",
      icon: "💰",
    },
    {
      label: "Restock Priority",
      value: kpis.restockPriority || "None",
      subtitle: "Needs Attention",
      variant: kpis.restockPriority === "None" ? "good" : "warning",
      icon: "🎯",
    },
  ];

  const getVariantStyles = (variant) => {
    switch (variant) {
      case "good":
        return {
          backgroundColor: "#00e0ff20",
          borderColor: "#00e0ff",
          valueColor: "#00e0ff",
          iconBackground: "#00e0ff30"
        };
      case "warning":
        return {
          backgroundColor: "#ffc14520",
          borderColor: "#ffc145",
          valueColor: "#ffc145",
          iconBackground: "#ffc14530"
        };
      case "critical":
        return {
          backgroundColor: "#e930ff20",
          borderColor: "#e930ff",
          valueColor: "#e930ff",
          iconBackground: "#e930ff30"
        };
      default:
        return {
          backgroundColor: "#232a36",
          borderColor: "#3a4459",
          valueColor: "#f7f9fb",
          iconBackground: "#3a445930"
        };
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {tiles.map((tile, index) => {
        const styles = getVariantStyles(tile.variant);
        
        return (
          <div
            key={index}
            style={{
              width: "120px",
              height: "120px",
              backgroundColor: styles.backgroundColor,
              border: `1px solid ${styles.borderColor}`,
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${styles.borderColor}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "24px",
                height: "24px",
                backgroundColor: styles.iconBackground,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
              }}
            >
              {tile.icon}
            </div>

            {/* Value */}
            <div
              style={{
                fontSize: isLoading ? "24px" : "32px",
                fontWeight: "600",
                color: styles.valueColor,
                fontFamily: "Inter, sans-serif",
                lineHeight: "1",
                marginTop: "8px",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap"
              }}
            >
              {isLoading ? "..." : tile.value}
            </div>

            {/* Label and Subtitle */}
            <div style={{ marginTop: "auto" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "500",
                  color: "#f7f9fb",
                  fontFamily: "Inter, sans-serif",
                  marginBottom: "2px",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap"
                }}
              >
                {tile.label}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#f7f9fb90",
                  fontFamily: "Inter, sans-serif",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap"
                }}
              >
                {tile.subtitle}
              </div>
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#232a3680",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid #00e0ff30",
                    borderTop: "2px solid #00e0ff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InventoryKPITiles; 