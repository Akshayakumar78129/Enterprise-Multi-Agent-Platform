import React from 'react';
import styles from './KPITiles.module.css';

interface KPIData {
  value: number;
  label: string;
  unit: string;
  trend?: string;
  count?: number;
  description?: string;
}

interface KPITilesProps {
  kpis: {
    inventoryHealth: KPIData;
    totalValue: KPIData;
    slowMoving: KPIData;
    stockoutRisk: KPIData;
    savingsOpportunity: KPIData;
  };
  onKPIClick: (data: any, type: string) => void;
}

const KPITiles: React.FC<KPITilesProps> = ({ kpis, onKPIClick }) => {
  if (!kpis) return null;

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'items') {
      return value.toString();
    }
    return value.toString();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendClass = (trend: string, isPositiveGood: boolean = true) => {
    if (trend === 'up') {
      return isPositiveGood ? styles.trendPositive : styles.trendNegative;
    }
    if (trend === 'down') {
      return isPositiveGood ? styles.trendNegative : styles.trendPositive;
    }
    return styles.trendNeutral;
  };

  const tiles = [
    {
      key: 'inventoryHealth',
      data: kpis.inventoryHealth,
      icon: '💚',
      colorClass: styles.health,
      isPositiveGood: true,
      showGauge: true
    },
    {
      key: 'totalValue',
      data: kpis.totalValue,
      icon: '💰',
      colorClass: styles.value,
      isPositiveGood: true,
      showGauge: false
    },
    {
      key: 'slowMoving',
      data: kpis.slowMoving,
      icon: '⏳',
      colorClass: styles.slowMoving,
      isPositiveGood: false,
      showGauge: false,
      showCount: true
    },
    {
      key: 'stockoutRisk',
      data: kpis.stockoutRisk,
      icon: '⚠️',
      colorClass: styles.stockout,
      isPositiveGood: false,
      showGauge: false
    },
    {
      key: 'savingsOpportunity',
      data: kpis.savingsOpportunity,
      icon: '💎',
      colorClass: styles.savings,
      isPositiveGood: true,
      showGauge: false
    }
  ];

  return (
    <div className={styles.kpiContainer}>
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className={`${styles.kpiTile} ${tile.colorClass}`}
          onClick={() => onKPIClick(tile.data, tile.key)}
          title={tile.data.description || `Click for AI insights on ${tile.data.label}`}
        >
          <div className={styles.kpiHeader}>
            <span className={styles.kpiIcon}>{tile.icon}</span>
            <span className={`${styles.kpiTrend} ${getTrendClass(tile.data.trend || 'stable', tile.isPositiveGood)}`}>
              {getTrendIcon(tile.data.trend || 'stable')}
            </span>
          </div>
          
          <div className={styles.kpiContent}>
            {tile.showGauge && (
              <div className={styles.gaugeContainer}>
                <svg className={styles.gauge} viewBox="0 0 100 50">
                  <path
                    d="M 10 45 A 35 35 0 0 1 90 45"
                    fill="none"
                    stroke="rgba(0, 224, 255, 0.1)"
                    strokeWidth="8"
                  />
                  <path
                    d="M 10 45 A 35 35 0 0 1 90 45"
                    fill="none"
                    stroke={tile.data.value > 80 ? '#00ff88' : tile.data.value > 60 ? '#ffd600' : '#ff5252'}
                    strokeWidth="8"
                    strokeDasharray={`${(tile.data.value / 100) * 110} 110`}
                    strokeLinecap="round"
                  />
                  <text x="50" y="40" textAnchor="middle" className={styles.gaugeValue}>
                    {tile.data.value.toFixed(0)}%
                  </text>
                </svg>
              </div>
            )}
            
            {!tile.showGauge && (
              <div className={styles.kpiValue}>
                {formatValue(tile.data.value, tile.data.unit)}
              </div>
            )}
            
            <div className={styles.kpiLabel}>
              {tile.data.label}
            </div>
            
            {tile.showCount && tile.data.count !== undefined && (
              <div className={styles.kpiSubtext}>
                {tile.data.count} items
              </div>
            )}
          </div>
          
          <div className={styles.kpiFooter}>
            <span className={styles.clickHint}>Click for insights</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPITiles;