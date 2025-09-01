import React from 'react';
import styles from './KPITiles.module.css';

interface KPIData {
  value: number | string;
  label: string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  benchmark?: number;
  status: 'good' | 'warning' | 'critical';
  description?: string;
}

interface KPITilesProps {
  kpis: {
    workingCapitalROI: KPIData;
    economicValueLost: KPIData;
    cashVelocityScore: KPIData;
    concentrationRisk: KPIData;
    collectionROI: KPIData;
  };
  onKPIClick: (data: any, type: string) => void;
  className?: string;
}

const KPITiles: React.FC<KPITilesProps> = ({ kpis, onKPIClick, className }) => {
  if (!kpis) return null;

  const formatValue = (value: number | string, unit?: string) => {
    if (typeof value === 'string') return value;
    
    if (unit === '$' && value > 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (unit === '$' && value > 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === ':1') {
      return `${value}:1`;
    }
    return value.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#00e0ff';
      case 'warning': return '#ffc145';
      case 'critical': return '#e930ff';
      default: return '#8892a8';
    }
  };

  const getTrendIcon = (trend?: string, change?: number) => {
    if (!trend || !change) return null;
    
    const changeText = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    const trendClass = trend === 'up' ? styles.trendUp : trend === 'down' ? styles.trendDown : styles.trendStable;
    
    return (
      <span className={`${styles.trend} ${trendClass}`}>
        {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {changeText}
      </span>
    );
  };

  const kpiData = [
    {
      id: 'workingCapitalROI',
      title: 'Working Capital ROI',
      data: kpis.workingCapitalROI,
      icon: '📊',
      subtitle: 'vs. cost of capital'
    },
    {
      id: 'economicValueLost',
      title: 'Economic Value Lost',
      data: kpis.economicValueLost,
      icon: '⚠️',
      subtitle: 'Monthly value erosion'
    },
    {
      id: 'cashVelocityScore',
      title: 'Cash Velocity Score',
      data: kpis.cashVelocityScore,
      icon: '⚡',
      subtitle: 'vs. top quartile: 75'
    },
    {
      id: 'concentrationRisk',
      title: 'Concentration Risk',
      data: kpis.concentrationRisk,
      icon: '🎯',
      subtitle: 'Portfolio diversification'
    },
    {
      id: 'collectionROI',
      title: 'Collection ROI',
      data: kpis.collectionROI,
      icon: '💰',
      subtitle: 'Return per dollar spent'
    }
  ];

  return (
    <div className={`${styles.kpiContainer} ${className || ''}`}>
      {kpiData.map((kpi) => (
        <div
          key={kpi.id}
          className={styles.kpiTile}
          onClick={() => onKPIClick(kpi.data, kpi.id)}
          style={{ borderColor: getStatusColor(kpi.data.status) + '40' }}
        >
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIcon}>{kpi.icon}</div>
            <div className={styles.kpiTitle}>{kpi.title}</div>
          </div>
          
          <div className={styles.kpiValue} style={{ color: getStatusColor(kpi.data.status) }}>
            {formatValue(kpi.data.value, kpi.data.unit)}
          </div>
          
          <div className={styles.kpiSubtitle}>
            {kpi.subtitle}
            {getTrendIcon(kpi.data.trend, kpi.data.change)}
          </div>
          
          {kpi.data.benchmark && (
            <div className={styles.kpiBenchmark}>
              Benchmark: {formatValue(kpi.data.benchmark, kpi.data.unit)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPITiles;