import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const RegionalKPITiles = ({ 
  kpis, 
  isLoading = false, 
  comparisonPeriod = 'none',
  onKPIClick = null 
}) => {
  if (!kpis) return null;

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return "N/A";
    return `${value >= 0 ? '+' : ''}${value}%`;
  };

  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const getGrowthVariant = (growthRate) => {
    if (growthRate === null || growthRate === undefined) return "default";
    if (growthRate > 5) return "success";
    if (growthRate < -5) return "warning";
    return "default";
  };

  const getTopRegionName = () => {
    if (kpis.topRegions && kpis.topRegions.length > 0) {
      const top = kpis.topRegions[0];
      return `${top.state}, ${top.country}`;
    }
    return "N/A";
  };

  const getTopRegionSales = () => {
    if (kpis.topRegions && kpis.topRegions.length > 0) {
      return kpis.topRegions[0].totalSales;
    }
    return 0;
  };

  const getConcentrationLevel = () => {
    if (kpis.concentrationRatio >= 80) return "High";
    if (kpis.concentrationRatio >= 50) return "Medium";
    return "Low";
  };

  const tiles = [
    {
      label: "Total Regional Sales",
      value: kpis.totalRevenue || kpis.totalSales || 0,
      formatter: formatCurrency,
      subtitle: `${kpis.totalTransactions || 0} transactions`,
      variant: "primary",
      icon: "💰",
      trend: kpis.growthRate ? {
        value: kpis.growthRate,
        label: formatPercentage(kpis.growthRate),
        variant: getGrowthVariant(kpis.growthRate)
      } : null,
      onClick: () => onKPIClick && onKPIClick('totalSales')
    },
    {
      label: "Top Performing Region",
      value: getTopRegionName(),
      formatter: (val) => val,
      subtitle: formatCurrency(getTopRegionSales()),
      variant: "secondary",
      icon: "🏆",
      compactValue: true,
      onClick: () => onKPIClick && onKPIClick('topRegion')
    },
    {
      label: "Regional Coverage",
      value: kpis.uniqueCountries || kpis.countryCount || 0,
      formatter: (val) => `${val} Countries`,
      subtitle: `${kpis.uniqueStates || kpis.stateCount || 0} states/provinces`,
      variant: "default",
      icon: "🌍",
      onClick: () => onKPIClick && onKPIClick('coverage')
    },
    {
      label: "Market Concentration",
      value: kpis.concentrationRatio || 0,
      formatter: (val) => `${val.toFixed(1)}%`,
      subtitle: `${getConcentrationLevel()} concentration`,
      variant: "default",
      icon: "📊",
      onClick: () => onKPIClick && onKPIClick('concentration')
    },
    {
      label: "Growth Opportunities",
      value: kpis.growthOpportunities || 0,
      formatter: (val) => `${val} Regions`,
      subtitle: "High potential areas",
      variant: "accent",
      icon: "🚀",
      onClick: () => onKPIClick && onKPIClick('opportunities')
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
            cursor: tile.onClick ? 'pointer' : 'default',
          }}
        />
      ))}
    </div>
  );
};

export default RegionalKPITiles; 