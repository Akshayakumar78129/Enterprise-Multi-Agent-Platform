import React, { useMemo } from 'react';
import { LiquidityTimelineData, formatCurrency } from '../../api/cashFlowApi';
import styles from './LiquidityTimeline.module.css';

interface LiquidityTimelineProps {
  data: LiquidityTimelineData[];
  onPointClick?: (data: LiquidityTimelineData, chartType: string) => void;
}

const LiquidityTimeline: React.FC<LiquidityTimelineProps> = ({ data, onPointClick }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { points: [], minValue: 0, maxValue: 100, width: 800 };
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const values = sortedData.map(d => d.cash_balance);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 100000);
    const range = maxValue - minValue || 100000;
    
    const width = Math.max(800, sortedData.length * 60);
    const chartHeight = 300;
    
    const points = sortedData.map((item, index) => {
      const x = (index / (sortedData.length - 1)) * (width - 100) + 50;
      const y = chartHeight - ((item.cash_balance - minValue) / range) * (chartHeight - 40) - 20;
      
      return {
        ...item,
        x,
        y,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        isAlert: item.liquidity_status === 'critical' || item.liquidity_status === 'warning'
      };
    });
    
    return { points, minValue, maxValue, width };
  }, [data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#ff5252';
      case 'warning': return '#ffd600';
      case 'healthy': return '#00ff88';
      default: return '#00e0ff';
    }
  };

  const getThresholdY = (value: number) => {
    const { minValue, maxValue } = processedData;
    const range = maxValue - minValue || 100000;
    return 300 - ((value - minValue) / range) * 260 - 20;
  };

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Liquidity Risk & Covenant Dashboard</h3>
          <p className={styles.subtitle}>Strategic Liquidity Management and Stress Testing</p>
        </div>
        <div className={styles.emptyState}>
          <p>No liquidity timeline data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Liquidity Risk & Covenant Dashboard</h3>
        <p className={styles.subtitle}>Strategic Liquidity Management and Stress Testing</p>
      </div>

      <div className={styles.chartContainer}>
        <svg 
          className={styles.chart}
          viewBox={`0 0 ${processedData.width} 400`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="liquidityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#00e0ff', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#00e0ff', stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>
          
          {/* Background grid */}
          <g className={styles.grid}>
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="50"
                y1={60 + i * 60}
                x2={processedData.width - 50}
                y2={60 + i * 60}
                stroke="rgba(247, 249, 251, 0.1)"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Threshold lines */}
          <line
            x1="50"
            y1={getThresholdY(50000)}
            x2={processedData.width - 50}
            y2={getThresholdY(50000)}
            stroke="#ff5252"
            strokeWidth="2"
            strokeDasharray="4,4"
            className={styles.thresholdLine}
          />
          <text
            x="55"
            y={getThresholdY(50000) - 5}
            className={styles.thresholdLabel}
            fill="#ff5252"
          >
            Critical: $50K
          </text>

          <line
            x1="50"
            y1={getThresholdY(100000)}
            x2={processedData.width - 50}
            y2={getThresholdY(100000)}
            stroke="#ffd600"
            strokeWidth="2"
            strokeDasharray="4,4"
            className={styles.thresholdLine}
          />
          <text
            x="55"
            y={getThresholdY(100000) - 5}
            className={styles.thresholdLabel}
            fill="#ffd600"
          >
            Target: $100K
          </text>

          {/* Area under curve */}
          {processedData.points.length > 1 && (
            <path
              d={`M 50 320 ${processedData.points.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${processedData.points[processedData.points.length - 1].x} 320 Z`}
              fill="url(#liquidityGradient)"
            />
          )}

          {/* Main timeline */}
          {processedData.points.length > 1 && (
            <path
              d={`M ${processedData.points[0].x} ${processedData.points[0].y} ${processedData.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
              stroke="#00e0ff"
              strokeWidth="3"
              fill="none"
              className={styles.mainLine}
            />
          )}

          {/* Data points */}
          {processedData.points.map((point, index) => (
            <g key={`${point.date}-${index}`}>
              {/* Point circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={point.isAlert ? "8" : "5"}
                fill={getStatusColor(point.liquidity_status)}
                className={styles.dataPoint}
                onClick={() => onPointClick?.(point, 'liquidity_timeline')}
              />
              
              {/* Alert indicator */}
              {point.isAlert && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="none"
                  stroke={getStatusColor(point.liquidity_status)}
                  strokeWidth="2"
                  className={styles.alertRing}
                />
              )}

              {/* Date label */}
              <text
                x={point.x}
                y="340"
                textAnchor="middle"
                className={styles.dateLabel}
                fill="rgba(247, 249, 251, 0.7)"
              >
                {point.displayDate}
              </text>

              {/* Value on hover area */}
              <rect
                x={point.x - 20}
                y={point.y - 20}
                width="40"
                height="40"
                fill="transparent"
                className={styles.hoverArea}
                onClick={() => onPointClick?.(point, 'liquidity_timeline')}
              >
                <title>{`${point.displayDate}: ${formatCurrency(point.cash_balance)}\nStatus: ${point.liquidity_status}\nDaily Change: ${formatCurrency(point.daily_change)}`}</title>
              </rect>
            </g>
          ))}

          {/* Y-axis labels */}
          {[0, 25000, 50000, 100000, 200000].map(value => (
            <g key={value}>
              <text
                x="45"
                y={getThresholdY(value) + 4}
                textAnchor="end"
                className={styles.yAxisLabel}
                fill="rgba(247, 249, 251, 0.6)"
              >
                {formatCurrency(value, true)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Statistics Panel */}
      <div className={styles.statsPanel}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Current Balance:</span>
          <span className={styles.statValue}>
            {formatCurrency(processedData.points[processedData.points.length - 1]?.cash_balance || 0)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>7-Day Volatility:</span>
          <span className={styles.statValue}>
            {(processedData.points[processedData.points.length - 1]?.volatility_7d || 0).toFixed(1)}%
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Days Below Target:</span>
          <span className={styles.statValue}>
            {processedData.points.filter(p => p.cash_balance < 100000).length}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Critical Days:</span>
          <span className={styles.statValue} style={{ color: '#ff5252' }}>
            {processedData.points.filter(p => p.liquidity_status === 'critical').length}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#00ff88' }}></div>
          <span>Healthy</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#ffd600' }}></div>
          <span>Warning</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#ff5252' }}></div>
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
};

export default LiquidityTimeline;