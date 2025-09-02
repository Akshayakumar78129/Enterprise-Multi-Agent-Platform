import React from 'react';
import styles from './KPITiles.module.css';

interface KPI {
  label: string;
  value: number | string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  status?: 'excellent' | 'good' | 'warning' | 'critical';
  subtitle?: string;
  formula?: string;
  benchmark?: number;
}

interface KPITilesProps {
  kpis?: {
    ruleOf40?: KPI;
    netRevenueRetention?: KPI;
    ltvCacRatio?: KPI;
    revenueQualityScore?: KPI;
    marketShareMomentum?: KPI;
  };
  onKPIClick?: (data: any, chartType: string) => void;
}

const KPITiles: React.FC<KPITilesProps> = ({ kpis, onKPIClick }) => {
  const defaultKPIs = {
    ruleOf40: {
      label: 'Rule of 40',
      value: kpis?.ruleOf40?.value || 45,
      unit: '',
      trend: kpis?.ruleOf40?.trend || { direction: 'up', value: '+3.2' },
      status: kpis?.ruleOf40?.status || 'good',
      subtitle: 'Growth + Profitability',
      formula: 'Revenue Growth % + EBITDA Margin %',
      benchmark: 40
    },
    netRevenueRetention: {
      label: 'Net Revenue Retention',
      value: kpis?.netRevenueRetention?.value || 115,
      unit: '%',
      trend: kpis?.netRevenueRetention?.trend || { direction: 'up', value: '+8%' },
      status: kpis?.netRevenueRetention?.status || 'excellent',
      subtitle: 'Revenue expansion',
      formula: '(Beginning ARR + Expansion - Contraction - Churn) / Beginning ARR'
    },
    ltvCacRatio: {
      label: 'LTV/CAC Ratio',
      value: kpis?.ltvCacRatio?.value || 3.2,
      unit: 'x',
      trend: kpis?.ltvCacRatio?.trend || { direction: 'up', value: '+0.5x' },
      status: kpis?.ltvCacRatio?.status || 'excellent',
      subtitle: 'Unit economics',
      formula: 'Customer Lifetime Value / Customer Acquisition Cost'
    },
    revenueQualityScore: {
      label: 'Revenue Quality Score',
      value: kpis?.revenueQualityScore?.value || 82,
      unit: '/100',
      trend: kpis?.revenueQualityScore?.trend || { direction: 'stable', value: '0' },
      status: kpis?.revenueQualityScore?.status || 'excellent',
      subtitle: 'Revenue sustainability',
      formula: 'Predictability + Low Concentration + Recurring %'
    },
    marketShareMomentum: {
      label: 'Market Share Momentum',
      value: kpis?.marketShareMomentum?.value || '+2.5',
      unit: 'pp',
      trend: kpis?.marketShareMomentum?.trend || { direction: 'up', value: '+0.8pp' },
      status: kpis?.marketShareMomentum?.status || 'good',
      subtitle: 'Competitive position',
      formula: 'Δ Company Growth - Δ Market Growth'
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent': return styles.excellent;
      case 'good': return styles.good;
      case 'warning': return styles.warning;
      case 'critical': return styles.critical;
      default: return styles.good;
    }
  };

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  const getGaugeRotation = (value: number, benchmark: number) => {
    const percentage = (value / (benchmark * 2)) * 180;
    return Math.min(180, Math.max(0, percentage));
  };

  const renderKPIVisual = (key: string, kpi: KPI) => {
    switch (key) {
      case 'ruleOf40':
        return (
          <div className={styles.gaugeContainer}>
            <svg width="60" height="40" viewBox="0 0 120 60">
              <path
                d="M 10 50 A 40 40 0 0 1 110 50"
                fill="none"
                stroke="rgba(0, 224, 255, 0.1)"
                strokeWidth="8"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 110 50"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="8"
                strokeDasharray={`${getGaugeRotation(Number(kpi.value), 40)} 180`}
              />
              <defs>
                <linearGradient id="gradient1">
                  <stop offset="0%" stopColor="#00e0ff" />
                  <stop offset="100%" stopColor="#e930ff" />
                </linearGradient>
              </defs>
              <line x1="60" y1="50" x2="60" y2="20" stroke="#f7f9fb" strokeWidth="2" 
                transform={`rotate(${getGaugeRotation(Number(kpi.value), 40) - 90} 60 50)`}
              />
            </svg>
            <div className={styles.benchmarkLine}>40</div>
          </div>
        );
      
      case 'netRevenueRetention':
        return (
          <div className={styles.waterfallMini}>
            <div className={styles.waterfallBar} style={{ height: '30px', background: '#00e0ff' }}>
              <span className={styles.waterfallLabel}>Start</span>
            </div>
            <div className={styles.waterfallBar} style={{ height: '40px', background: '#5fd4d6' }}>
              <span className={styles.waterfallLabel}>+Exp</span>
            </div>
            <div className={styles.waterfallBar} style={{ height: '35px', background: '#e930ff' }}>
              <span className={styles.waterfallLabel}>-Churn</span>
            </div>
            <div className={styles.waterfallBar} style={{ height: '38px', background: '#00e0ff' }}>
              <span className={styles.waterfallLabel}>Net</span>
            </div>
          </div>
        );
      
      case 'ltvCacRatio':
        return (
          <div className={styles.ratioMeter}>
            <div className={styles.ratioBar}>
              <div 
                className={styles.ratioFill} 
                style={{ width: `${Math.min(100, (Number(kpi.value) / 5) * 100)}%` }}
              />
              <div className={styles.ratioMarkers}>
                <span style={{ left: '40%' }}>2x</span>
                <span style={{ left: '60%' }}>3x</span>
                <span style={{ left: '100%' }}>5x</span>
              </div>
            </div>
          </div>
        );
      
      case 'revenueQualityScore':
        return (
          <div className={styles.qualityDiamond}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <polygon
                points="30,5 55,30 30,55 5,30"
                fill="rgba(0, 224, 255, 0.1)"
                stroke="rgba(0, 224, 255, 0.3)"
                strokeWidth="1"
              />
              <polygon
                points="30,5 55,30 30,55 5,30"
                fill="url(#gradient2)"
                opacity="0.8"
                transform={`scale(${Number(kpi.value) / 100}) translate(${30 - (Number(kpi.value) / 100 * 30)}, ${30 - (Number(kpi.value) / 100 * 30)})`}
              />
              <defs>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00e0ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#e930ff" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        );
      
      case 'marketShareMomentum':
        return (
          <div className={styles.momentumArrow}>
            <svg width="60" height="40" viewBox="0 0 60 40">
              <path
                d={Number(kpi.value) > 0 ? "M 10 30 L 30 10 L 50 20" : "M 10 10 L 30 30 L 50 20"}
                fill="none"
                stroke={Number(kpi.value) > 0 ? "#00e0ff" : "#e930ff"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polygon
                points={Number(kpi.value) > 0 ? "45,15 55,20 45,25" : "45,25 55,20 45,15"}
                fill={Number(kpi.value) > 0 ? "#00e0ff" : "#e930ff"}
              />
            </svg>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.kpiContainer}>
      {Object.entries(defaultKPIs).map(([key, kpi]) => (
        <div
          key={key}
          className={`${styles.kpiTile} ${getStatusColor(kpi.status)}`}
          onClick={() => onKPIClick && onKPIClick(kpi, 'kpi')}
        >
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            {kpi.trend && (
              <span className={`${styles.kpiTrend} ${styles[kpi.trend.direction]}`}>
                {getTrendIcon(kpi.trend.direction)} {kpi.trend.value}
              </span>
            )}
          </div>
          
          <div className={styles.kpiValue}>
            <span className={styles.valueNumber}>
              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
            </span>
            {kpi.unit && <span className={styles.valueUnit}>{kpi.unit}</span>}
          </div>
          
          <div className={styles.kpiVisual}>
            {renderKPIVisual(key, kpi)}
          </div>
          
          <div className={styles.kpiFooter}>
            <span className={styles.kpiSubtitle}>{kpi.subtitle}</span>
          </div>
          
          <div className={styles.kpiTooltip}>
            <p className={styles.tooltipFormula}>{kpi.formula}</p>
            {kpi.benchmark && (
              <p className={styles.tooltipBenchmark}>Benchmark: {kpi.benchmark}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPITiles;