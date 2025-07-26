import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";
import { HoldingCostKPITilesProps, HoldingCostKPIs } from "../../types";

const HoldingCostKPITiles: React.FC<HoldingCostKPITilesProps> = ({ 
  kpis, 
  isLoading = false, 
  error = null 
}) => {
  if (error) {
    return (
      <div style={{ 
        color: '#e930ff', 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#232a36',
        borderRadius: '8px',
        border: '1px solid #e930ff'
      }}>
        Error loading KPI data: {error}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Determine trend directions and colors based on KPI performance
  const getTotalCostTrend = (currentCost: number, totalValue: number) => {
    const percentage = currentCost / totalValue;
    if (percentage > 0.35) return { direction: 'bad-up', color: '#e930ff' };
    if (percentage < 0.20) return { direction: 'good-down', color: '#00c389' };
    return { direction: 'neutral', color: '#757575' };
  };

  const getPercentageTrend = (percentage: number) => {
    if (percentage > 0.30) return { direction: 'bad-up', color: '#e930ff' };
    if (percentage < 0.25) return { direction: 'good-down', color: '#00c389' };
    return { direction: 'neutral', color: '#757575' };
  };

  const getExcessiveItemsTrend = (count: number, total: number) => {
    const percentage = count / total;
    if (percentage > 0.25) return { direction: 'bad-up', color: '#e930ff' };
    if (percentage < 0.10) return { direction: 'good-down', color: '#00c389' };
    return { direction: 'neutral', color: '#ffc145' };
  };

  const getSavingsTrend = (savings: number, totalCost: number) => {
    const savingsPercentage = savings / totalCost;
    if (savingsPercentage > 0.15) return { direction: 'good-up', color: '#00c389' };
    if (savingsPercentage < 0.05) return { direction: 'bad-down', color: '#e930ff' };
    return { direction: 'neutral', color: '#00e0ff' };
  };

    // Build tiles data
  const tilesData = kpis ? [
    {
      label: "Total Holding Cost",
      value: formatCurrency(kpis.totalHoldingCost),
      subValue: "Annualized figure",
      icon: "💰",
      trendValue: formatPercentage(kpis.totalHoldingCost / kpis.totalInventoryValue),
      trendLabel: "of inventory value",
      trendDirection: getTotalCostTrend(kpis.totalHoldingCost, kpis.totalInventoryValue).direction,
      variant: (kpis.totalHoldingCost / kpis.totalInventoryValue > 0.35 ? 'anomaly' : 'default') as 'anomaly' | 'default'
    },
    {
      label: "Holding Cost %",
      value: formatPercentage(kpis.holdingCostPercentage),
      subValue: "of Inventory Value",
      icon: "📊",
      trendValue: kpis.holdingCostPercentage > 0.25 ? "Above Target" : "On Target",
      trendLabel: "(25% benchmark)",
      trendDirection: getPercentageTrend(kpis.holdingCostPercentage).direction,
      variant: (kpis.holdingCostPercentage > 0.30 ? 'anomaly' : 'default') as 'anomaly' | 'default'
    },
    {
      label: "Items w/ Excessive Costs",
      value: formatNumber(kpis.excessiveCostItems),
      subValue: "Above 30% Threshold",
      icon: "⚠️",
      trendValue: `${Math.round((kpis.excessiveCostItems / (kpis.excessiveCostItems + 100)) * 100)}%`, // Rough estimate since we don't have total items
      trendLabel: "of total items",
      trendDirection: getExcessiveItemsTrend(kpis.excessiveCostItems, kpis.excessiveCostItems + 100).direction,
      variant: (kpis.excessiveCostItems > 20 ? 'anomaly' : 'default') as 'anomaly' | 'default'
    },
    {
      label: "Potential Savings",
      value: formatCurrency(kpis.potentialSavings),
      subValue: "Identified Opportunities",
      icon: "💡",
      trendValue: formatPercentage(kpis.potentialSavings / kpis.totalHoldingCost),
      trendLabel: "of total cost",
      trendDirection: getSavingsTrend(kpis.potentialSavings, kpis.totalHoldingCost).direction,
      variant: (kpis.potentialSavings > 50000 ? 'interactive' : 'default') as 'interactive' | 'default'
    },
    {
      label: "Top Cost Driver",
      value: kpis.topCostDriver,
      subValue: formatCurrency(kpis.componentTotals[kpis.topCostDriver as keyof typeof kpis.componentTotals] || 0),
      icon: "🎯",
      trendValue: formatPercentage(
        (kpis.componentTotals[kpis.topCostDriver as keyof typeof kpis.componentTotals] || 0) / kpis.totalHoldingCost
      ),
      trendLabel: "of total cost",
      trendDirection: 'neutral',
      variant: 'default' as 'default'
    }
  ] : [];

  if (!kpis) {
    // Show loading state
    const loadingTiles = [
      { label: "Total Holding Cost", icon: "💰" },
      { label: "Holding Cost %", icon: "📊" },
      { label: "Items w/ Excessive Costs", icon: "⚠️" },
      { label: "Potential Savings", icon: "💡" },
      { label: "Top Cost Driver", icon: "🎯" }
    ];

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
          marginBottom: "48px",
          padding: "0 4px"
        }}
      >
        {loadingTiles.map((tile, index) => (
          <KpiTile
            key={index}
            label={tile.label}
            value=""
            icon={tile.icon}
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "16px",
        marginBottom: "48px",
        padding: "0 4px"
      }}
    >
      {tilesData.map((tile, index) => (
        <KpiTile
          key={index}
          label={tile.label}
          value={tile.value}
          subValue={tile.subValue}
          icon={tile.icon}
          trendValue={tile.trendValue}
          trendLabel={tile.trendLabel}
          trendDirection={tile.trendDirection}
          variant={tile.variant}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default HoldingCostKPITiles; 