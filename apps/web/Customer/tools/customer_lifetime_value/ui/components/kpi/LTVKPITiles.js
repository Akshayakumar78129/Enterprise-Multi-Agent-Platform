import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const LTVKPITiles = ({ kpis, isLoading = false, onTileClick = null }) => {
  if (!kpis) return null;

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return "0%";
    return `${Math.round(value)}%`;
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0";
    return value.toLocaleString();
  };

  const getValueTier = (value) => {
    if (value >= 150000) return 'Premium';
    if (value >= 100000) return 'High';
    if (value >= 50000) return 'Medium';
    return 'Low';
  };

  const getAccuracyRating = (score) => {
    if (score >= 90) return '⭐⭐⭐⭐⭐';
    if (score >= 80) return '⭐⭐⭐⭐';
    if (score >= 70) return '⭐⭐⭐';
    if (score >= 60) return '⭐⭐';
    return '⭐';
  };

  const tiles = [
    {
      label: "Average LTV",
      value: formatCurrency(kpis.avg_ltv),
      formatter: (val) => val,
      subtitle: `Tier: ${getValueTier(kpis.avg_ltv)}`,
      variant: kpis.avg_ltv >= 100000 ? "success" : kpis.avg_ltv >= 50000 ? "warning" : "default",
      icon: "💰",
      trend: kpis.median_ltv < kpis.avg_ltv ? "up" : "stable",
      onClick: () => onTileClick && onTileClick('avg_ltv')
    },
    {
      label: "Median LTV",
      value: formatCurrency(kpis.median_ltv),
      formatter: (val) => val,
      subtitle: `vs Average: ${kpis.avg_ltv > kpis.median_ltv ? '+' : ''}${formatCurrency(kpis.avg_ltv - kpis.median_ltv)}`,
      variant: "default",
      icon: "📊",
      trend: kpis.avg_ltv > kpis.median_ltv ? "up" : "down",
      onClick: () => onTileClick && onTileClick('median_ltv')
    },
    {
      label: "Prediction Accuracy",
      value: formatPercentage(kpis.prediction_accuracy_score),
      formatter: (val) => val,
      subtitle: getAccuracyRating(kpis.prediction_accuracy_score),
      variant: kpis.prediction_accuracy_score >= 85 ? "success" : 
               kpis.prediction_accuracy_score >= 70 ? "warning" : "error",
      icon: "🎯",
      trend: kpis.prediction_accuracy_score >= 80 ? "up" : "stable",
      onClick: () => onTileClick && onTileClick('prediction_accuracy')
    },
    {
      label: "Top Value Region",
      value: kpis.top_value_region?.substring(0, 12) + (kpis.top_value_region?.length > 12 ? '...' : '') || "N/A",
      formatter: (val) => val,
      subtitle: `${formatPercentage(kpis.top_region_percentage)} of total value`,
      variant: "default",
      icon: "🏆",
      trend: kpis.top_region_percentage >= 20 ? "up" : "stable",
      onClick: () => onTileClick && onTileClick('top_region')
    },
    {
      label: "Premium Customers",
      value: formatNumber(kpis.premium_customers),
      formatter: (val) => val,
      subtitle: `${formatPercentage((kpis.premium_customers / kpis.total_customers) * 100)} of total`,
      variant: kpis.premium_customers >= 100 ? "success" : "default",
      icon: "👑",
      trend: (kpis.premium_customers / kpis.total_customers) >= 0.1 ? "up" : "stable",
      onClick: () => onTileClick && onTileClick('premium_customers')
    },
    {
      label: "Model Confidence",
      value: kpis.model_confidence || "Medium",
      formatter: (val) => val,
      subtitle: `${formatNumber(kpis.low_error_customers)} low error predictions`,
      variant: kpis.model_confidence === 'High' ? "success" : 
               kpis.model_confidence === 'Medium' ? "warning" : "error",
      icon: "🔬",
      trend: kpis.model_confidence === 'High' ? "up" : "stable",
      onClick: () => onTileClick && onTileClick('model_confidence')
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
            cursor: onTileClick ? 'pointer' : 'default',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            ...(onTileClick && {
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 224, 255, 0.2)'
              }
            })
          }}
        />
      ))}
    </div>
  );
};

export default LTVKPITiles; 