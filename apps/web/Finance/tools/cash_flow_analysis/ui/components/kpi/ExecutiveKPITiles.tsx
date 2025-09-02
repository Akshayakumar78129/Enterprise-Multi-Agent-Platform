import React from 'react';
import { KPIMetric, formatCurrency, formatPercentage, getHealthStatusColor, getTrendIcon } from '../../api/cashFlowApi';
import styles from './ExecutiveKPITiles.module.css';

interface ExecutiveKPITilesProps {
  kpis: {
    freeCashFlow?: KPIMetric;
    fcfYield: KPIMetric;
    cashROIC: KPIMetric;
    cashConversionQuality: KPIMetric;
    liquidityCoverage: KPIMetric;
    maFirepower: KPIMetric;
    ebitdaMargin?: KPIMetric;
  } | null;
  onKPIClick: (kpi: KPIMetric, type: string) => void;
}

const ExecutiveKPITiles: React.FC<ExecutiveKPITilesProps> = ({ kpis, onKPIClick }) => {
  if (!kpis) {
    return (
      <div className={styles.kpiGrid}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.kpiTileSkeleton}>
            <div className={styles.skeletonHeader}></div>
            <div className={styles.skeletonValue}></div>
            <div className={styles.skeletonSubtitle}></div>
          </div>
        ))}
      </div>
    );
  }

  const renderKPITile = (key: string, kpi: KPIMetric, icon: string, additionalContent?: React.ReactNode) => (
    <div 
      key={key}
      className={styles.kpiTile}
      onClick={() => onKPIClick(kpi, key)}
    >
      <div className={styles.kpiHeader}>
        <span className={styles.kpiIcon}>{icon}</span>
        <span className={styles.kpiLabel}>{kpi.label}</span>
      </div>
      
      <div className={styles.kpiValue}>
        {kpi.unit === '$' ? formatCurrency(kpi.value, true) :
         kpi.unit === '%' ? formatPercentage(kpi.value) :
         kpi.unit === 'ratio' ? `${kpi.value.toFixed(1)}x` :
         kpi.value.toFixed(0)}
      </div>

      {additionalContent && (
        <div className={styles.kpiAdditional}>
          {additionalContent}
        </div>
      )}

      <div className={styles.kpiSubtitle}>
        {kpi.description}
      </div>

      <div className={styles.kpiTrend}>
        <span className={styles.trendIcon}>
          {getTrendIcon(kpi.trend)}
        </span>
        <span className={styles.trendLabel}>
          {kpi.trend.charAt(0).toUpperCase() + kpi.trend.slice(1)}
        </span>
      </div>
    </div>
  );

  return (
    <div className={styles.kpiGrid}>
      {/* Free Cash Flow */}
      {kpis.freeCashFlow ? renderKPITile(
        'freeCashFlow',
        kpis.freeCashFlow,
        '💰',
        <div className={styles.fcfDetails}>
          <div className={styles.fcfStatus} style={{ color: kpis.freeCashFlow.value > 0 ? '#00ff88' : '#ff5252' }}>
            {kpis.freeCashFlow.formatted || formatCurrency(kpis.freeCashFlow.value, true)}
          </div>
          <span className={styles.fcfLabel}>
            {kpis.freeCashFlow.status === 'positive' ? '✅ Cash Generating' : '⚠️ Cash Consuming'}
          </span>
        </div>
      ) : renderKPITile(
        'fcfYield',
        kpis.fcfYield,
        '💰',
        <div className={styles.fcfYieldGauge}>
          <div className={styles.gaugeContainer}>
            <div 
              className={styles.gaugeFill}
              style={{
                width: `${Math.min((kpis.fcfYield.value / (kpis.fcfYield.target || 20)) * 100, 100)}%`,
                backgroundColor: getHealthStatusColor(kpis.fcfYield.status || 'poor')
              }}
            />
          </div>
          <span className={styles.gaugeLabel}>
            Target: {formatPercentage(kpis.fcfYield.target || 15)}
          </span>
        </div>
      )}

      {/* Cash ROIC */}
      {renderKPITile(
        'cashROIC',
        kpis.cashROIC,
        '📈',
        <div className={styles.roicSpread}>
          <div className={styles.spreadContainer}>
            <span className={styles.spreadLabel}>vs. WACC {formatPercentage(kpis.cashROIC.wacc || 10)}</span>
            <span 
              className={styles.spreadValue}
              style={{ color: (kpis.cashROIC.spread || 0) > 0 ? '#00ff88' : '#ff5252' }}
            >
              {(kpis.cashROIC.spread || 0) > 0 ? '+' : ''}{formatPercentage(kpis.cashROIC.spread || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Cash Conversion Quality */}
      {renderKPITile(
        'cashConversionQuality',
        kpis.cashConversionQuality,
        '⚡',
        <div className={styles.qualityMeter}>
          <div className={styles.qualityScale}>
            {['Low', 'Medium', 'High'].map((level, idx) => (
              <div 
                key={level}
                className={`${styles.qualitySegment} ${
                  kpis.cashConversionQuality.quality === level.toLowerCase() ? styles.active : ''
                }`}
                style={{ backgroundColor: getHealthStatusColor(level.toLowerCase()) }}
              >
                {level}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liquidity Coverage Ratio */}
      {renderKPITile(
        'liquidityCoverage',
        kpis.liquidityCoverage,
        '🛡️',
        <div className={styles.liquidityGauge}>
          <div className={styles.safetGauge}>
            <div 
              className={styles.safetyFill}
              style={{
                width: `${Math.min((kpis.liquidityCoverage.value / 3) * 100, 100)}%`,
                backgroundColor: getHealthStatusColor(kpis.liquidityCoverage.status || 'weak')
              }}
            />
          </div>
          <span className={styles.safetyThreshold}>
            Covenant: {kpis.liquidityCoverage.threshold || 2.0}x
          </span>
        </div>
      )}

      {/* M&A Firepower */}
      {renderKPITile(
        'maFirepower',
        kpis.maFirepower,
        '🚀',
        <div className={styles.capacityMeter}>
          <div className={styles.capacityIndicator}>
            <div 
              className={`${styles.capacityStatus} ${styles[kpis.maFirepower.capacity || 'limited']}`}
            >
              {kpis.maFirepower.capacity?.charAt(0).toUpperCase() + 
               kpis.maFirepower.capacity?.slice(1) || 'Limited'}
            </div>
          </div>
          <span className={styles.capacityLabel}>Acquisition capacity</span>
        </div>
      )}
    </div>
  );
};

export default ExecutiveKPITiles;