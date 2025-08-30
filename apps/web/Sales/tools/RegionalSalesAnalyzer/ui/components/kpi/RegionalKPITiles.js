import React, { useState, useEffect } from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

// Import CSS Module
import styles from "../../styles/RegionalSalesAnalyzerDashboard.module.css";

const RegionalKPITiles = ({ 
  kpis, 
  isLoading = false, 
  comparisonPeriod = 'none',
  onKPIClick = null,
  onShowAIInsight = null,
  filters = null
}) => {
  const [previousValues, setPreviousValues] = useState({});
  const [animatingTiles, setAnimatingTiles] = useState(new Set());
  const [previousFilters, setPreviousFilters] = useState(null);

  // Track value changes and trigger animations
  useEffect(() => {
    if (!kpis || isLoading) return;

    const currentValues = {
      totalSales: kpis.totalRevenue || kpis.totalSales || 0,
      topRegion: kpis.topRegions?.[0]?.totalSales || 0,
      coverage: kpis.uniqueCountries || kpis.countryCount || 0,
      concentration: kpis.concentrationRatio || 0,
      opportunities: kpis.growthOpportunities || 0
    };

    // Check if filters have changed (indicating a filter was applied)
    const filtersChanged = previousFilters && filters && 
      JSON.stringify(previousFilters) !== JSON.stringify(filters);

    // Only check for changes if we have previous values and filters changed
    if (Object.keys(previousValues).length > 0 && filtersChanged) {
      const newAnimatingTiles = new Set();
      Object.keys(currentValues).forEach(key => {
        if (previousValues[key] !== currentValues[key]) {
          newAnimatingTiles.add(key);
        }
      });

      // If filters changed, animate all tiles regardless of value changes
      if (filtersChanged) {
        Object.keys(currentValues).forEach(key => {
          newAnimatingTiles.add(key);
        });
      }

      if (newAnimatingTiles.size > 0) {
        setAnimatingTiles(newAnimatingTiles);
        // Clear animations after they complete
        setTimeout(() => {
          setAnimatingTiles(new Set());
        }, 1200);
      }
    }

    setPreviousValues(currentValues);
    setPreviousFilters(filters);
  }, [kpis, isLoading, filters]);

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

  const handleTileClick = (e, tileId, tileData) => {
    // Call the global addAIInsightToChat for Shift+Click multi-selection
    if (typeof window !== 'undefined' && window.addAIInsightToChat) {
      const tile = tiles.find(t => t.id === tileId);
      if (tile) {
        const formattedValue = tile.formatter ? tile.formatter(tile.value) : tile.value;
        
        window.addAIInsightToChat({
          label: tile.label,
          value: formattedValue,
          chartType: 'KPI Tile',
          originalEvent: e,
          metadata: {
            tileId,
            rawValue: tile.value,
            trend: tile.trend,
            ...tileData
          }
        });
        
        console.log('📊 KPI tile clicked:', {
          tile: tile.label,
          value: formattedValue,
          shiftKey: e.shiftKey
        });
      }
    }
    
    // Keep existing callbacks for compatibility
    if (onShowAIInsight) {
      onShowAIInsight(e, 'kpi', tileId, tileData);
    } else if (onKPIClick) {
      onKPIClick(tileId);
    }
  };

  const tiles = [
    {
      id: 'totalSales',
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
      data: {
        value: kpis.totalRevenue || kpis.totalSales || 0,
        trend: kpis.growthRate ? {
          direction: kpis.growthRate > 0 ? 'up' : kpis.growthRate < 0 ? 'down' : 'stable',
          value: Math.abs(kpis.growthRate),
          period: 'vs last period'
        } : null
      }
    },
    {
      id: 'topRegion',
      label: "Top Performing Region",
      value: getTopRegionName(),
      formatter: (val) => val,
      subtitle: formatCurrency(getTopRegionSales()),
      variant: "secondary",
      icon: "🏆",
      compactValue: true,
      data: {
        value: getTopRegionName(),
        sales: getTopRegionSales()
      }
    },
    {
      id: 'coverage',
      label: "Regional Coverage",
      value: kpis.uniqueCountries || kpis.countryCount || 0,
      formatter: (val) => `${val} Countries`,
      subtitle: `${kpis.uniqueStates || kpis.stateCount || 0} states/provinces`,
      variant: "default",
      icon: "🌍",
      data: {
        countries: kpis.uniqueCountries || kpis.countryCount || 0,
        states: kpis.uniqueStates || kpis.stateCount || 0
      }
    },
    {
      id: 'concentration',
      label: "Market Concentration",
      value: kpis.concentrationRatio || 0,
      formatter: (val) => `${val.toFixed(1)}%`,
      subtitle: `${getConcentrationLevel()} concentration`,
      variant: "default",
      icon: "📊",
      data: {
        value: kpis.concentrationRatio || 0,
        level: getConcentrationLevel()
      }
    },
    {
      id: 'opportunities',
      label: "Growth Opportunities",
      value: kpis.growthOpportunities || 0,
      formatter: (val) => `${val} Regions`,
      subtitle: "High potential areas",
      variant: "accent",
      icon: "🚀",
      data: {
        value: kpis.growthOpportunities || 0
      }
    }
  ];

  // Custom KPI Tile Component with animations
  const StandardKpiTile = ({ 
    label, 
    value, 
    trend, 
    variant = 'default', 
    isLoading = false, 
    onClick,
    animationDelay = 0,
    icon,
    formatter = (val) => val,
    id,
    subtitle,
    isAnimating = false
  }) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary': return 'kpi-primary';
        case 'secondary': return 'kpi-secondary';
        case 'accent': return 'kpi-accent';
        default: return 'kpi-default';
      }
    };

    const handleTileClick = (e) => {
      if (onClick) {
        onClick(e);
      }
    };

    if (isLoading) {
      return (
        <div 
          className={`${styles.standardKpiTile} ${styles.chartLoading}`}
          style={{ 
            animationDelay: `${animationDelay}ms`,
            animation: 'counterUp 0.6s ease both'
          }}
        >
          Loading...
        </div>
      );
    }

    return (
      <div 
        className={`${styles.standardKpiTile} ${getVariantClasses()}`}
        onClick={handleTileClick}
        style={{ 
          cursor: 'pointer',
          animationDelay: `${animationDelay}ms`,
          animation: isAnimating 
            ? 'counterUp 0.6s ease both, float 0.8s ease-in-out' 
            : 'counterUp 0.6s ease both',
          position: 'relative',
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          boxShadow: isAnimating 
            ? '0 8px 32px rgba(0, 224, 255, 0.4), 0 0 20px rgba(0, 224, 255, 0.3)' 
            : undefined
        }}
      >
        <div className={styles.kpiHeader}>
          {icon && (
            <span className={styles.kpiIcon}>{icon}</span>
          )}
          <div className={styles.kpiLabel}>{label}</div>
        </div>
        
        <div className={styles.kpiValue}>
          {formatter(value)}
        </div>
        
        {subtitle && (
          <div style={{ 
            fontSize: '12px', 
            color: '#9fb7d8', 
            marginBottom: '8px' 
          }}>
            {subtitle}
          </div>
        )}
        
        {trend && (
          <div className={`${styles.kpiTrend} ${
            trend.value > 0 ? styles.positive : 
            trend.value < 0 ? styles.negative : styles.neutral
          }`}>
            <span>{trend.value > 0 ? '↗' : trend.value < 0 ? '↘' : '→'}</span>
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.kpiGrid}>
        {[...Array(5)].map((_, index) => (
          <StandardKpiTile
            key={index}
            label="Loading..."
            value={0}
            isLoading={true}
            animationDelay={index * 150}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.kpiGrid}>
      {tiles.map((tile, index) => (
        <StandardKpiTile 
          key={index} 
          {...tile} 
          isLoading={isLoading}
          animationDelay={index * 150}
          isAnimating={animatingTiles.has(tile.id)}
          onClick={(e) => handleTileClick(e, tile.id, tile.data)}
        />
      ))}
    </div>
  );
};

export default RegionalKPITiles; 